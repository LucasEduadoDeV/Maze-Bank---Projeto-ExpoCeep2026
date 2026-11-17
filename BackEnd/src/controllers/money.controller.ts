import { NextFunction, Request, Response } from "express";
import { addMoneyRepository } from "../repositories/money.repository";

export async function addMoneyController(req: Request, res: Response, next: NextFunction) {
    try {
        const { amount, cpf } = req.body;
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: "Valor inválido. O valor deve ser um número positivo." });
        }
        if (!cpf || typeof cpf !== 'string') {
            return res.status(400).json({ message: "CPF inválido." });
        }

        const result = await addMoneyRepository(cpf, amount);
        return res.status(200).json({ message: "Dinheiro adicionado com sucesso.", result });
    }
    catch (err) {
        return next(err);
    }
}