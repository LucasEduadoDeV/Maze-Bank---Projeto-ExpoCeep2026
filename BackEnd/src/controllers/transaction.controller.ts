import { NextFunction, Request, Response } from "express";

//Service
import { checkIfUserHaveMoney } from "../services/transaction.service";

//Repositories
import { transaction } from "../repositories/transaction.repository";

export async function transactionController(req: Request, res: Response, next: NextFunction) {
    const { cpf, amount, description } = req.body;
    const id = req.user?.userId

    try {
    await checkIfUserHaveMoney(id!, amount);
    const result = await transaction(id!, cpf, amount, description);
    res.status(201).json(result);
    }
    catch (err) {
        return next(err)
    }
}