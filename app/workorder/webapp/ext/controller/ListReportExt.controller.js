sap.ui.define([
  "sap/ui/core/mvc/ControllerExtension",
  "sap/ui/model/json/JSONModel",
  "sap/m/Dialog",
  "sap/m/Text",
  "sap/m/Button",
  "sap/m/VBox",
  "sap/m/ObjectStatus",
  "sap/m/MessageToast"
], function (ControllerExtension, JSONModel, Dialog, Text, Button, VBox, ObjectStatus, MessageToast) {
  "use strict";

  return ControllerExtension.extend("maintenance.workorder.workorder.ext.controller.ListReportExt", {
    override: {
      onInit: function () {
        this._setRoleModel();
      }
    },

    onOpenActionsDialog: async function (event) {
      const workOrder = await this._getWorkOrder(event);

      if (!workOrder) {
        return;
      }

      const latestWorkOrder = await this._getLatestWorkOrder(workOrder.WorkOrderNo);

      this._showActionsDialog(latestWorkOrder || workOrder);
    },

    onStartWork: async function (event) {
      const workOrder = await this._getWorkOrder(event);

      if (!workOrder) {
        return;
      }

      await this._executeWorkOrderAction(null, workOrder, "startWork");
    },

    onCompleteWork: async function (event) {
      const workOrder = await this._getWorkOrder(event);

      if (!workOrder) {
        return;
      }

      await this._executeWorkOrderAction(null, workOrder, "completeWork");
    },

    onViewProcedure: async function (event) {
      const workOrder = await this._getWorkOrder(event);

      if (!workOrder) {
        return;
      }

      console.log("[procedure-view] Work order", {
        WorkOrderNo: workOrder.WorkOrderNo,
        EquipmentID: workOrder.EquipmentID || workOrder.ProcedureID,
        MaintenanceType: workOrder.MaintenanceType
      });

      const procedure = await this._getProcedure(
        workOrder.EquipmentID || workOrder.ProcedureID,
        workOrder.MaintenanceType
      );

      console.log("[procedure-view] Retrieved procedure", {
        EquipmentID: procedure?.EquipmentID,
        MaintenanceCategory: procedure?.MaintenanceCategory
      });

      this._showProcedureDialog(workOrder, procedure);
    },

    _setRoleModel: async function () {
      const view = this.base.getView();
      const model = new JSONModel({
        technician: false
      });

      view.setModel(model, "role");

      try {
        const userInfo = await this._getJson("/odata/v4/role/getUserInfo()");

        model.setProperty("/technician", userInfo.role === "Technician");
      } catch (error) {
        model.setProperty("/technician", false);
      }
    },

    _getWorkOrder: async function (event) {
      const context = event.getSource().getBindingContext();

      if (!context) {
        MessageToast.show("Select a work order");
        return null;
      }

      if (context.requestObject) {
        return context.requestObject();
      }

      return context.getObject();
    },

    _normalizeStatus: function (status) {
      return String(status || "")
        .replace(/\s+/g, "")
        .toLowerCase();
    },

    _logActionStatus: function (action, workOrder) {
      console.log("[technician-actions] Action status", {
        action: action,
        WorkOrderNo: workOrder.WorkOrderNo,
        Status: workOrder.Status,
        normalizedStatus: this._normalizeStatus(workOrder.Status)
      });
    },

    _getLatestWorkOrder: async function (workOrderNo) {
      if (!workOrderNo) {
        return null;
      }

      const filter = `WorkOrderNo eq '${this._odataString(workOrderNo)}'`;
      const params = [
        `$select=${encodeURIComponent("WorkOrderNo,Status,EquipmentID,EquipmentName,ProcedureID,MaintenanceType")}`,
        `$filter=${encodeURIComponent(filter)}`,
        "$top=1"
      ];
      const url = `/odata/v4/work-order/WorkOrders?${params.join("&")}`;

      console.log("[technician-actions] Latest status request", {
        WorkOrderNo: workOrderNo,
        url: url
      });

      const data = await this._getJson(url);
      const workOrder = (data.value || [])[0] || null;

      console.log("[technician-actions] Latest status response", {
        WorkOrderNo: workOrder?.WorkOrderNo,
        Status: workOrder?.Status,
        normalizedStatus: this._normalizeStatus(workOrder?.Status)
      });

      return workOrder;
    },

    _showActionsDialog: function (workOrder) {
      const normalizedStatus = this._normalizeStatus(workOrder.Status);
      const contentItems = [
        new ObjectStatus({
          title: "Work Order",
          text: workOrder.WorkOrderNo || ""
        }),
        new ObjectStatus({
          title: "Status",
          text: workOrder.Status || ""
        })
      ];
      let actionButton = null;

      if (normalizedStatus === "assigned") {
        actionButton = new Button({
          text: "Start Work",
          type: "Emphasized",
          press: async function () {
            await this._executeWorkOrderAction(dialog, workOrder, "startWork");
          }.bind(this)
        });
      } else if (normalizedStatus === "inprogress") {
        actionButton = new Button({
          text: "Complete Task",
          type: "Emphasized",
          press: async function () {
            await this._executeWorkOrderAction(dialog, workOrder, "completeWork");
          }.bind(this)
        });
      } else {
        contentItems.push(new Text({
          text: "No available actions.",
          wrapping: true
        }));
      }

      console.log("[technician-actions] Dialog actions", {
        WorkOrderNo: workOrder.WorkOrderNo,
        Status: workOrder.Status,
        normalizedStatus: normalizedStatus,
        availableAction: actionButton && actionButton.getText()
      });

      const dialogSettings = {
        title: "Work Order Actions",
        contentWidth: "28rem",
        content: new VBox({
          renderType: "Bare",
          items: contentItems
        }).addStyleClass("sapUiSmallMargin"),
        endButton: new Button({
          text: "Close",
          press: function () {
            dialog.close();
          }
        }),
        afterClose: function () {
          dialog.destroy();
        }
      };

      if (actionButton) {
        dialogSettings.beginButton = actionButton;
      }

      const dialog = new Dialog(dialogSettings);

      dialog.open();
    },

    _executeWorkOrderAction: async function (dialog, workOrder, action) {
      const latestWorkOrder = await this._getLatestWorkOrder(workOrder.WorkOrderNo);
      const current = latestWorkOrder || workOrder;
      const normalizedStatus = this._normalizeStatus(current.Status);
      const startWork = action === "startWork";
      const completeWork = action === "completeWork";

      this._logActionStatus(startWork ? "Start Work" : "Complete Task", current);

      if (startWork && normalizedStatus !== "assigned") {
        MessageToast.show("Only assigned work orders can be started");
        return;
      }

      if (completeWork && normalizedStatus !== "inprogress") {
        MessageToast.show("Only in-progress work orders can be completed");
        return;
      }

      await this._postJson(`/odata/v4/work-order/${action}`, {
        workOrderNo: current.WorkOrderNo
      });

      MessageToast.show(startWork ? "Work started" : "Task completed");

      if (dialog) {
        dialog.close();
      }

      this._refresh();
    },

    _getProcedure: async function (equipmentId, maintenanceType) {
      if (!equipmentId) {
        return null;
      }

      const filters = [`EquipmentID eq '${this._odataString(equipmentId)}'`];

      if (maintenanceType) {
        filters.push(`MaintenanceCategory eq '${this._odataString(maintenanceType)}'`);
      }

      const url = this._procedureUrl(filters);

      console.log("[procedure-view] Request URL", url);

      const data = await this._getJson(url);

      return (data.value || [])[0] || null;
    },

    _procedureUrl: function (filters) {
      const params = [
        `$select=${encodeURIComponent("EquipmentID,EquipmentName,EquipmentType,MaintenanceCategory,MaintenanceProcedure")}`,
        `$filter=${encodeURIComponent(filters.join(" and "))}`,
        "$top=1"
      ];

      return `/odata/v4/procedure-service-api/Procedures?${params.join("&")}`;
    },

    _odataString: function (value) {
      return String(value || "").replace(/'/g, "''");
    },

    _showProcedureDialog: function (workOrder, procedure) {
      const content = new VBox({
        renderType: "Bare",
        items: [
          new ObjectStatus({
            title: "Work Order",
            text: workOrder.WorkOrderNo || ""
          }),
          new ObjectStatus({
            title: "Equipment",
            text: workOrder.EquipmentName || workOrder.EquipmentID || ""
          }),
          new ObjectStatus({
            title: "Category",
            text: procedure?.MaintenanceCategory || workOrder.MaintenanceType || ""
          }),
          new Text({
            text: procedure?.MaintenanceProcedure || "No procedure found for this equipment and maintenance type.",
            wrapping: true
          })
        ]
      }).addStyleClass("sapUiSmallMargin");

      const dialog = new Dialog({
        title: "Procedure",
        contentWidth: "32rem",
        content: content,
        endButton: new Button({
          text: "Close",
          press: function () {
            dialog.close();
          }
        }),
        afterClose: function () {
          dialog.destroy();
        }
      });

      dialog.open();
    },

    _getJson: async function (url) {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const text = await response.text();

      return text ? JSON.parse(text) : {};
    },

    _postJson: async function (url, payload) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        MessageToast.show("Request failed");
        throw new Error(await response.text());
      }

      const text = await response.text();

      return text ? JSON.parse(text) : {};
    },

    _refresh: function () {
      this._refreshNow();
      setTimeout(function () {
        this._refreshNow();
      }.bind(this), 500);
    },

    _refreshNow: function () {
      const extensionAPI = this.base.getExtensionAPI && this.base.getExtensionAPI();
      const model = this.base.getView().getModel();

      if (extensionAPI && extensionAPI.refresh) {
        extensionAPI.refresh();
      }

      if (model && model.refresh) {
        model.refresh(true);
      }
    }
  });
});
