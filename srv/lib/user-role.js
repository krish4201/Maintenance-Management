const cds = require('@sap/cds')

async function getUserRole(userId, user){

    try {
        const userSrv =
            await cds.connect.to('UserService')

        const users =
            userSrv.entities

        const result =
            await userSrv.run(
                SELECT.one
                    .from(users.Users)
                    .where({
                        UserID: userId
                    })
            )

        if(result && result.Role){
            return result.Role
        }
    } catch (error) {
        cds.log('user-role').warn(
            `UserService lookup failed for ${userId}; falling back to XSUAA roles`
        )
    }

    if(user?.is?.('Supervisor')){
        return 'Supervisor'
    }

    if(user?.is?.('Planner')){
        return 'Planner'
    }

    if(user?.is?.('Technician')){
        return 'Technician'
    }

    const localRoles = {
        U001: 'Planner',
        U002: 'Supervisor',
        U003: 'Technician',
        U004: 'Technician'
    }

    if(localRoles[userId]){
        return localRoles[userId]
    }

    throw new Error(
        `User ${userId} not found`
    )

}

module.exports = {
    getUserRole
}
