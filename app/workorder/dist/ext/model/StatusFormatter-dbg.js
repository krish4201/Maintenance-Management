sap.ui.define([], function () {
  "use strict";

  function normalizeStatus(status) {
    return String(status || "")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  function logVisibility(action, status, technician, visible) {
    console.log("[technician-actions] Visibility", {
      action: action,
      status: status,
      normalizedStatus: normalizeStatus(status),
      technician: Boolean(technician),
      visible: visible
    });
  }

  return {
    isStartVisible: function (status, technician) {
      const visible = Boolean(technician) && normalizeStatus(status) === "assigned";

      logVisibility("Start Work", status, technician, visible);

      return visible;
    },

    isCompleteVisible: function (status, technician) {
      const visible = Boolean(technician) && normalizeStatus(status) === "inprogress";

      logVisibility("Complete Task", status, technician, visible);

      return visible;
    }
  };
});
