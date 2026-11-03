import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

//Repositories
import { cpfAlreadyExists } from "../repositories/transaction.repository";

export async function validateBillBody(req: Request, res: Response, next: NextFunction) {
    const { billName, biller, description, dueDate, value, cpf } = req.body
    const billSchema = z.object({
        cpf: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().length(11, "CPF deve ter 11 dígitos")),
        billName: z.string().trim().nonempty().max(50, "O nome deve ter no máximo 50 caracteres."),
        biller: z.string().trim().nonempty().max(50, "O remetente deve ter no máximo 50 caracteres."),
        description: z.string().trim().nonempty().max(50, "A descrição deve ter no máximo 30 caracteres."),
        //"2020-01-01" -> Exemplo De z.date()
        dueDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de data inválido. Use AAAA-MM-DD" })
        .transform((val) => new Date(val)) 
        .refine((date) => !isNaN(date.getTime()), { message: "Data do calendário inválida (ex: 31 de fevereiro)" }),
        value: z.number().finite("Valor inválido.").min(0.01, "Valor deve ser maior que zero").max(9999999999999.99, "Valor excede o limite permitido"),
    })


    const result = billSchema.safeParse(req.body)
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            if (fieldErrors.billName) {
                throw new AppError(`O nome ${billName} é inválido.`, 400)
            }
            if (fieldErrors.biller) {
                throw new AppError(`O remetente ${biller} é inválido.`, 400)
            }
            if (fieldErrors.description) {
                throw new AppError(`A descrição ${description} é inválida.`, 400)
            }
            if (fieldErrors.dueDate) {
                throw new AppError(`A data ${dueDate} é inválida, use o formato: YYYY-MM-DD.`, 400)
            }
            if (fieldErrors.value) {
                throw new AppError(`O valor ${value} é inválido.`)
            }
            if (fieldErrors.cpf) {
                throw new AppError(`O cpf ${cpf} é inválido.`)
            }
            throw new AppError(`Dados da conta inválidos.`, 400);
        }

    
    const recipient = await cpfAlreadyExists(result.data.cpf);
        if (!recipient) {
            throw new AppError("CPF não encontrado", 404, "cpf");
        }

  req.body = result.data;
  return next();
}