const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {

    const equipment =
        await cds.connect.to(
            'equipment'
        )

    const procedure =
        await cds.connect.to(
            'procedure'
        )

    this.on('READ', 'Equipments',
        req => equipment.run(req.query))

    this.on('READ', 'Procedures',
        req => procedure.run(req.query))

})
