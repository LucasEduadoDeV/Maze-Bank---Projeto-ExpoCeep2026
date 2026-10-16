import { Request, Response, NextFunction } from "express";
import { z } from "zod"
export async function canRegister(req: Request, res: Response, next: NextFunction) {
    const { name, email, cpf, password } = req.body;
const registerSchema = z.object({
    name: z.string("Tem que ser uma string").trim().min(2, "A nome deve ter pelo menos 2 caracteres"),
    email: z.email("E-mail inválido"),
    cpf: z.string().transform((cpf) => cpf.replace(/\D/g, "")).pipe(z.string().length(11, "CPF deve ter 11 dígitos")),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
})
const result = registerSchema.safeParse(req.body)

if (!result.success) {
  return res.status(400).json({
    errors: result.error.issues,
  });
}
req.body = result.data
    next();
}