import { NextFunction, Request, Response } from "express";

//Service
import { checkIfUserHaveMoney } from "../services/transaction.service";

//Repositories
import { transaction, getPaginatedTransactionsRepository } from "../repositories/transaction.repository";

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

export async function getStatementController(req: Request, res: Response, next: NextFunction) {
    const id = req.user?.userId;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));

    try {
        const result = await getPaginatedTransactionsRepository(id!, page, limit);
        
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}