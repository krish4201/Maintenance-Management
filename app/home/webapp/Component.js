sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
  "use strict";

  return UIComponent.extend("maintenance.home.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      this.setModel(new JSONModel({
        role: "",
        summary: {},
        statusChart: [],
        priorityChart: [],
        assignedCount: 0,
        create: {
          EquipmentID: "",
          EquipmentName: "",
          ProcedureID: "",
          MaintenanceType: "Preventive Maintenance",
          Priority: "Medium",
          Status: "Open",
          AssignedTo: "",
          AssignedName: ""
        },
        supervisor: false,
        planner: false,
        technician: false,
        loading: true,
        error: ""
      }), "home");

      UIComponent.prototype.init.apply(this, arguments);
    }
  });
});
