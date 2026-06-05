const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {

    const procedureSrv =
        await cds.connect.to('procedure')

    this.on('READ', 'Procedures', async req => {

        return procedureSrv.run(req.query)

    })

})
