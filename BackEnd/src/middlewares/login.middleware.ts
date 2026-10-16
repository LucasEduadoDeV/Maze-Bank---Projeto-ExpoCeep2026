import { Request, Response, NextFunction } from "express";
import { z } from "zod"
export async function canLogin(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
const loginSchema = z.object({
    email: z.email("E-mail inválido"),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres")
})
const result = await loginSchema.safeParse(req.body)
if (!result.success) {
  return res.status(400).json({
    errors: result.error.issues,
  });
}
req.body = result.data

    next()
}