const cds = require("@sap/cds");
const { getUserRole } = require("../lib/user-role");

module.exports = cds.service.impl(async function () {
  const { WorkOrders } = cds.entities("maintenance");

  this.before("*", async (req) => {
    const role = await getUserRole(req.user.id, req.user);

    if (role !== "Supervisor") {
      req.reject(403, "Only Supervisor");
    }
  });

  this.on("getSummary", async () => {
    const orders = await SELECT.from(WorkOrders).columns("Status");
    const equipmentCount = await countEquipments();

    return {
      totalWorkOrders: orders.length,
      openWorkOrders: orders.filter((order) =>
        ["Created", "Assigned", "InProgress"].includes(order.Status)
      ).length,
      assignedOrders: orders.filter((order) => order.Status === "Assigned")
        .length,
      completedOrders: orders.filter((order) => order.Status === "Completed")
        .length,
      equipmentCount,
    };
  });

  this.on("getStatusChart", async () => {
    const orders = await SELECT.from(WorkOrders).columns("Status");

    return aggregate(orders, "Status");
  });

  this.on("getPriorityChart", async () => {
    const orders = await SELECT.from(WorkOrders).columns("Priority");

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
    const result = await srv.run(
      SELECT.one.from(ZC_MASTER_EQUIPMENT).columns("count(*) as count")
    );

    return Number(result?.count || 0);
  } catch (error) {
    return 0;
  }
}
