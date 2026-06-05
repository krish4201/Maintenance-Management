const cds = require('@sap/cds')
const {
    getUserRole
} = require('../lib/user-role')

module.exports =
cds.service.impl(function(){

    this.on(
        'getUserInfo',
        async req => {

            const role =
                await getUserRole(
                    req.user.id,
                    req.user
                )

            return {

                userId:
                    req.user.id,

                role:
                    role

            }

        }
    )

})
