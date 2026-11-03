import db from "../config/database"
import prisma from "../config/prisma"

export async function getPasswordHash(email: string) {
    const result = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            passwordHash: true,
        }
    })
    return result;
}

export async function getPasswordHashWithId(id: string) {
    const result = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            passwordHash: true,
        }
    })
    return result;
}

export async function getPasswordHashWithIdReturningOnlyPasswordHash(id: string) {
    const result = await prisma.user.findUnique({
        where: { id },
        select: {
            passwordHash: true,
        }
    })
    return result;
}

export async function emailAlreadyExists(email: string) {
    const result = await prisma.user.findUnique({
        where:{ email },
        select: {
            email: true
        }
    })
    return result;
}
