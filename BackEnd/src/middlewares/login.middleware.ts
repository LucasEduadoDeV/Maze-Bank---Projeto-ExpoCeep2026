import { Request, Response, NextFunction } from "express";
import { error } from "node:console";
import { z } from "zod"
import { AppError } from "../errors/AppError";
import { emailAlreadyExists } from "../repositories/login.repository";

export async function canLogin(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
const loginSchema = z.object({
    email: z.email("E-mail inválido"),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres")
})

const emailExits = await emailAlreadyExists(email);

if (!emailExits) {
    throw new AppError("Email inválido", 404, 'email')
}

const result = await loginSchema.safeParse(req.body)
if (!result.success) {
  throw new AppError("Senha inválida", 404, 'password')
}
req.body = result.data
    next()
}