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
        assignedChart: [],
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
        createProcedure: {
          EquipmentID: "",
          EquipmentName: "",
          EquipmentType: "",
          MaintenanceCategory: "Preventive Maintenance",
          MaintenanceProcedure: ""
        },
        createEquipment: {
          equipment_id: "",
          equipment_name: "",
          equipment_type: "",
          manufacturer: "",
          model_number: "",
          serial_number: "",
          location: "",
          last_maintained_by: "",
          status: "Active"
        },
        assign: {
          WorkOrderNo: "",
          TechnicianId: "",
          TechnicianName: ""
        },
        selectedWorkOrder: "",
        equipments: [],
        workOrders: [],
        technicians: [],
        procedureList: [],
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
