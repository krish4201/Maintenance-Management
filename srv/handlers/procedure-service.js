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
        const data =
            procedurePayload(req)
        const existing =
            await findExistingProcedure(
                procedureSrv,
                ZI_MAINT_PROC,
                data.EquipmentID
            )

        if(existing){

            if(existing.Update_mc === false){

                req.reject(
                    409,
                    `A maintenance procedure already exists for equipment ${data.EquipmentID} and cannot be updated.`
                )

            }

            await procedureSrv.run(
                UPDATE(ZI_MAINT_PROC, { EquipmentID: data.EquipmentID })
                    .with(updatePayload(data))
            )

            return procedureSrv.run(
                SELECT.one
                    .from(ZI_MAINT_PROC)
                    .where({ EquipmentID: data.EquipmentID })
            )

        }

        try{

            return await procedureSrv.run(
                INSERT
                    .into(ZI_MAINT_PROC)
                    .entries(data)
            )

        } catch(error){

            if(isDuplicateKeyError(error)){

                req.reject(
                    409,
                    `A maintenance procedure already exists for equipment ${data.EquipmentID}. Reopen the procedure and save again to update it.`
                )

            }

            throw error

        }

    })

})

function procedurePayload(req) {

    const data =
        Object.assign(
            {},
            req.data
        )

    data.EquipmentID =
        String(data.EquipmentID || '').trim()

    if(!data.EquipmentID){

        req.reject(
            400,
            'Equipment ID is required to create or update a maintenance procedure.'
        )

    }

    delete data.Delete_mc
    delete data.Update_mc

    return data

}

function updatePayload(data) {

    const payload =
        Object.assign(
            {},
            data
        )

    delete payload.EquipmentID

    return payload

}

async function findExistingProcedure(procedureSrv, ZI_MAINT_PROC, equipmentId) {

    return procedureSrv.run(
        SELECT.one
            .from(ZI_MAINT_PROC)
            .columns('EquipmentID', 'Update_mc')
            .where({ EquipmentID: equipmentId })
    )

}

function isDuplicateKeyError(error) {

    const message =
        String(error && (error.message || error.details || error))
            .toLowerCase()

    return message.includes('key value is already in use') ||
        message.includes('duplicate') ||
        message.includes('already exists')

}
