import bcrypt from "bcrypt"
import { Prisma } from "../generated/prisma/client";
import { AppError } from "../errors/AppError";
import jwt from "jsonwebtoken"

//Models
import { AccessTokenPayload } from "../models/user.model";

export async function comparePasswordHash(password: string, passwordHash: string) {
    const result = await bcrypt.compare(password, passwordHash)
    if(result === false){
        throw new AppError("Senha incorreta", 401, "password")
    }
    return result;
}

export async function signToken(user: AccessTokenPayload): Promise<string> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET não configurada");
    }
    const token = jwt.sign(
        {
            sub: user.id,
        },
        secret,
        { expiresIn: "5m" }
    );
    return token;
}