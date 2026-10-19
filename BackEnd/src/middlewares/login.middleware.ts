import { Request, Response, NextFunction } from "express";
import { error } from "node:console";
import { z } from "zod"
import { AppError } from "../errors/AppError";

export async function canLogin(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
const loginSchema = z.object({
    email: z.email("E-mail inválido"),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres")
})

const result = await loginSchema.safeParse(req.body)
if (!result.success) {
  throw new AppError("Senha inválida", 404, 'password')
}
req.body = result.data
    next()
}