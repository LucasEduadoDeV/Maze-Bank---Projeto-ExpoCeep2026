import db from "../config/database"
import prisma from "../config/prisma"

export async function getCredentials(id: string) {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            balance: true,
            createdAt: true,
        }
    })
    return user;
}

export async function getThreeLastActivities(id: string) {
    const activities = await prisma.transaction.findMany({
        where: {
            OR: [
                { senderId: id },
                { receiverId: id },
            ]
        },
        take: 3,
        orderBy: {
            createdAt: 'desc'
        }
    })
    return activities;
}