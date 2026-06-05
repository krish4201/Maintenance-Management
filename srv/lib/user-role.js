const cds = require('@sap/cds')

async function getUserRole(userId, user){

    try {
        const userSrv =
            await cds.connect.to('UserService')

        const users =
            userSrv.entities

        const result =
            await findUser(
                userSrv,
                users.UserSet,
                userId,
                user
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
        ALMAYUX20: 'Supervisor',
        'RKKRAMESH2001@GMAIL.COM': 'Supervisor',
        'REVATHIREDDY797@GMAIL.COM': 'Planner',
        'RAKSHITHAG79799@GMAIL.COM': 'Technician',
        'VISHUNYK108@GMAIL.COM': 'Technician',
        MP001: 'Planner',
        MS003: 'Supervisor',
        TC002: 'Technician',
        TC004: 'Technician',
        U001: 'Planner',
        U002: 'Supervisor',
        U003: 'Technician',
        U004: 'Technician'
    }

    const localRoleKeys =
        [
            userId,
            getUserEmail(user)
        ].filter(Boolean).map(normalizeValue)

    for(const key of localRoleKeys){
        if(localRoles[key]){
            return localRoles[key]
        }
    }

    throw new Error(
        `User ${userId} not found`
    )

}

async function findUser(userSrv, UserSet, userId, user){

    const allUsers =
        await userSrv.run(
            SELECT.from(UserSet)
        )

    const email =
        getUserEmail(user) ||
        (
            String(userId || '').includes('@')
                ? userId
                : null
        )

    if(email){
        const normalizedEmail =
            normalizeValue(email)

        const byEmail =
            allUsers.find(entry =>
                normalizeValue(entry.EmailId) === normalizedEmail
            )

        if(byEmail){
            return byEmail
        }
    }

    const lookupValues =
        new Set([
            userId,
            user?.attr?.user_name,
            user?.attr?.login_name,
            user?.attr?.name
        ].filter(Boolean).map(normalizeValue))

    return allUsers.find(entry =>
        lookupValues.has(normalizeValue(entry.UserId))
    ) || null

}

function getUserEmail(user){

    return user?.attr?.email ||
        user?.attr?.mail ||
        user?.attr?.Email ||
        user?.attr?.EmailId

}

function normalizeRole(role){

    const value =
        normalizeValue(role)

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

function normalizeValue(value){

    return String(value || '')
        .trim()
        .toUpperCase()

}

module.exports = {
    getUserRole
}
