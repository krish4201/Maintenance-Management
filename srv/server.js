const cds = require('@sap/cds')

cds.on('bootstrap', app => {

    console.log(
        'Maintenance Management Started'
    )

})

module.exports = cds.server