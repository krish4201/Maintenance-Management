const cds = require('@sap/cds')
const { getUserRole } = require('../lib/user-role')

module.exports = cds.service.impl(async function () {

    const equipmentSrv =
        await cds.connect.to('equipment')

    this.on('READ', 'Equipments', async req => {

        const { ZC_MASTER_EQUIPMENT } =
            equipmentSrv.entities

        return equipmentSrv.run(
            remoteQuery(
                req.query,
                ZC_MASTER_EQUIPMENT
            )
        )

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

function remoteQuery(query, entity) {

    const cloned =
        JSON.parse(
            JSON.stringify(query)
        )

    replaceEntityRef(
        cloned,
        entity.name
    )

    return cloned

}

function replaceEntityRef(value, targetName) {

    if(Array.isArray(value)){

        value.forEach(
            entry =>
                replaceEntityRef(
                    entry,
                    targetName
                )
        )

        return

    }

    if(!value || typeof value !== 'object'){

        return

    }

    if(
        Array.isArray(value.ref) &&
        [
            'EquipmentServiceAPI.Equipments',
            'Equipments'
        ].includes(value.ref[0])
    ){

        value.ref[0] =
            targetName

    }

    Object
        .values(value)
        .forEach(
            entry =>
                replaceEntityRef(
                    entry,
                    targetName
                )
        )

}
