import prisma from "../config/prisma";

export async function createCardRepository(userId: string, nameCard: string, cardNumber: string, cvv: string, validateDate: Date, totalLimit: number, theme: number) {
    const result = await prisma.creditCards.create({
        data: {
            name: nameCard,
            cardNumber: cardNumber,
            cvv: cvv,
            validateDate: validateDate,
            totalLimit: totalLimit,
            freeLimit: totalLimit,
            theme,
            userId: userId
        },
    })
    return result;
}

export async function getCardsRepository(userId: string) {
    const result = await prisma.creditCards.findMany({
        where: { userId },
        orderBy: { validateDate: "desc" },
    })
    return result;
}

export async function getCardSensitiveDetailsRepository(userId: string, cardId: string) {
    const [card, user] = await Promise.all([
        prisma.creditCards.findFirst({
            where: { idCard: cardId, userId },
            select: {
                cardNumber: true,
                cvv: true,
            },
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true },
        }),
    ])

    if (!card || !user) return null
    return { card, passwordHash: user.passwordHash }
}

export async function blockCardRepository(userId: string, cardId: string) {
    const result = await prisma.creditCards.updateMany({
        where: { idCard: cardId, userId },
        data: { status: "BLOQUEADO" },
    })
    return result.count > 0 ? { status: "BLOQUEADO" as const } : null;
}

export async function desblockCardRepository(userId: string, cardId: string) {
    const result = await prisma.creditCards.updateMany({
        where: { idCard: cardId, userId },
        data: { status: "ATIVO" },
    })
    return result.count > 0 ? { status: "ATIVO" as const } : null;
}

export async function deleteCardRepository(userId: string, cardId: string) {
    const result = await prisma.creditCards.deleteMany({
        where: { idCard: cardId, userId },
    })
    return result.count > 0;
}

export async function changeMainCardRepository(userId: string, cardId: string) {
    return prisma.$transaction(async (transaction) => {
        const card = await transaction.creditCards.findFirst({
            where: { idCard: cardId, userId },
            select: { idCard: true },
        })

        if (!card) return null

        await transaction.creditCards.updateMany({
            where: { userId, main: true },
            data: { main: false },
        })

        return transaction.creditCards.update({
            where: { idCard: cardId, userId },
            data: { main: true },
            select: { idCard: true, main: true },
        })
    })
}

export async function findCardRepository(cardId: string) {
    const result = await prisma.creditCards.findUnique({
        where: { idCard: cardId },
        select: { idCard: true }
    })
    return result;
}

export async function findCardForUserRepository(cardId: string, userId: string) {
    return prisma.creditCards.findFirst({
        where: { idCard: cardId, userId },
        select: { idCard: true },
    })
}

export async function checkBalanceCardRepository(cardId: string) {
    const result = await prisma.creditCards.findUnique({
        where: { idCard: cardId },
        select: { freeLimit: true }
    })
    return result;
}

export async function checkIfCardIsAvailable(cardId: string) {
    const result = await prisma.creditCards.findUnique({
        where: { idCard: cardId },
        select: { status: true, validateDate: true }
    })
    return result;
}