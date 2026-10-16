import db from "../config/database"
import prisma from "../config/prisma"
export async function getPasswordHash(email: string) {
    const result = await prisma.user.findUnique({
        where: { email }
    })
    return result;
}