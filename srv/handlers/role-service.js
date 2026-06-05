const cds = require('@sap/cds')
const {
    getUserInfo
} = require('../lib/user-role')

module.exports =
cds.service.impl(function(){

    this.on(
        'getUserInfo',
        async req => {

            let userInfo = {
                userId: req.user.id,
                userName: req.user.id,
                email: undefined,
                role: 'Unknown'
            }

            try {
                userInfo =
                    await getUserInfo(
                        req.user.id,
                        req.user
                    )
            } catch (error) {
                cds.log('role-service').warn(
                    `Unable to resolve role for ${req.user.id}`
                )
            }

            return userInfo

        }
    )

})
