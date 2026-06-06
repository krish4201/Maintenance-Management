const cds = require('@sap/cds')
const { getUserRole } = require('../lib/user-role')

module.exports = cds.service.impl(async function () {

    const procedureSrv =
        await cds.connect.to('procedure')

    this.on('READ', 'Procedures', async req => {

        return procedureSrv.run(req.query)

    })

    this.before('CREATE', 'Procedures', async req => {

        const role =
            await getUserRole(
                req.user.id,
                req.user
            )

        if(role !== 'Planner'){

            req.reject(
                403,
                'Only Planner'
            )

        }

    })

    this.on('CREATE', 'Procedures', async req => {

        const { ZI_MAINT_PROC } =
            procedureSrv.entities

        return procedureSrv.run(
            INSERT
                .into(ZI_MAINT_PROC)
                .entries(req.data)
        )

    })

})
