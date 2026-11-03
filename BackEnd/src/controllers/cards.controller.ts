import { NextFunction, Request, Response } from "express";
import { z } from "zod";

//Services
import { createCardService, revealCardSensitiveDetailsService } from "../services/cards.service";
import { comparePasswordHash } from "../services/login.service";

//Repositories
import { changeMainCardRepository, getCardsRepository } from "../repositories/cards.repository";
import { blockCardRepository } from "../repositories/cards.repository";
import { desblockCardRepository } from "../repositories/cards.repository";
import { deleteCardRepository } from "../repositories/cards.repository";
import { getPasswordHashWithId } from "../repositories/login.repository";

export async function createCardController(req: Request, res: Response, next: NextFunction) {
    const { name, monthlyIncome, theme } = req.body;
    const userId = req.user?.userId;

    try {
        const result = await createCardService(userId!, name, monthlyIncome, theme);
        res.status(201).json({
            id: result.idCard,
            name: result.name.trim(),
            lastFour: result.cardNumber.slice(-4),
            validateDate: result.validateDate.toISOString(),
            totalLimit: result.totalLimit.toString(),
            freeLimit: result.freeLimit.toString(),
            status: result.status,
            theme: result.theme,
            main: result.main,
        });
    }
    catch(err) {
        return next(err)
    }
}

export async function getCardsController(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.userId

    try {
        const result = await getCardsRepository(userId!);

        res.status(200).json(result.map((card) => ({
            id: card.idCard,
            name: card.name.trim(),
            lastFour: card.cardNumber.slice(-4),
            validateDate: card.validateDate.toISOString(),
            totalLimit: card.totalLimit.toString(),
            freeLimit: card.freeLimit.toString(),
            status: card.status,
            main: card.main,
            theme: card.theme,
        })));
    }
    catch (err) {
        return next(err);
    }
}

export async function revealCardSensitiveDetailsController(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.userId
    res.setHeader("Cache-Control", "no-store, private")
    res.setHeader("Pragma", "no-cache")
    const cardIdResult = z.uuid().safeParse(req.params.id)
    const bodyResult = z.object({ password: z.string().min(1) }).safeParse(req.body)

    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida" })
    }
    if (!cardIdResult.success || !bodyResult.success) {
        return res.status(400).json({ message: "Informe o cartão e a senha para confirmar sua identidade." })
    }

    try {
        const result = await revealCardSensitiveDetailsService(
            userId,
            cardIdResult.data,
            bodyResult.data.password,
        )

        return res.status(200).json({
            cardNumber: result.cardNumber,
            cvv: result.cvv,
        })
    }
    catch (err) {
        return next(err)
    }
}

export async function blockCardController(req: Request, res: Response, next: NextFunction) {
    const { password } = req.body;
    const userId = req.user?.userId;
    const cardIdResult = z.uuid().safeParse(req.params.id);

    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida" })
    }
    if (!cardIdResult.success) {
        return res.status(400).json({ message: "Identificador do cartão inválido." })
    }

    try {

        const passwordHash = await getPasswordHashWithId(userId)

        if (!passwordHash) {
            return res.status(404).json({ message: "Usuário não encontrado."});
        }

        await comparePasswordHash(password, passwordHash?.passwordHash!);

        const result = await blockCardRepository(userId, cardIdResult.data)
        if (!result) {
            return res.status(404).json({ message: "Cartão não encontrado." })
        }

        return res.status(200).json(result);
    }
    catch (err) {
        return next(err);
    }
}

export async function desblockCardController(req: Request, res: Response, next: NextFunction) {
    const { password } = req.body;
    const userId = req.user?.userId;
    const cardIdResult = z.uuid().safeParse(req.params.id);

    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida" })
    }
    if (!cardIdResult.success) {
        return res.status(400).json({ message: "Identificador do cartão inválido." })
    }

    try {

        const passwordHash = await getPasswordHashWithId(userId)

        if (!passwordHash) {
            return res.status(404).json({ message: "Usuário não encontrado."});
        }

        await comparePasswordHash(password, passwordHash?.passwordHash!);

        const result = await desblockCardRepository(userId, cardIdResult.data)
        if (!result) {
            return res.status(404).json({ message: "Cartão não encontrado." })
        }

        return res.status(200).json(result);
    }
    catch (err) {
        return next(err);
    }
}

export async function deleteCardController(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.userId;
    const cardIdResult = z.uuid().safeParse(req.params.id);
    const bodyResult = z.object({ password: z.string().min(1) }).safeParse(req.body);

    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida" })
    }
    if (!cardIdResult.success) {
        return res.status(400).json({ message: "Identificador do cartão inválido." })
    }
    if (!bodyResult.success) {
        return res.status(400).json({ message: "Informe sua senha para confirmar a exclusão." })
    }

    try {
        const passwordHash = await getPasswordHashWithId(userId)
        if (!passwordHash) {
            return res.status(404).json({ message: "Usuário não encontrado."});
        }

        await comparePasswordHash(bodyResult.data.password, passwordHash.passwordHash);

        const result = await deleteCardRepository(userId, cardIdResult.data)
        if (!result) {
            return res.status(404).json({ message: "Cartão não encontrado." })
        }

        return res.status(200).json({ deleted: true });
    }
    catch (err) {
        return next(err);
    }
}

export async function changeMainCard(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.userId
    const cardIdResult = z.uuid().safeParse(req.params.id);

    if (!userId) {
        return res.status(401).json({ message: "Sessão inválida" })
    }
    if (!cardIdResult.success) {
        return res.status(400).json({ message: "Identificador do cartão inválido." })
    }

    try {
        const result = await changeMainCardRepository(userId, cardIdResult.data)
        if (!result) {
            return res.status(404).json({ message: "Cartão não encontrado." })
        }

        return res.status(200).json({ id: result.idCard, main: result.main })
    }
    catch (err) {
        return next(err);
    }
}