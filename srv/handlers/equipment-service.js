const cds = require('@sap/cds')
const { getUserRole } = require('../lib/user-role')

module.exports = cds.service.impl(async function () {

    const equipmentSrv =
        await cds.connect.to('equipment')

    this.on('READ', 'Equipments', async req => {

        return equipmentSrv.run(req.query)

    })

    this.before('CREATE', 'Equipments', async req => {

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

    this.on('CREATE', 'Equipments', async req => {

        const { ZC_MASTER_EQUIPMENT } =
            equipmentSrv.entities

        return equipmentSrv.run(
            INSERT
                .into(ZC_MASTER_EQUIPMENT)
                .entries(req.data)
        )

    })

})
