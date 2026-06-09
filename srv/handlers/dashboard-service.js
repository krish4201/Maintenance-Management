const cds = require("@sap/cds");
const { getUserRole } = require("../lib/user-role");

module.exports = cds.service.impl(async function () {
  const workorderSrv = await cds.connect.to("workorder");
  const { WorkOrders } = workorderSrv.entities;

  this.before("*", async req => {
    const role = await getUserRole(req.user.id, req.user);

    if (req.event === "getSummary" && ["Supervisor", "Planner"].includes(role)) {
      return;
    }

    if (role !== "Supervisor") {
      req.reject(403, "Only Supervisor");
    }
  });

  this.on("getSummary", async () => {
    const orders = await workorderSrv.run(
      SELECT.from(WorkOrders).columns("Status", "AssignedName", "AssignedTo")
    );
    const [equipmentCount, procedureCount] = await Promise.all([
      countEquipments(),
      countProcedures()
    ]);

    return {
      totalWorkOrders: orders.length,
      openWorkOrders: orders.filter((order) =>
        ["Open", "Created", "Assigned", "InProgress"].includes(order.Status)
      ).length,
      assignedOrders: orders.filter((order) => order.Status === "Assigned")
        .length,
      unassignedOrders: orders.filter(order => !order.AssignedName && !order.AssignedTo)
        .length,
      completedOrders: orders.filter((order) => order.Status === "Completed")
        .length,
      equipmentCount,
      procedureCount,
    };
  });

  this.on("getAssignedChart", async () => {
    const orders = await workorderSrv.run(
      SELECT.from(WorkOrders).columns("AssignedName", "AssignedTo").where({ status: { '!=': 'Completed' } })
    );

    return aggregateAssigned(orders);
  });

  this.on("getStatusChart", async () => {
    const orders = await workorderSrv.run(
      SELECT.from(WorkOrders).columns("Status")
    );

    return aggregate(orders, "Status");
  });

  this.on("getPriorityChart", async () => {
    const orders = await workorderSrv.run(
      SELECT.from(WorkOrders).columns("Priority")
    );

    return aggregate(orders, "Priority");
  });
});

function aggregate(rows, property) {
  const result = new Map();

  for (const row of rows) {
    const label = row[property] || "Unknown";
    result.set(label, (result.get(label) || 0) + 1);
  }

  return [...result.entries()].map(([label, value]) => ({ label, value }));
}

async function countEquipments() {
  try {
    const srv = await cds.connect.to("equipment");
    const { ZC_MASTER_EQUIPMENT } = srv.entities;

    return countUniqueRows(srv, ZC_MASTER_EQUIPMENT, "equipment_id");
  } catch (error) {
    return 0;
  }
}

async function countProcedures() {
  try {
    const srv = await cds.connect.to("procedure");
    const { ZI_MAINT_PROC } = srv.entities;

    return countUniqueRows(srv, ZI_MAINT_PROC, "EquipmentID");
  } catch (error) {
    return 0;
  }
}

function aggregateAssigned(rows) {
  const normalized = rows.map(row => {
    const hasAssignment = Boolean(row.AssignedName || row.AssignedTo);

    return {
      Assigned: hasAssignment ? "Assigned" : "Not Assigned"
    };
  });

  return aggregate(normalized, "Assigned");
}

async function countUniqueRows(srv, entity, keyColumn) {
  const rows = await srv.run(
    SELECT.from(entity).columns(keyColumn)
  );
  const values = rows
    .map(row => row[keyColumn])
    .filter(Boolean);

  return new Set(values).size;
}
