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
                    .from(users.UserSet)
                    .where({
                        UserId: userId
                    })
            )

        if(result && result.Role){
            return normalizeRole(result.Role)
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
        MP001: 'Planner',
        MS003: 'Supervisor',
        TC002: 'Technician',
        TC004: 'Technician',
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

function normalizeRole(role){

    const value =
        String(role || '')
            .trim()
            .toUpperCase()

    if(value.includes('SUPERVISOR')){
        return 'Supervisor'
    }

    if(value.includes('PLANNER')){
        return 'Planner'
    }

    if(value.includes('TECHNICIAN')){
        return 'Technician'
    }

    return role

}

module.exports = {
    getUserRole
}
