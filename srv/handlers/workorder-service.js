const cds = require("@sap/cds");
const { getUserInfo, getUserRole } = require("../lib/user-role");

module.exports = cds.service.impl(async function () {
  const workorderSrv = await cds.connect.to("workorder");
  const { WorkOrders, StatusHistory } = workorderSrv.entities;

  this.before("READ", "WorkOrders", async req => {
    const userInfo = await getUserInfo(req.user.id, req.user);

    if (userInfo.role === "Technician") {
      req.query.where({
        AssignedTo: userInfo.userId
      });
    }

    if (userInfo.role === "Planner" && req.query?.SELECT?.one) {
      req.reject(403, "Planner cannot open work order object page");
    }
  });

  this.on("READ", "WorkOrders", req => workorderSrv.run(req.query));
  this.on("READ", "StatusHistory", req => workorderSrv.run(req.query));

  this.before("CREATE", "WorkOrders", async req => {
    const userInfo = await getUserInfo(req.user.id, req.user);

    if (userInfo.role !== "Planner") {
      req.reject(403, "Not authorized");
    }

    req.data.ID = req.data.ID || cds.utils.uuid();
    req.data.WorkOrderNo = req.data.WorkOrderNo || await nextWorkOrderNo(workorderSrv, WorkOrders);
    req.data.Status = req.data.Status || "Open";
    req.data.CreatedBy = req.data.CreatedBy || userInfo.userId;
    req.data.CreatedAt = req.data.CreatedAt || new Date();

    console.log("[workorder-service] CREATE WorkOrders", {
      EquipmentID: req.data.EquipmentID,
      MaintenanceType: req.data.MaintenanceType,
      ProcedureID: req.data.ProcedureID
    });

    delete req.data.AssignedTo;
    delete req.data.AssignedName;
  });

  this.on("CREATE", "WorkOrders", req => {
    return workorderSrv.run(
      INSERT.into(WorkOrders).entries(req.data)
    );
  });

  this.before("UPDATE", "WorkOrders", async req => {
    const role = await getUserRole(req.user.id, req.user);

    if (role === "Technician") {
      req.reject(403, "Use Start/Complete actions");
    }
  });

  this.on("UPDATE", "WorkOrders", async req => {
    const id = req.data.ID || await getIdFromUpdateQuery(req, workorderSrv, WorkOrders);

    if (!id) {
      req.reject(400, "Work order UUID ID is required for update");
    }

    const data = Object.assign({}, req.data);
    delete data.ID;

    return updateWorkOrderById(workorderSrv, WorkOrders, id, data);
  });

  this.on("updateStatus", async req => {
    const { workOrderNo, status } = req.data;
    const userInfo = await getUserInfo(req.user.id, req.user);

    if (userInfo.role !== "Technician") {
      req.reject(403, "Only Technician");
    }

    const current = await getAssignedWorkOrder(req, workorderSrv, WorkOrders, workOrderNo, userInfo);

    await addStatusHistory(workorderSrv, StatusHistory, current, status, userInfo.userId);
    await updateWorkOrderStatus(workorderSrv, WorkOrders, current.ID, status);

    return {
      message: "Status Updated"
    };
  });

  this.on("startWork", async req => {
    const userInfo = await getUserInfo(req.user.id, req.user);

    if (userInfo.role !== "Technician") {
      req.reject(403, "Only Technician");
    }

    const current = await getAssignedWorkOrder(req, workorderSrv, WorkOrders, req.data.workOrderNo, userInfo);

    if (current.Status !== "Assigned") {
      req.reject(400, "Only assigned work orders can be started");
    }

    await addStatusHistory(workorderSrv, StatusHistory, current, "InProgress", userInfo.userId);
    await updateWorkOrderStatus(workorderSrv, WorkOrders, current.ID, "InProgress");

    return {
      message: "Work started"
    };
  });

  this.on("completeWork", async req => {
    const userInfo = await getUserInfo(req.user.id, req.user);

    if (userInfo.role !== "Technician") {
      req.reject(403, "Only Technician");
    }

    const current = await getAssignedWorkOrder(req, workorderSrv, WorkOrders, req.data.workOrderNo, userInfo);

    if (current.Status !== "InProgress") {
      req.reject(400, "Only in-progress work orders can be completed");
    }

    await addStatusHistory(workorderSrv, StatusHistory, current, "Completed", userInfo.userId);
    await updateWorkOrderStatus(workorderSrv, WorkOrders, current.ID, "Completed");

    return {
      message: "Task completed"
    };
  });

  this.on("assignTechnician", async req => {
    const role = await getUserRole(req.user.id, req.user);

    if (role !== "Supervisor") {
      req.reject(403, "Only Supervisor");
    }

    const current = await getWorkOrderByNumber(req, workorderSrv, WorkOrders, req.data.workOrderNo);

    await updateWorkOrderById(workorderSrv, WorkOrders, current.ID, {
      AssignedTo: req.data.technicianId,
      AssignedName: req.data.technicianName,
      Status: "Assigned"
    });

    return {
      message: "Technician assigned"
    };
  });
});

