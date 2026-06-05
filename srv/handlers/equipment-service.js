const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {

    const equipmentSrv =
        await cds.connect.to('equipment')

    this.on('READ', 'Equipments', async req => {

        return equipmentSrv.run(req.query)

    })

})