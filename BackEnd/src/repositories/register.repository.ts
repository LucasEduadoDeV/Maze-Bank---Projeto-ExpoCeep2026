import db from "../config/database"
import prisma from "../config/prisma"
export async function registerRepository(name: string, email: string, cpf: string, passwordHash: string, ) {
    const result = await prisma.user.create({
        data: {name, email, cpf, passwordHash},
        select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            createdAt: true,
        }
    })
    return result;
}