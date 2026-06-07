const cds = require('@sap/cds')
const { getUserRole } = require('../lib/user-role')

module.exports = cds.service.impl(async function () {

    const procedureSrv =
        await cds.connect.to('procedure')

    this.on('READ', 'Procedures', async req => {

        const lookup =
            procedureLookupFromWhere(
                req.query?.SELECT?.where
            )
        const result =
            await procedureSrv.run(req.query)

        logProcedureRead(
            lookup,
            result
        )

        return result

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
                procedureKey(data)
            )

        if(existing){

            if(existing.Update_mc === false){

                req.reject(
                    409,
                    `A maintenance procedure already exists for equipment ${data.EquipmentID} and maintenance type ${data.MaintenanceCategory}, but it cannot be updated.`
                )

            }

            await procedureSrv.run(
                UPDATE(ZI_MAINT_PROC, procedureKey(data))
                    .with(updatePayload(data))
            )

            return procedureSrv.run(
                SELECT.one
                    .from(ZI_MAINT_PROC)
                    .where(procedureKey(data))
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
                    `A maintenance procedure already exists for equipment ${data.EquipmentID} and maintenance type ${data.MaintenanceCategory}. Reopen the procedure and save again to update it.`
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
    data.MaintenanceCategory =
        String(data.MaintenanceCategory || '').trim()

    if(!data.EquipmentID){

        req.reject(
            400,
            'Equipment ID is required to create or update a maintenance procedure.'
        )

    }

    if(!data.MaintenanceCategory){

        req.reject(
            400,
            'Maintenance type is required to create or update a maintenance procedure.'
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
    delete payload.MaintenanceCategory

    return payload

}

function procedureKey(data) {

    return {
        EquipmentID: data.EquipmentID,
        MaintenanceCategory: data.MaintenanceCategory
    }

}

async function findExistingProcedure(procedureSrv, ZI_MAINT_PROC, key) {

    return procedureSrv.run(
        SELECT.one
            .from(ZI_MAINT_PROC)
            .columns('EquipmentID', 'MaintenanceCategory', 'Update_mc')
            .where(key)
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

function procedureLookupFromWhere(where) {

    return {
        EquipmentID: findWhereValue(where, 'EquipmentID'),
        MaintenanceCategory: findWhereValue(where, 'MaintenanceCategory')
    }

}

function findWhereValue(where, field) {

    if(!Array.isArray(where)){

        return undefined

    }

    for(let index = 0; index < where.length - 2; index += 1){

        if(
            where[index]?.ref?.[0] === field &&
            where[index + 1] === '='
        ){

            return where[index + 2]?.val

        }

    }

    return undefined

}

function logProcedureRead(lookup, result) {

    if(!lookup.EquipmentID && !lookup.MaintenanceCategory){

        return

    }

    const rows =
        Array.isArray(result)
            ? result
            : result
                ? [result]
                : []

    console.log(
        '[procedure-service] READ Procedures',
        {
            requestedEquipmentID: lookup.EquipmentID,
            requestedMaintenanceType: lookup.MaintenanceCategory,
            returned: rows.map(row => ({
                EquipmentID: row.EquipmentID,
                MaintenanceCategory: row.MaintenanceCategory
            }))
        }
    )

}
