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

    this.on(
        'getTechnicians',
        async () => {

            const userSrv =
                await cds.connect.to('UserService')

            const users =
                await userSrv.run(
                    SELECT.from(userSrv.entities.UserSet)
                )

            return users
                .filter(user =>
                    String(user.Role || '').toUpperCase().includes('TECHNICIAN')
                )
                .map(user => ({
                    userId: user.UserId,
                    userName: user.UserName
                }))

        }
    )

})
