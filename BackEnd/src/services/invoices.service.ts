import { Decimal } from "@prisma/client/runtime/client";
import { AppError } from "../errors/AppError";
import { findCardForUserRepository, findCardRepository } from "../repositories/cards.repository";
import { createInvoiceRepository, deleteInvoiceRepository, payInvoiceWithAccountBalanceRepository } from "../repositories/invoice.repository";
import { findUserById } from "../repositories/me.repository";
import { createArtificialDueDate } from "../utils/createArtificialDueDateForInvoices.type";

export async function createInvoiceService(
  userId: string,
  cardId: string,
  predictedValue = 0,
  nameInvoice?: string,
) {
  const [user, card] = await Promise.all([
    findUserById(userId),
    findCardForUserRepository(cardId, userId),
  ])

  if (!user) {
    throw new AppError("Usuário não encontrado.", 404)
  }

  if (!card) {
    throw new AppError("Cartão não encontrado.", 404)
  }

  const invoiceName = nameInvoice?.trim() || "Minha fatura"
  const dueDate = await createArtificialDueDate()

  return createInvoiceRepository(
    userId,
    cardId,
    invoiceName,
    new Decimal(predictedValue),
    dueDate,
  )
}

export async function deleteInvoiceService(userId: string, invoiceId: string) {
    const deleted = await deleteInvoiceRepository(userId, invoiceId)
    if (!deleted) {
        throw new AppError("Fatura não encontrada.", 404)
    }
    return deleted
}



export async function payInvoiceWithBalanceAccountService(userId: string, invoiceId: string) {
  return payInvoiceWithAccountBalanceRepository(invoiceId, userId)
}