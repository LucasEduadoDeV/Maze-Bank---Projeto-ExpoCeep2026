import { NextFunction, Request, Response } from "express";
import z from "zod";
//Repositories
import { createBillRepository, findBillById, getPaginatedBillsRepository } from "../repositories/bills.repository";
import { AppError } from "../errors/AppError";

//Service
import { checkBillExistsService, checkUserIdByCpfService, deleteSettledBillService, payBillWithBalanceAccountService, payBillWithCardService } from "../services/bills.service";
import { cardExistsService } from "../services/cards.service";

//Types
import { BillAndCardParams } from "../types/BillAndCardParams.type";
import { BillIdParams } from "../types/BillIdParams.type";
import { comparePasswordHash } from "../services/login.service";
import { getPasswordHashWithId, getPasswordHashWithIdReturningOnlyPasswordHash } from "../repositories/login.repository";
import { CardIdParams } from "../types/CardIdParamsForInvoice.type";
import { notifyUserAccountUpdated } from "../realtime";


export async function createBillController(req: Request<CardIdParams>, res: Response, next: NextFunction) {
    const { billName, biller, description, dueDate, value, cpf } = req.body
    
    try {
        const checkUserId = await checkUserIdByCpfService(cpf);

        const userId = checkUserId.id

        const result = await createBillRepository(userId, billName, biller, description, dueDate, value)

        if (!result) {
            throw new AppError(`Erro ao criar a conta.`, 500)
        }

        notifyUserAccountUpdated(userId);
        res.status(201).json(result);
    }
    catch (err) {
        return next(err);
    }
}

export async function getBillsController(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.userId;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 5));

    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida" });
    }

    try {
        const result = await getPaginatedBillsRepository(userId!, page, limit);
        
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function deleteSettledBillController(req: Request<BillIdParams>, res: Response, next: NextFunction) {
    const userId = req.user?.userId
    const { billId } = req.params
    res.setHeader("Cache-Control", "no-store, private")
    res.setHeader("Pragma", "no-cache")

    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida." })
    }
    if (!z.uuid().safeParse(billId).success) {
        return res.status(400).json({ message: "Selecione uma conta válida." })
    }

    try {
        await deleteSettledBillService(userId, billId)
        notifyUserAccountUpdated(userId)
        return res.status(200).json({ deleted: true, billId })
    } catch (err) {
        return next(err)
    }
}

export async function payBillWithCardController(req: Request<BillAndCardParams>, res: Response, next: NextFunction) {
    const userId = req.user?.userId
    const { billId, cardId } = req.params
    const { password } = req.body;
    res.setHeader("Cache-Control", "no-store, private")
    res.setHeader("Pragma", "no-cache")
    const cardIdResult = z.uuid().safeParse(cardId)

    if (!billId) {
        return res.status(400).json({ message: "Id inválido." })
    } 
    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida." });
    }
    if (!cardIdResult.success) {
        return res.status(400).json({ message: "Informe o cartão e a senha para confirmar sua identidade." })
    }

    try {

        const passwordHash = await getPasswordHashWithIdReturningOnlyPasswordHash(userId)

        if (!passwordHash) {
            return res.status(400).json({ message: "Essa conta não existe." })
        }

        await comparePasswordHash(password, passwordHash.passwordHash)

        const billIdExists = await checkBillExistsService(billId)

        if (!billIdExists) {
            return res.status(400).json({ message: "Essa conta não existe." })
        }

        const cardExists = await cardExistsService(cardId);

        if (!cardExists) {
            return res.status(400).json({ message: "Esse cartão não existe" })
        }

        await payBillWithCardService(billId, cardId);
        notifyUserAccountUpdated(userId)

        return res.status(200).json({ paid: true, billId, cardId });
    }
    catch (err) {
        return next(err);
    }
}

export async function payBillWithBalanceAccountController(req: Request<BillIdParams>, res: Response, next: NextFunction) {
    const userId = req.user?.userId
    const { password } = req.body
    res.setHeader("Cache-Control", "no-store, private")
    res.setHeader("Pragma", "no-cache")
    const { billId } = req.params

    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida." });
    }
    if (!billId) {
        return res.status(400).json({ message: "Id inválido." })
    } 

    try {
        const passwordHash = await getPasswordHashWithIdReturningOnlyPasswordHash(userId)

        if (!passwordHash) {
            return res.status(400).json({ message: "Essa conta não existe." })
        }

        await comparePasswordHash(password, passwordHash.passwordHash)

        const billExist = await findBillById(billId);

        if (!billExist) {
            return res.status(400).json({ message: "Id inválido." })
        }

        await payBillWithBalanceAccountService(userId, billId)
        notifyUserAccountUpdated(userId)

        return res.status(200).json({ paid: true, billId });
    }
    catch (err) {
        return next(err);
    }
}