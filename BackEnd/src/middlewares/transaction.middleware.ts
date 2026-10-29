import type { Request, Response, NextFunction } from "express";
import z from "zod";

//Repositories
import { cpfAlreadyExists } from "../repositories/transaction.repository";
import { AppError } from "../errors/AppError";
import { InvalidAmountError } from "../errors/InvalidAmountError";

export async function canTransaction(req: Request, res: Response, next: NextFunction) {
    const { cpf, amount } = req.body;
const validAmount = z.object({
    amount: z.number().min(0.01, "Valor Inválido"),
    cpf: z.string().transform((cpf) => cpf.replace(/\D/g, "")).pipe(z.string().length(11, "CPF Inválido")),
})

const cpfExits = await cpfAlreadyExists(cpf)

if (cpfExits === null) {
    throw new AppError("CPF Não Encontrado", 404, cpf);
}

const result = await validAmount.safeParse(req.body)
if (!result.success) {
  throw new InvalidAmountError(400, amount)
}
req.body = result.data
    next()
}

