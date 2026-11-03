import { tr } from "zod/locales";
import db from "../config/database"
import prisma from "../config/prisma"

export async function getCredentials(id: string) {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            balance: true,
            createdAt: true,
            theme: true,
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
      include: {
        sender: { select: { name: true } },
        receiver: { select: { name: true } }
      },
        take: 3,
        orderBy: {
            createdAt: 'desc'
        }
    })
    return activities;
}

export async function findUserById(userId: string) {
    const result = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
    })
    return result;
}

export async function getBalanceOfUser(userId: string) {
    const result = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true }
    })
    return result;
}

export async function findUserByCpf(cpf: string) {
    const result = await prisma.user.findUnique({
        where: { cpf },
        select: { id: true }
    })
    return result;
}

export async function changeUserThemeRepository(userId: string) {
    const theme = await prisma.user.findUnique({
        where: { id: userId },
        select: { theme: true }
    })

    const userTheme = theme?.theme

    if (userTheme === "LIGHT") {
        const result = await prisma.user.update({
            where: { id: userId },
            data: { theme: "DARK" },
            select: { theme: true }
        })
        return result;
    }

    const keepCurrentTheme = await prisma.user.update({
        where: { id: userId },
        data: { theme: "LIGHT" },
        select: { theme: true }
    })
    return keepCurrentTheme;
} 