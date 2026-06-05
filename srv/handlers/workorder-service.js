const cds = require("@sap/cds");
const { getUserRole } = require("../lib/user-role");

module.exports = cds.service.impl(async function () {
  const { WorkOrders, StatusHistory } = cds.entities("maintenance");

  this.before(
    'READ',
    'WorkOrders',
    async req => {

        const role =
            await getUserRole(
                req.user.id,
                req.user
            )

        if(role === 'Technician'){

            req.query.where({

                AssignedTo:
                    req.user.id

            })

        }

    }
)

this.before(
    'CREATE',
    'WorkOrders',
    async req => {

        const role =
            await getUserRole(
                req.user.id,
                req.user
            )

        if(
            role !== 'Planner' &&
            role !== 'Supervisor'
        ){

            req.reject(
                403,
                'Not authorized'
            )

        }

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
    const role = await getUserRole(req.user.id, req.user);

    if (role !== "Technician") {
      req.reject(403, "Only Technician");
    }

    const current = await SELECT.one.from(WorkOrders).where({
      WorkOrderNo: workOrderNo,
    });

    if (!current) {
      req.reject(404, "Work order not found");
    }

    if (current.AssignedTo !== req.user.id) {
      req.reject(403, "Work order is not assigned to you");
    }

    await INSERT.into(StatusHistory).entries({
      ID: cds.utils.uuid(),
      WorkOrderNo: workOrderNo,
      OldStatus: current.Status,
      NewStatus: status,
      ChangedBy: req.user.id,
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

        const role =
            await getUserRole(
                req.user.id,
                req.user
            )

        if(
            role !== 'Technician'
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
                req.user.id

        })

    }
)

this.on(
    'completeWork',
    async req => {

        const role =
            await getUserRole(
                req.user.id,
                req.user
            )

        if(
            role !== 'Technician'
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
                req.user.id

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
