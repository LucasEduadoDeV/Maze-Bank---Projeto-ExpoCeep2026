import db from "../config/database"
import prisma from "../config/prisma"

export async function addMoneyRepository(cpf: string, amount: number) {
    const result = await prisma.user.update({
        where: { cpf },
        data: { balance: { increment: amount } }
    })
    return result;
}