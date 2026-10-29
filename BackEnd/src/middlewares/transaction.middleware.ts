import type { Request, Response, NextFunction } from "express";
import z from "zod";

//Repositories
import { cpfAlreadyExists } from "../repositories/transaction.repository";
import { AppError } from "../errors/AppError";
import { InvalidAmountError } from "../errors/InvalidAmountError";
import { InvalidDescriptionError } from "../errors/InvalidDescriptionError";

export async function canTransaction(req: Request, res: Response, next: NextFunction) {
  const transactionSchema = z.object({
    cpf: z.string()
      .transform((value) => value.replace(/\D/g, ""))
      .pipe(z.string().length(11, "CPF deve ter 11 dígitos")),
    amount: z.number()
      .finite("Valor inválido")
      .min(0.01, "Valor deve ser maior que zero")
      .max(9999999999999.99, "Valor excede o limite permitido"),
    description: z.string()
      .trim()
      .max(200, "Descrição deve ter no máximo 200 caracteres")
      .optional()
      .default(""),
  });

  const result = transactionSchema.safeParse(req.body);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    if (fieldErrors.cpf) {
      throw new AppError(fieldErrors.cpf[0], 400, "cpf");
    }
    if (fieldErrors.amount) {
      throw new InvalidAmountError(400, Number(req.body?.amount) || 0);
    }
    if (fieldErrors.description) {
      throw new InvalidDescriptionError(400);
    }
    throw new AppError("Dados da transação inválidos", 400);
  }

  const recipient = await cpfAlreadyExists(result.data.cpf);
  if (!recipient) {
    throw new AppError("CPF não encontrado", 404, "cpf");
  }

  req.body = result.data;
  return next();
}

