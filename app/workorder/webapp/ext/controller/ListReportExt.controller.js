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
      MessageToast.show("Work completed");
      this._refresh();
    },

    onViewProcedure: async function (event) {
      const workOrder = await this._getWorkOrder(event);

      if (!workOrder) {
        return;
      }

      const procedure = await this._getProcedure(workOrder.EquipmentID || workOrder.ProcedureID);

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

    _getProcedure: async function (equipmentId) {
      if (!equipmentId) {
        return null;
      }

      const encoded = encodeURIComponent(String(equipmentId).replace(/'/g, "''"));
      const data = await this._getJson(`/odata/v4/procedure-service-api/Procedures?$select=EquipmentID,EquipmentName,EquipmentType,MaintenanceCategory,MaintenanceProcedure&$filter=EquipmentID eq '${encoded}'&$top=1`);

      return (data.value || [])[0] || null;
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
            text: procedure?.MaintenanceProcedure || "No procedure found for this equipment.",
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
