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
    onInit: async function () {
      this._model = this.getOwnerComponent().getModel("home");

      try {
        const user = await this._getJson("/odata/v4/role/getUserInfo()");
        const role = user.role || "";

        this._model.setProperty("/role", role);
        this._model.setProperty("/supervisor", role === "Supervisor");
        this._model.setProperty("/planner", role === "Planner");
        this._model.setProperty("/technician", role === "Technician");

        if (role === "Technician") {
          this.onOpenWorkOrders();
          return;
        }

        await this._loadDashboard(role);
      } catch (error) {
        this._model.setProperty("/error", error.message || "Unable to load home page");
      } finally {
        this._model.setProperty("/loading", false);
      }
    },

    onOpenWorkOrders: function () {
      window.location.href = WORK_ORDER_APP;
    },

    onOpenEquipment: function () {
      window.location.href = EQUIPMENT_APP;
    },

    onCreateWorkOrder: function () {
      window.location.href = WORK_ORDER_APP + "#/WorkOrders";
    },

    onCreateEquipment: function () {
      window.location.href = EQUIPMENT_APP + "#/Equipments";
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
    }
  });
});
