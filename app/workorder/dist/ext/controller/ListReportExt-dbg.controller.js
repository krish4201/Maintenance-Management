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

    onStartWork: async function (event) {
      const workOrder = await this._getWorkOrder(event);

      if (!workOrder) {
        return;
      }

      await this._postJson("/odata/v4/work-order/startWork", {
        workOrderNo: workOrder.WorkOrderNo
      });
      MessageToast.show("Work started");
      this._refresh();
    },

    onCompleteWork: async function (event) {
      const workOrder = await this._getWorkOrder(event);

      if (!workOrder) {
        return;
      }

      await this._postJson("/odata/v4/work-order/completeWork", {
        workOrderNo: workOrder.WorkOrderNo
      });
      MessageToast.show("Task completed");
      this._refresh();
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
      const extensionAPI = this.base.getExtensionAPI && this.base.getExtensionAPI();

      if (extensionAPI && extensionAPI.refresh) {
        extensionAPI.refresh();
        return;
      }

      const model = this.base.getView().getModel();

      if (model && model.refresh) {
        model.refresh();
      }
    }
  });
});
