const cds = require('@sap/cds')

async function getUserInfo(userId, user){

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
            return {
                userId: result.UserId,
                userName: result.UserName,
                email: result.EmailId,
                role: normalizeRole(result.Role)
            }
        }
    } catch (error) {
        cds.log('user-role').warn(
            `UserService lookup failed for ${userId}; falling back to XSUAA roles`
        )
    }

    if(user?.is?.('Supervisor')){
        return fallbackUserInfo(userId, user, 'Supervisor')
    }

    if(user?.is?.('Planner')){
        return fallbackUserInfo(userId, user, 'Planner')
    }

    if(user?.is?.('Technician')){
        return fallbackUserInfo(userId, user, 'Technician')
    }

    const localUsers = {
        ALMAYUX20: { userId: 'MS003', userName: 'KRISHNA', email: 'RKKRAMESH2001@GMAIL.COM', role: 'Supervisor' },
        'RKKRAMESH2001@GMAIL.COM': { userId: 'MS003', userName: 'KRISHNA', email: 'RKKRAMESH2001@GMAIL.COM', role: 'Supervisor' },
        'REVATHIREDDY797@GMAIL.COM': { userId: 'MP001', userName: 'REVATHI', email: 'REVATHIREDDY797@GMAIL.COM', role: 'Planner' },
        'RAKSHITHAG79799@GMAIL.COM': { userId: 'TC002', userName: 'RAKSHITHA', email: 'RAKSHITHAG79799@GMAIL.COM', role: 'Technician' },
        'VISHUNYK108@GMAIL.COM': { userId: 'TC004', userName: 'VISHAL', email: 'VISHUNYK108@GMAIL.COM', role: 'Technician' },
        MP001: { userId: 'MP001', userName: 'REVATHI', email: 'REVATHIREDDY797@GMAIL.COM', role: 'Planner' },
        MS003: { userId: 'MS003', userName: 'KRISHNA', email: 'RKKRAMESH2001@GMAIL.COM', role: 'Supervisor' },
        TC002: { userId: 'TC002', userName: 'RAKSHITHA', email: 'RAKSHITHAG79799@GMAIL.COM', role: 'Technician' },
        TC004: { userId: 'TC004', userName: 'VISHAL', email: 'VISHUNYK108@GMAIL.COM', role: 'Technician' },
        U001: { userId: 'U001', userName: 'Planner', role: 'Planner' },
        U002: { userId: 'U002', userName: 'Supervisor', role: 'Supervisor' },
        U003: { userId: 'U003', userName: 'Technician', role: 'Technician' },
        U004: { userId: 'U004', userName: 'Technician', role: 'Technician' }
    }

    const localRoleKeys =
        [
            userId,
            getUserEmail(user)
        ].filter(Boolean).map(normalizeValue)

    for(const key of localRoleKeys){
        if(localUsers[key]){
            return localUsers[key]
        }
    }

    throw new Error(
        `User ${userId} not found`
    )

}

async function getUserRole(userId, user){

    const info =
        await getUserInfo(
            userId,
            user
        )

    return info.role

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

function fallbackUserInfo(userId, user, role){

    return {
        userId,
        userName: user?.attr?.name || userId,
        email: getUserEmail(user),
        role
    }

}

module.exports = {
    getUserInfo,
    getUserRole
}
