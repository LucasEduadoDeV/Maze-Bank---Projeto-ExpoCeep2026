import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export async function validateInvoicesBodyMiddleware(req: Request, res: Response, next: NextFunction) {
    const { predictedValue, nameInvoice } = req.body
    const invoiceSchema = z.object({
        predictedValue: z.number("Valor inválido.").finite("Valor inválido.").min(0, "O valor adicional não pode ser negativo.").max(99999999.99, "Valor excede o limite permitido.").optional(),
        nameInvoice: z.string("Nome inválido.").trim().max(30, "Nome deve ter no máximo 30 caracteres.").optional()
    })

    const result = invoiceSchema.safeParse(req.body);
    if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        if (fieldErrors.predictedValue) {
            throw new AppError(`O valor ${predictedValue} é inválido`, 400)
        }
        if (fieldErrors.nameInvoice) {
            throw new AppError(`O nome ${nameInvoice} é inválido`, 400)
        }
        throw new AppError(`Dados da conta inválidos.`, 400);
    }
    req.body = result.data
    return next();
}