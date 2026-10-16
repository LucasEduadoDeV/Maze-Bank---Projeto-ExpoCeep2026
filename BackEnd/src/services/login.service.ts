import bcrypt from "bcrypt"
import { Prisma } from "../generated/prisma/client";
import { AppError } from "../errors/AppError";
export async function comparePasswordHash(password: string, passwordHash: string) {
    const result = await bcrypt.compare(password, passwordHash)
    if(result === false){
        throw new AppError("Senha incorreta")
    }
    return result;
}