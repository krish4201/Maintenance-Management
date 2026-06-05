const cds = require('@sap/cds')
const {
    getUserRole
} = require('../lib/user-role')

module.exports =
cds.service.impl(function(){

    this.on(
        'getUserInfo',
        async req => {

            let role = 'Unknown'

            try {
                role =
                    await getUserRole(
                        req.user.id,
                        req.user
                    )
            } catch (error) {
                cds.log('role-service').warn(
                    `Unable to resolve role for ${req.user.id}`
                )
            }

            return {

                userId:
                    req.user.id,

                role:
                    role

            }

        }
    )

})
