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

    onCreateWorkOrder: function () {
      this._resetCreateForm();
      this.byId("createWorkOrderDialog").open();
    },

    onCreateEquipment: function () {
      window.location.href = EQUIPMENT_APP;
    },

    onCancelCreateWorkOrder: function () {
      this.byId("createWorkOrderDialog").close();
    },

    onSubmitWorkOrder: async function () {
      const payload = Object.assign({}, this._model.getProperty("/create"));
      const role = this._model.getProperty("/role");

      if (!payload.EquipmentID || !payload.EquipmentName || !payload.ProcedureID) {
        MessageToast.show("Enter equipment and procedure details");
        return;
      }

      if (role !== "Supervisor") {
        delete payload.AssignedTo;
        delete payload.AssignedName;
      }

      try {
        await this._postJson("/odata/v4/work-order/WorkOrders", payload);
        MessageToast.show("Work order created");
        this.byId("createWorkOrderDialog").close();
        this.onOpenWorkOrders();
      } catch (error) {
        this._setProperty("/error", error.message || "Unable to create work order");
      }
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
      const count = await this._getText("/odata/v4/work-order/WorkOrders/$count");
      this._setProperty("/assignedCount", Number(count) || 0);
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
