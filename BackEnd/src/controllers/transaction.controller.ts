import { NextFunction, Request, Response } from "express";

//Service
import { checkIfUserHaveMoney } from "../services/transaction.service";

//Repositories
import { transaction, getPaginatedTransactionsRepository, getTransactionDetailsRepository } from "../repositories/transaction.repository";
import { AppError } from "../errors/AppError";
import { notifyUserAccountUpdated } from "../realtime";

export async function transactionController(req: Request, res: Response, next: NextFunction) {
    const { cpf, amount, description } = req.body;
    const id = req.user?.userId

    try {
    await checkIfUserHaveMoney(id!, amount);
    const result = await transaction(id!, cpf, amount, description);
    notifyUserAccountUpdated(result.senderId);
    notifyUserAccountUpdated(result.receiverId);
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

export async function getTransactionDetailsController(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.userId;
    const transactionId = req.params.transactionId;

    try {
        if (typeof transactionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(transactionId)) {
            throw new AppError("Transferência não encontrada.", 404);
        }

        const result = await getTransactionDetailsRepository(transactionId, userId!);
        if (!result) {
            throw new AppError("Transferência não encontrada.", 404);
        }

        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}