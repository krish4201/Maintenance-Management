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
      this._onWindowFocus = this._refreshDashboardOnReturn.bind(this);
      this._onPageShow = this._refreshDashboardOnReturn.bind(this);

      window.addEventListener("focus", this._onWindowFocus);
      window.addEventListener("pageshow", this._onPageShow);

      this._initialize();
    },

    onExit: function () {
      window.removeEventListener("focus", this._onWindowFocus);
      window.removeEventListener("pageshow", this._onPageShow);
      this._stopTechnicianRefreshTimer();
    },

    _initialize: async function () {
      try {
        const user = await this._getJson("/odata/v4/role/getUserInfo()");
        const role = user.role || "";
        const userName = user.userName || "";
        
        this._model.setProperty("/name", userName);
        this._model.setProperty("/role", role);
        this._model.setProperty("/supervisor", role === "Supervisor");
        this._model.setProperty("/planner", role === "Planner");
        this._model.setProperty("/technician", role === "Technician");

        if (role === "Technician") {
          await this._loadTechnicianSummary();
          this._startTechnicianRefreshTimer();
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
      this._navigateToApp("WorkOrders-manage", WORK_ORDER_APP);
    },

    onOpenEquipment: function () {
      this._navigateToApp("Equipment-display", EQUIPMENT_APP);
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
      this._resetEquipmentForm();
      this.byId("createEquipmentDialog").open();
    },

    onCreateProcedure: async function () {
      this._resetProcedureForm();
      try {
        await this._loadEquipments();
      } catch (error) {
        this._setProperty("/error", error.message || "Unable to load equipment list");
      }
      this.byId("createProcedureDialog").open();
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
        // this.onOpenWorkOrders();
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

      this._setProperty("/create/EquipmentID", equipment.equipment_id || "");
      this._setProperty("/create/EquipmentName", equipment.equipment_name || "");
      this._setProperty("/create/ProcedureID", "");

      await this._mapProcedureForWorkOrder();
    },

    onMaintenanceTypeChanged: async function () {
      await this._mapProcedureForWorkOrder();
    },

    onProcedureEquipmentSelected: function (event) {
      const selected = event.getParameter("selectedItem");
      const equipment = selected && selected.getBindingContext("home").getObject();

      if (!equipment) {
        return;
      }

      this._setProperty("/createProcedure/EquipmentName", equipment.equipment_name || "");
      this._setProperty("/createProcedure/EquipmentType", equipment.equipment_type || "");
    },

    onCancelCreateProcedure: function () {
      this.byId("createProcedureDialog").close();
    },

    onSubmitProcedure: async function () {
      const payload = Object.assign({}, this._model.getProperty("/createProcedure"));

      if (!payload.EquipmentID || !payload.MaintenanceProcedure) {
        MessageToast.show("Select equipment and enter procedure");
        return;
      }

      try {
        await this._postJson("/odata/v4/procedure-service-api/Procedures", payload);
        MessageToast.show("Procedure created");
        this.byId("createProcedureDialog").close();
        await this._loadDashboard(this._model.getProperty("/role"));
      } catch (error) {
        this._setProperty("/error", error.message || "Unable to create procedure");
      }
    },

    onCancelCreateEquipment: function () {
      this.byId("createEquipmentDialog").close();
    },

    onSubmitEquipment: async function () {
      const payload = Object.assign({}, this._model.getProperty("/createEquipment"));

      if (!payload.equipment_id || !payload.equipment_name || !payload.equipment_type) {
        MessageToast.show("Enter equipment ID, name, and type");
        return;
      }

      try {
        await this._postJson("/odata/v4/equipment-service-api/Equipments", payload);
        MessageToast.show("Equipment created");
        this.byId("createEquipmentDialog").close();
        this._setProperty("/equipments", []);
        await this._loadDashboard(this._model.getProperty("/role"));
      } catch (error) {
        this._setProperty("/error", error.message || "Unable to create equipment");
      }
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
      await this._refreshTechnicianProcedureCount();
      await this._loadProcedureList();
      this.byId("procedureListDialog").open();
    },

    onShowUniqueProcedures: async function () {
      await this._loadUniqueProcedureList();
      this.byId("procedureListDialog").open();
    },

    onCloseProcedures: function () {
      this.byId("procedureListDialog").close();
    },

    _loadDashboard: async function (role) {
      if (!["Supervisor", "Planner"].includes(role)) {
        return;
      }

      const summary = await this._getJson("/odata/v4/dashboard/getSummary()");
      this._model.setProperty("/summary", summary);

      if (role !== "Supervisor") {
        return;
      }

      const [assignedChart, statusChart] = await Promise.all([
        this._getJson("/odata/v4/dashboard/getAssignedChart()"),
        this._getJson("/odata/v4/dashboard/getStatusChart()")
      ]);

      this._model.setProperty("/assignedChart", assignedChart.value || assignedChart);
      this._model.setProperty("/statusChart", statusChart.value || statusChart);
      this._configureCharts();
    },

    _configureCharts: function () {
      const assignedChart = this.byId("assignedChart");
      const statusChart = this.byId("statusChart");

      if (assignedChart) {
        assignedChart.setVizProperties({
          plotArea: { dataLabel: { visible: true } },
          legend: { visible: true },
          title: { visible: false }
        });
      }

      if (statusChart) {
        statusChart.setVizProperties({
          plotArea: { dataLabel: { visible: true } },
          valueAxis: { title: { visible: false } },
          categoryAxis: { title: { visible: false } },
          title: { visible: false }
        });
      }
    },

    _loadTechnicianSummary: async function () {
      console.log("[technician-dashboard] Refresh technician summary");

      const workOrders = await this._getJson("/odata/v4/work-order/WorkOrders?$select=WorkOrderNo,EquipmentID,EquipmentName,ProcedureID,MaintenanceType,Status&$filter=Status ne 'Completed'");
      const assignedOrders = workOrders.value || [];

      this._setProperty("/assignedCount", assignedOrders.length);
      this._setProperty("/workOrders", assignedOrders);

      if (!this._model.getProperty("/selectedWorkOrder") && assignedOrders.length) {
        this._setProperty("/selectedWorkOrder", assignedOrders[0].WorkOrderNo);
      }

      await this._refreshTechnicianProcedureCount(assignedOrders);
    },

    _loadAssignableWorkOrders: async function () {
      const data = await this._getJson("/odata/v4/work-order/WorkOrders?$select=WorkOrderNo,EquipmentName,Status&$filter=Status eq 'Open'");
      this._setProperty("/workOrders", data.value || []);
    },

    _loadTechnicians: async function () {
      const data = await this._getJson("/odata/v4/role/getTechnicians()");
      this._setProperty("/technicians", data.value || data);
    },

    _refreshDashboardOnReturn: async function () {
      const role = this._model && this._model.getProperty("/role");

      if (!role) {
        return;
      }

      console.log("[home-dashboard] Refresh on return", {
        role: role
      });

      if (role === "Technician") {
        await this._loadTechnicianSummary();
        return;
      }

      await this._loadDashboard(role);
    },

    _startTechnicianRefreshTimer: function () {
      if (this._technicianRefreshTimer) {
        return;
      }

      console.log("[technician-dashboard] Start auto refresh timer");

      this._technicianRefreshTimer = setInterval(async function () {
        if (this._technicianRefreshInProgress) {
          return;
        }

        this._technicianRefreshInProgress = true;

        try {
          await this._loadTechnicianSummary();
        } finally {
          this._technicianRefreshInProgress = false;
        }
      }.bind(this), 30000);
    },

    _stopTechnicianRefreshTimer: function () {
      if (!this._technicianRefreshTimer) {
        return;
      }

      clearInterval(this._technicianRefreshTimer);
      this._technicianRefreshTimer = null;
    },

    _refreshTechnicianProcedureCount: async function (workOrders) {
      const role = this._model.getProperty("/role");

      if (role !== "Technician") {
        return;
      }

      console.log("[technician-dashboard] Refresh procedure tile count");

      const assignedOrders = workOrders || await this._getTechnicianWorkOrders();
      const uniqueProcedures = new Set();

      for (const workOrder of assignedOrders) {
        const procedure = await this._getProcedureForEquipment(
          workOrder.EquipmentID || workOrder.ProcedureID,
          workOrder.MaintenanceType
        );

        if (!procedure) {
          continue;
        }

        uniqueProcedures.add([
          procedure.EquipmentID || workOrder.ProcedureID || workOrder.EquipmentID || "",
          this._mapMaintenanceType(procedure.MaintenanceCategory || workOrder.MaintenanceType)
        ].join("|"));
      }

      console.log("[technician-dashboard] Procedure tile count updated", {
        workOrderCount: assignedOrders.length,
        procedureCount: uniqueProcedures.size
      });

      this._setProperty("/technicianProcedureCount", uniqueProcedures.size);
    },

    _getTechnicianWorkOrders: async function () {
      console.log("[technician-dashboard] Fetch technician work orders for procedure count");

      const data = await this._getJson("/odata/v4/work-order/WorkOrders?$select=WorkOrderNo,EquipmentID,EquipmentName,ProcedureID,MaintenanceType,Status&$filter=Status ne 'Completed'");

      return data.value || [];
    },

    _loadProcedureList: async function () {
      const data = await this._getJson("/odata/v4/work-order/WorkOrders?$select=WorkOrderNo,EquipmentID,EquipmentName,ProcedureID,MaintenanceType,Status&$filter=Status ne 'Completed'");
      const workOrders = data.value || [];
      const procedures = await Promise.all(workOrders.map(async workOrder => {
        console.log("[procedure-list] Work order", {
          WorkOrderNo: workOrder.WorkOrderNo,
          EquipmentID: workOrder.EquipmentID,
          MaintenanceType: workOrder.MaintenanceType
        });

        const procedure = await this._getProcedureForEquipment(
          workOrder.EquipmentID,
          workOrder.MaintenanceType
        );

        console.log("[procedure-list] Retrieved procedure", {
          WorkOrderNo: workOrder.WorkOrderNo,
          EquipmentID: procedure?.EquipmentID,
          MaintenanceCategory: procedure?.MaintenanceCategory
        });

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

    _loadUniqueProcedureList: async function () {
      const data = await this._getJson("/odata/v4/procedure-service-api/Procedures?$select=EquipmentID,EquipmentName,EquipmentType,MaintenanceCategory,MaintenanceProcedure&$orderby=EquipmentID");
      const unique = [];
      const seen = new Set();

      for (const procedure of data.value || []) {
        const key = `${procedure.EquipmentID || ""}|${this._mapMaintenanceType(procedure.MaintenanceCategory)}`;

        if (!key || seen.has(key)) {
          continue;
        }

        seen.add(key);
        unique.push({
          ProcedureID: procedure.EquipmentID,
          EquipmentName: procedure.EquipmentName,
          MaintenanceType: procedure.MaintenanceCategory,
          MaintenanceProcedure: procedure.MaintenanceProcedure,
          EquipmentType: procedure.EquipmentType
        });
      }

      this._setProperty("/procedureList", unique);
    },

    _loadEquipments: async function () {
      if ((this._model.getProperty("/equipments") || []).length) {
        return;
      }

      const data = await this._getJson("/odata/v4/equipment-service-api/Equipments?$select=equipment_id,equipment_name,equipment_type&$orderby=equipment_id");
      this._setProperty("/equipments", data.value || []);
    },

    _mapProcedureForWorkOrder: async function () {
      const create = this._model.getProperty("/create") || {};
      const procedure = await this._getProcedureForEquipment(
        create.EquipmentID,
        create.MaintenanceType
      );

      this._setProperty("/create/ProcedureID", "");

      if (!procedure) {
        if (create.EquipmentID && create.MaintenanceType) {
          MessageToast.show("No procedure found for selected equipment and maintenance type");
        }
        return;
      }

      this._setProperty("/create/ProcedureID", procedure.EquipmentID);
    },

    _getProcedureForEquipment: async function (equipmentId, maintenanceType) {
      if (!equipmentId) {
        return null;
      }

      const filters = [`EquipmentID eq '${this._odataString(equipmentId)}'`];

      if (maintenanceType) {
        filters.push(`MaintenanceCategory eq '${this._odataString(maintenanceType)}'`);
      }

      const url = this._procedureUrl(filters);

      console.log("[procedure-list] Request URL", url);

      const data = await this._getJson(url);

      return (data.value || [])[0] || null;
    },

    _procedureUrl: function (filters) {
      const params = [
        `$select=${encodeURIComponent("EquipmentID,MaintenanceCategory,MaintenanceProcedure")}`,
        `$filter=${encodeURIComponent(filters.join(" and "))}`,
        "$top=1"
      ];

      return `/odata/v4/procedure-service-api/Procedures?${params.join("&")}`;
    },

    _odataString: function (value) {
      return String(value || "").replace(/'/g, "''");
    },

    _mapMaintenanceType: function (category) {
      const value = String(category || "").toLowerCase();

      if (value.includes("break")) {
        return "Breakdown Maintenance";
      }

      return "Preventive Maintenance";
    },

    _navigateToApp: function (shellHash, fallbackUrl) {
      const shell = window.sap && window.sap.ushell && window.sap.ushell.Container;

      if (!shell) {
        window.location.href = fallbackUrl;
        return;
      }

      const service = typeof shell.getServiceAsync === "function"
        ? shell.getServiceAsync("CrossApplicationNavigation")
        : Promise.resolve(shell.getService("CrossApplicationNavigation"));

      service
        .then(function (navigation) {
          navigation.toExternal({
            target: {
              shellHash: "#" + shellHash
            }
          });
        })
        .catch(function () {
          window.location.href = fallbackUrl;
        });
    },

    _updateSelectedWork: async function (action) {
      const workOrderNo = this._model.getProperty("/selectedWorkOrder");
      const workOrder = (this._model.getProperty("/workOrders") || [])
        .find(order => order.WorkOrderNo === workOrderNo);

      if (!workOrder) {
        MessageToast.show("Select an assigned work order");
        return;
      }

      if (action === "startWork" && workOrder.Status !== "Assigned") {
        MessageToast.show("Only assigned work orders can be started");
        return;
      }

      if (action === "completeWork" && workOrder.Status !== "InProgress") {
        MessageToast.show("Only in-progress work orders can be completed");
        return;
      }

      await this._postJson(`/odata/v4/work-order/${action}`, {
        workOrderNo: workOrderNo
      });
      MessageToast.show(action === "startWork" ? "Work started" : "Task completed");
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

      const text = await response.text();

      return text ? JSON.parse(text) : {};
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

      const text = await response.text();

      return text ? JSON.parse(text) : {};
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

    _resetProcedureForm: function () {
      this._setProperty("/createProcedure", {
        EquipmentID: "",
        EquipmentName: "",
        EquipmentType: "",
        MaintenanceCategory: "Preventive Maintenance",
        MaintenanceProcedure: ""
      });
    },

    _resetEquipmentForm: function () {
      this._setProperty("/createEquipment", {
        equipment_id: "",
        equipment_name: "",
        equipment_type: "",
        manufacturer: "",
        model_number: "",
        serial_number: "",
        location: "",
        last_maintained_by: "",
        status: "Active"
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