async function getAssignedWorkOrder(req, workorderSrv, WorkOrders, workOrderNo, userInfo) {
  const current = await workorderSrv.run(
    SELECT.one
      .from(WorkOrders)
      .columns("ID", "WorkOrderNo", "Status")
      .where({
        WorkOrderNo: workOrderNo,
        AssignedTo: userInfo.userId
      })
  );

  if (!current) {
    req.reject(404, "Assigned work order not found");
  }

  return current;
}

async function getWorkOrderByNumber(req, workorderSrv, WorkOrders, workOrderNo) {
  const current = await workorderSrv.run(
    SELECT.one
      .from(WorkOrders)
      .columns("ID", "WorkOrderNo", "Status")
      .where({
        WorkOrderNo: workOrderNo
      })
  );

  if (!current) {
    req.reject(404, "Work order not found");
  }

  return current;
}

async function getIdFromUpdateQuery(req, workorderSrv, WorkOrders) {
  const id = findWhereValue(req.query?.UPDATE?.where, "ID");

  if (id) {
    return id;
  }

  const workOrderNo = findWhereValue(req.query?.UPDATE?.where, "WorkOrderNo");

  if (!workOrderNo) {
    return null;
  }

  const current = await getWorkOrderByNumber(req, workorderSrv, WorkOrders, workOrderNo);

  return current.ID;
}

function findWhereValue(where, field) {
  if (!Array.isArray(where)) {
    return null;
  }

  for (let index = 0; index < where.length - 2; index += 1) {
    if (where[index]?.ref?.[0] === field && where[index + 1] === "=") {
      return where[index + 2]?.val || null;
    }
  }

  return null;
}

async function addStatusHistory(workorderSrv, StatusHistory, current, newStatus, changedBy) {
  return workorderSrv.run(
    INSERT.into(StatusHistory).entries({
      ID: cds.utils.uuid(),
      WorkOrderNo: current.WorkOrderNo,
      OldStatus: current.Status,
      NewStatus: newStatus,
      ChangedBy: changedBy,
      ChangedAt: new Date()
    })
  );
}

async function updateWorkOrderStatus(workorderSrv, WorkOrders, id, status) {
  return updateWorkOrderById(workorderSrv, WorkOrders, id, {
    Status: status
  });
}

async function updateWorkOrderById(workorderSrv, WorkOrders, id, data) {
  return workorderSrv.run(
    UPDATE(WorkOrders, id).with(data)
  );
}

async function nextWorkOrderNo(workorderSrv, WorkOrders) {
  const latest = await workorderSrv.run(
    SELECT.one
      .from(WorkOrders)
      .columns("WorkOrderNo")
      .orderBy("WorkOrderNo desc")
  );

  const currentNumber = Number(String(latest?.WorkOrderNo || "").replace(/\D/g, "")) || 0;

  return `WO${String(currentNumber + 1).padStart(3, "0")}`;
}
