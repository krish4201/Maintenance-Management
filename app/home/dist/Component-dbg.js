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
      UIComponent.prototype.init.apply(this, arguments);

      this.setModel(new JSONModel({
        role: "",
        summary: {},
        statusChart: [],
        priorityChart: [],
        supervisor: false,
        planner: false,
        technician: false,
        loading: true,
        error: ""
      }), "home");
    }
  });
});
