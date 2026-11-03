import { z } from "zod";
import { Request, Response, NextFunction } from "express";

//Errors
import { InvalidNameCardError } from "../errors/InvalidNameCardError";
import { InvalidMonthlyIncomeError } from "../errors/InvalidMonthlyIncomeError";

export async function validateDataFromCards(req: Request, res: Response, next: NextFunction) {
    const { name, monthlyIncome } = req.body;
    const validateSchema = z.object({
        name: z.string().trim().max(30, "O nome deve ter no máximo 30 caracteres"),
        monthlyIncome: z.coerce.number().positive().min(1621, "Pelo menos um salário mínimo"),
        theme: z.coerce.number().int().min(0).max(2).default(0),
    })

    const result = validateSchema.safeParse(req.body)
    if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        if (fieldErrors.name) {
            throw new InvalidNameCardError(400, name)
        }
        if (fieldErrors.monthlyIncome) {
            throw new InvalidMonthlyIncomeError(400, monthlyIncome)
        }
        if (fieldErrors.theme) {
            return res.status(400).json({ message: "A cor selecionada para o cartão é inválida.", field: "theme" })
        }
    }
    req.body = result.data
    next();
}