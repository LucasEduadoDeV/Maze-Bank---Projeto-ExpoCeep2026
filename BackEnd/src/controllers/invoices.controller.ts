import { NextFunction, Request, Response } from "express";

import z from "zod";

//Types
import { CardIdParams } from "../types/CardIdParamsForInvoice.type";
import { createInvoiceService, deleteInvoiceService, payInvoiceWithBalanceAccountService } from "../services/invoices.service";
import { getPaginatedInvoicesRepository } from "../repositories/invoice.repository";
import { InvoiceIdParams } from "../types/InvoiceIdParams.type";

//Services
import { comparePasswordHash } from "../services/login.service";

//Repositories
import { getPasswordHashWithIdReturningOnlyPasswordHash } from "../repositories/login.repository";
import { notifyUserAccountUpdated } from "../realtime";

export async function createInvoiceController(req: Request<CardIdParams>, res: Response, next: NextFunction) {
    const userId = req.user?.userId
    const { predictedValue, nameInvoice } = req.body
    res.setHeader("Cache-Control", "no-store, private")
    res.setHeader("Pragma", "no-cache")
    const { cardId } = req.params
    const cardIdResult = z.uuid().safeParse(cardId)

    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida." });
    }
    if (!cardIdResult.success) {
        return res.status(400).json({ message: "Selecione um cartão válido." })
    }

    try {
        const invoice = await createInvoiceService(userId, cardId, predictedValue, nameInvoice)
        notifyUserAccountUpdated(userId)

        return res.status(201).json({ message: "Fatura criada.", invoice })
    }
    catch (err) {
        return next(err)
    }
}

export async function getInvoicesController(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.userId;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 5));
    const rawCardId = req.query.cardId
    const cardId = typeof rawCardId === "string" ? rawCardId : undefined

    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida" });
    }
    if (rawCardId !== undefined && (typeof rawCardId !== "string" || !z.uuid().safeParse(rawCardId).success)) {
        return res.status(400).json({ message: "Selecione um cartão válido." })
    }

    try {
        const result = await getPaginatedInvoicesRepository(userId, page, limit, cardId);
        
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function deleteInvoiceController(req: Request<InvoiceIdParams>, res: Response, next: NextFunction) {
    const userId = req.user?.userId
    res.setHeader("Cache-Control", "no-store, private")
    res.setHeader("Pragma", "no-cache")
    const { invoiceId } = req.params
    const invoiceIdResult = z.uuid().safeParse(invoiceId)

    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida." });
    }
    if (!invoiceIdResult.success) {
        return res.status(400).json({ message: "Selecione uma fatura válida." })
    }

    try {
        const deleted = await deleteInvoiceService(userId, invoiceId)
        notifyUserAccountUpdated(userId)

        return res.status(200).json({ message: "Fatura excluída.", deleted })
    }
    catch (err) {
        return next(err)
    }
}

export async function payInvoiceWithBalanceAccountController(req: Request<InvoiceIdParams>, res: Response, next: NextFunction) {
    const userId = req.user?.userId
    const passwordResult = z.string().min(1).safeParse(req.body?.password)
    res.setHeader("Cache-Control", "no-store, private")
    res.setHeader("Pragma", "no-cache")
    const { invoiceId } = req.params
    const invoiceIdResult = z.uuid().safeParse(invoiceId)

    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida." });
    }
    if (!invoiceIdResult.success) {
        return res.status(400).json({ message: "Selecione uma fatura válida." })
    }
    if (!passwordResult.success) {
        return res.status(400).json({ message: "Informe sua senha.", field: "password" })
    }

    try {
        const passwordHash = await getPasswordHashWithIdReturningOnlyPasswordHash(userId)

        if (!passwordHash) {
            return res.status(400).json({ message: "Essa conta não existe." })
        }

        await comparePasswordHash(passwordResult.data, passwordHash.passwordHash)
        const payment = await payInvoiceWithBalanceAccountService(userId, invoiceId)
        notifyUserAccountUpdated(userId)

        return res.status(200).json({
            paid: true,
            invoiceId,
            amountPaid: payment.amountPaid.toNumber(),
            invoicePaid: payment.invoicePaid,
            cardLimitRestored: payment.cardLimitRestored.toNumber(),
        });
    }
    catch (err) {
        return next(err);
    }
}
