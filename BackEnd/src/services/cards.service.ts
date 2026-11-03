import bcrypt from "bcrypt";
import { tr } from "zod/locales";
import { AppError } from "../errors/AppError";
import { Prisma } from "../generated/prisma/client";

//Repositories
import { createCardRepository, getCardSensitiveDetailsRepository, findCardRepository } from "../repositories/cards.repository";

//Utils
import { generate16DigitCardNumber } from "../utils/generateCard";
import { generateCvv } from "../utils/generateCvvCard";
import { generateValidateCard } from "../utils/generateValidateCard";
import { generateLimitCard } from "../utils/generateLimitCard";

//Errors
import { InvalidCardNumberError } from "../errors/InvalidCardNumberError";

export async function createCardService(userId: string, nameCard: string, monthlyIncome: number, theme: number) {
    
    try {
        const cardNumber = generate16DigitCardNumber();
        const cvv = generateCvv();
        const validateDate = generateValidateCard();
        const totalLimit = generateLimitCard(monthlyIncome)
                
        const result = await createCardRepository(userId, nameCard, cardNumber, cvv, validateDate, totalLimit, theme)
        if (!result) {
            throw new AppError("Erro no banco", 500)
        }
        return result;
    }
    catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                throw new InvalidCardNumberError("Número do cartão já existe, tente novamente", 409)
            }
        }

        throw error;
    }
}

export async function revealCardSensitiveDetailsService(userId: string, cardId: string, password: string) {
    const result = await getCardSensitiveDetailsRepository(userId, cardId)
    if (!result) {
        throw new AppError("Cartão não encontrado", 404)
    }

    const passwordMatches = await bcrypt.compare(password, result.passwordHash)
    if (!passwordMatches) {
        throw new AppError("Senha incorreta", 403, "password")
    }

    return result.card
}

export async function cardExistsService(cardId: string) {
    return await findCardRepository(cardId);
}