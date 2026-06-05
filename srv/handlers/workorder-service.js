const cds = require("@sap/cds");
const { getUserInfo, getUserRole } = require("../lib/user-role");

module.exports = cds.service.impl(async function () {
  const { WorkOrders, StatusHistory } = cds.entities("maintenance");

  this.before(
    'READ',
    'WorkOrders',
    async req => {

        const userInfo =
            await getUserInfo(
                req.user.id,
                req.user
            )

        if(userInfo.role === 'Technician'){

            req.query.where({

                AssignedTo:
                    userInfo.userId

            })

        }

    }
)

this.before(
    'CREATE',
    'WorkOrders',
    async req => {

        const userInfo =
            await getUserInfo(
                req.user.id,
                req.user
            )

        if(
            userInfo.role !== 'Planner' &&
            userInfo.role !== 'Supervisor'
        ){

            req.reject(
                403,
                'Not authorized'
            )

        }

        req.data.ID =
            req.data.ID ||
            cds.utils.uuid()

        req.data.WorkOrderNo =
            req.data.WorkOrderNo ||
            await nextWorkOrderNo()

        req.data.Status =
            req.data.Status ||
            'Created'

        req.data.CreatedBy =
            req.data.CreatedBy ||
            userInfo.userId

        req.data.CreatedAt =
            req.data.CreatedAt ||
            new Date()

    }
)

this.before(
    'UPDATE',
    'WorkOrders',
    async req => {

        const role =
            await getUserRole(
                req.user.id,
                req.user
            )

        if(role === 'Technician'){

            req.reject(
                403,
                'Use Start/Complete actions'
            )

        }

    }
)

  this.on("updateStatus", async (req) => {
    const { workOrderNo, status } = req.data;
    const userInfo = await getUserInfo(req.user.id, req.user);

    if (userInfo.role !== "Technician") {
      req.reject(403, "Only Technician");
    }

    const current = await SELECT.one.from(WorkOrders).where({
      WorkOrderNo: workOrderNo,
    });

    if (!current) {
      req.reject(404, "Work order not found");
    }

    if (!isAssignedToCurrentUser(current, userInfo, req.user)) {
      req.reject(403, "Work order is not assigned to you");
    }

    await INSERT.into(StatusHistory).entries({
      ID: cds.utils.uuid(),
      WorkOrderNo: workOrderNo,
      OldStatus: current.Status,
      NewStatus: status,
      ChangedBy: userInfo.userId,
      ChangedAt: new Date(),
    });

    await UPDATE(WorkOrders)
      .set({
        Status: status,
      })
      .where({
        WorkOrderNo: workOrderNo,
      });

    return {
      message: "Status Updated",
    };
  });

this.on(
    'startWork',
    async req => {

        const userInfo =
            await getUserInfo(
                req.user.id,
                req.user
            )

        if(
            userInfo.role !== 'Technician'
        ){

            req.reject(
                403,
                'Only Technician'
            )

        }

        await UPDATE(
            WorkOrders
        )
        .set({

            Status:
                'InProgress'

        })
        .where({

            WorkOrderNo:
                req.data.workOrderNo,

            AssignedTo:
                userInfo.userId

        })

    }
)

this.on(
    'completeWork',
    async req => {

        const userInfo =
            await getUserInfo(
                req.user.id,
                req.user
            )

        if(
            userInfo.role !== 'Technician'
        ){

            req.reject(
                403,
                'Only Technician'
            )

        }

        await UPDATE(
            WorkOrders
        )
        .set({

            Status:
                'Completed'

        })
        .where({

            WorkOrderNo:
                req.data.workOrderNo,

            AssignedTo:
                userInfo.userId

        })

    }
)


  this.on(
    'assignTechnician',
    async req => {

        const role =
            await getUserRole(
                    req.user.id,
                    req.user
            )

        if(
            role !== 'Supervisor'
        ){

            req.reject(
                403,
                'Only Supervisor'
            )

        }

        await UPDATE(
            WorkOrders
        )
        .set({

            AssignedTo:
                req.data.technicianId,

            AssignedName:
                req.data.technicianName,

            Status:
                'Assigned'

        })
        .where({

            WorkOrderNo:
                req.data.workOrderNo

        })

    }
)
});

function isAssignedToCurrentUser(current, userInfo, user) {
  return [
    userInfo.userId,
    userInfo.email,
    user?.id,
  ]
    .filter(Boolean)
    .some(value => String(current.AssignedTo || '').toUpperCase() === String(value).toUpperCase());
}

async function nextWorkOrderNo() {
  const latest = await SELECT.one
    .from('maintenance.WorkOrders')
    .columns('WorkOrderNo')
    .orderBy('WorkOrderNo desc');

  const currentNumber = Number(String(latest?.WorkOrderNo || '').replace(/\D/g, '')) || 0;

  return `WO${String(currentNumber + 1).padStart(3, '0')}`;
}
