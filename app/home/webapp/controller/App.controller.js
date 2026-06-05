sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], function (Controller, MessageToast) {
  "use strict";

  const isLocalPreview = window.location.pathname.includes("maintenance.home");
  const WORK_ORDER_APP = isLocalPreview
    ? "/maintenance.workorder.workorder/index.html"
    : "/maintenanceworkorderworkorder/index.html";
  const EQUIPMENT_APP = isLocalPreview
    ? "/maintenance.equipment.equipment/index.html"
    : "/maintenanceequipmentequipment/index.html";

  return Controller.extend("maintenance.home.controller.App", {
    onInit: function () {
      this._model = this.getOwnerComponent().getModel("home");

      this._initialize();
    },

    _initialize: async function () {
      try {
        const user = await this._getJson("/odata/v4/role/getUserInfo()");
        const role = user.role || "";

        this._model.setProperty("/role", role);
        this._model.setProperty("/supervisor", role === "Supervisor");
        this._model.setProperty("/planner", role === "Planner");
        this._model.setProperty("/technician", role === "Technician");

        if (role === "Technician") {
          await this._loadTechnicianSummary();
          return;
        }

        await this._loadDashboard(role);
      } catch (error) {
        this._setProperty("/error", error.message || "Unable to load home page");
      } finally {
        this._setProperty("/loading", false);
      }
    },

    onOpenWorkOrders: function () {
      window.location.href = WORK_ORDER_APP;
    },

    onOpenEquipment: function () {
      window.location.href = EQUIPMENT_APP;
    },

    onCreateWorkOrder: async function () {
      this._resetCreateForm();
      try {
        await this._loadEquipments();
      } catch (error) {
        this._setProperty("/error", error.message || "Unable to load equipment list");
      }
      this.byId("createWorkOrderDialog").open();
    },

    onCreateEquipment: function () {
      window.location.href = EQUIPMENT_APP;
    },

    onAssignTechnician: async function () {
      await Promise.all([
        this._loadAssignableWorkOrders(),
        this._loadTechnicians()
      ]);
      this._setProperty("/assign", {
        WorkOrderNo: "",
        TechnicianId: "",
        TechnicianName: ""
      });
      this.byId("assignTechnicianDialog").open();
    },

    onCancelCreateWorkOrder: function () {
      this.byId("createWorkOrderDialog").close();
    },

    onSubmitWorkOrder: async function () {
      const payload = Object.assign({}, this._model.getProperty("/create"));
      const role = this._model.getProperty("/role");

      if (role !== "Planner") {
        MessageToast.show("Only planner can create work orders");
        return;
      }

      if (!payload.EquipmentID || !payload.EquipmentName || !payload.ProcedureID) {
        MessageToast.show("Enter equipment and procedure details");
        return;
      }

      delete payload.AssignedTo;
      delete payload.AssignedName;

      try {
        await this._postJson("/odata/v4/work-order/WorkOrders", payload);
        MessageToast.show("Work order created");
        this.byId("createWorkOrderDialog").close();
        this.onOpenWorkOrders();
      } catch (error) {
        this._setProperty("/error", error.message || "Unable to create work order");
      }
    },

    onCancelAssignTechnician: function () {
      this.byId("assignTechnicianDialog").close();
    },

    onTechnicianSelected: function (event) {
      const selected = event.getParameter("selectedItem");
      const technician = selected && selected.getBindingContext("home").getObject();

      if (technician) {
        this._setProperty("/assign/TechnicianName", technician.userName);
      }
    },

    onEquipmentSelected: async function (event) {
      const selected = event.getParameter("selectedItem");
      const equipment = selected && selected.getBindingContext("home").getObject();

      if (!equipment) {
        return;
      }

      this._setProperty("/create/EquipmentName", equipment.equipment_name || "");
      this._setProperty("/create/ProcedureID", "");

      await this._mapProcedureForEquipment(equipment.equipment_id);
    },

    onSubmitAssignTechnician: async function () {
      const assign = this._model.getProperty("/assign");

      if (!assign.WorkOrderNo || !assign.TechnicianId) {
        MessageToast.show("Select work order and technician");
        return;
      }

      try {
        await this._postJson("/odata/v4/work-order/assignTechnician", {
          workOrderNo: assign.WorkOrderNo,
          technicianId: assign.TechnicianId,
          technicianName: assign.TechnicianName || assign.TechnicianId
        });
        MessageToast.show("Technician assigned");
        this.byId("assignTechnicianDialog").close();
      } catch (error) {
        this._setProperty("/error", error.message || "Unable to assign technician");
      }
    },

    onStartSelectedWork: async function () {
      await this._updateSelectedWork("startWork");
    },

    onCompleteSelectedWork: async function () {
      await this._updateSelectedWork("completeWork");
    },

    onShowProcedures: async function () {
      await this._loadProcedureList();
      this.byId("procedureListDialog").open();
    },

    onCloseProcedures: function () {
      this.byId("procedureListDialog").close();
    },

    _loadDashboard: async function (role) {
      if (role !== "Supervisor") {
        this._model.setProperty("/summary", {
          totalWorkOrders: 0,
          equipmentCount: 0
        });
        return;
      }

      const [summary, statusChart, priorityChart] = await Promise.all([
        this._getJson("/odata/v4/dashboard/getSummary()"),
        this._getJson("/odata/v4/dashboard/getStatusChart()"),
        this._getJson("/odata/v4/dashboard/getPriorityChart()")
      ]);

      this._model.setProperty("/summary", summary);
      this._model.setProperty("/statusChart", statusChart.value || statusChart);
      this._model.setProperty("/priorityChart", priorityChart.value || priorityChart);
      this._configureCharts();
    },

    _configureCharts: function () {
      const statusChart = this.byId("statusChart");
      const priorityChart = this.byId("priorityChart");

      if (statusChart) {
        statusChart.setVizProperties({
          plotArea: { dataLabel: { visible: true } },
          legend: { visible: true },
          title: { visible: false }
        });
      }

      if (priorityChart) {
        priorityChart.setVizProperties({
          plotArea: { dataLabel: { visible: true } },
          valueAxis: { title: { visible: false } },
          categoryAxis: { title: { visible: false } },
          title: { visible: false }
        });
      }
    },

    _loadTechnicianSummary: async function () {
      const [count, workOrders] = await Promise.all([
        this._getText("/odata/v4/work-order/WorkOrders/$count"),
        this._getJson("/odata/v4/work-order/WorkOrders?$select=WorkOrderNo,EquipmentName,ProcedureID,MaintenanceType,Status&$filter=Status ne 'Completed'")
      ]);
      const assignedOrders = workOrders.value || [];

      this._setProperty("/assignedCount", Number(count) || 0);
      this._setProperty("/workOrders", assignedOrders);

      if (!this._model.getProperty("/selectedWorkOrder") && assignedOrders.length) {
        this._setProperty("/selectedWorkOrder", assignedOrders[0].WorkOrderNo);
      }
    },

    _loadAssignableWorkOrders: async function () {
      const data = await this._getJson("/odata/v4/work-order/WorkOrders?$select=WorkOrderNo,EquipmentName,Status&$filter=Status eq 'Open'");
      this._setProperty("/workOrders", data.value || []);
    },

    _loadTechnicians: async function () {
      const data = await this._getJson("/odata/v4/role/getTechnicians()");
      this._setProperty("/technicians", data.value || data);
    },

    _loadProcedureList: async function () {
      const data = await this._getJson("/odata/v4/work-order/WorkOrders?$select=WorkOrderNo,EquipmentID,EquipmentName,ProcedureID,MaintenanceType,Status");
      const workOrders = data.value || [];
      const procedures = await Promise.all(workOrders.map(async workOrder => {
        const procedure = await this._getProcedureForEquipment(workOrder.EquipmentID);

        return {
          WorkOrderNo: workOrder.WorkOrderNo,
          EquipmentName: workOrder.EquipmentName,
          ProcedureID: workOrder.ProcedureID,
          MaintenanceType: workOrder.MaintenanceType,
          MaintenanceProcedure: procedure?.MaintenanceProcedure || "",
          Status: workOrder.Status
        };
      }));

      this._setProperty("/procedureList", procedures);
    },

    _loadEquipments: async function () {
      if ((this._model.getProperty("/equipments") || []).length) {
        return;
      }

      const data = await this._getJson("/odata/v4/equipment-service-api/Equipments?$select=equipment_id,equipment_name&$orderby=equipment_id");
      this._setProperty("/equipments", data.value || []);
    },

    _mapProcedureForEquipment: async function (equipmentId) {
      const procedure = await this._getProcedureForEquipment(equipmentId);

      if (!procedure) {
        MessageToast.show("No procedure found for selected equipment");
        return;
      }

      this._setProperty("/create/ProcedureID", procedure.EquipmentID);
      this._setProperty("/create/MaintenanceType", this._mapMaintenanceType(procedure.MaintenanceCategory));
    },

    _getProcedureForEquipment: async function (equipmentId) {
      if (!equipmentId) {
        return null;
      }

      const encoded = encodeURIComponent(String(equipmentId).replace(/'/g, "''"));
      const data = await this._getJson(`/odata/v4/procedure-service-api/Procedures?$select=EquipmentID,MaintenanceCategory,MaintenanceProcedure&$filter=EquipmentID eq '${encoded}'&$top=1`);

      return (data.value || [])[0] || null;
    },

    _mapMaintenanceType: function (category) {
      const value = String(category || "").toLowerCase();

      if (value.includes("break")) {
        return "Breakdown Maintenance";
      }

      return "Preventive Maintenance";
    },

    _updateSelectedWork: async function (action) {
      const workOrderNo = this._model.getProperty("/selectedWorkOrder");
      const workOrder = (this._model.getProperty("/workOrders") || [])
        .find(order => order.WorkOrderNo === workOrderNo);

      if (!workOrder) {
        MessageToast.show("Select an assigned work order");
        return;
      }

      if (action === "startWork" && !["Open", "Assigned"].includes(workOrder.Status)) {
        MessageToast.show("Only open or assigned work orders can be started");
        return;
      }

      if (action === "completeWork" && workOrder.Status !== "InProgress") {
        MessageToast.show("Only in-progress work orders can be completed");
        return;
      }

      await this._postJson(`/odata/v4/work-order/${action}`, {
        workOrderNo: workOrderNo
      });
      MessageToast.show(action === "startWork" ? "Work started" : "Work completed");
      await this._loadTechnicianSummary();
    },

    _getJson: async function (url) {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        MessageToast.show("Request failed");
        throw new Error(await response.text());
      }

      return response.json();
    },

    _getText: async function (url) {
      const response = await fetch(url, {
        headers: {
          "Accept": "text/plain"
        }
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.text();
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
        MessageToast.show("Create failed");
        throw new Error(await response.text());
      }

      return response.json();
    },

    _resetCreateForm: function () {
      this._setProperty("/create", {
        EquipmentID: "",
        EquipmentName: "",
        ProcedureID: "",
        MaintenanceType: "Preventive Maintenance",
        Priority: "Medium",
        Status: "Open",
        AssignedTo: "",
        AssignedName: ""
      });
    },

    _setProperty: function (path, value) {
      const model = this._model || this.getOwnerComponent().getModel("home");

      if (model) {
        model.setProperty(path, value);
      }
    }
  });
});
