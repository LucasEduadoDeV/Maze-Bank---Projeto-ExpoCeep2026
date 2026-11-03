import { Decimal } from "@prisma/client/runtime/client";
import prisma from "../config/prisma";
import { AppError } from "../errors/AppError";

export async function createInvoiceRepository(
  userId: string,
  cardId: string,
  invoiceName: string,
  totalPredicted: Decimal,
  dueDate: Date,
) {
  return prisma.$transaction(async (transaction) => {
    const paidBills = await transaction.bills.findMany({
      where: { userId, cardId, status: "PAGO" },
      select: {
        billId: true,
        billName: true,
        biller: true,
        description: true,
        value: true,
      },
    })

    const totalAmount = paidBills.reduce(
      (total, bill) => total.add(bill.value),
      new Decimal(0),
    )

    if (totalAmount.greaterThan(99999999.99)) {
      throw new AppError("O total da fatura excede o limite permitido.", 400)
    }

    const createdInvoice = await transaction.invoices.create({
      data: {
        invoiceName,
        totalAmount,
        totalPredicted,
        status: totalAmount.isZero() ? "PAGO" : "EM_ABERTO",
        dueDate,
        cardId,
        itens: paidBills.map(({ billId, billName, biller, description, value }) => ({
          billId,
          billName,
          biller,
          description,
          value: value.toNumber(),
        })),
        userId,
      },
    })

    if (paidBills.length > 0) {
      const updatedBills = await transaction.bills.updateMany({
        where: {
          userId,
          cardId,
          status: "PAGO",
          billId: { in: paidBills.map((bill) => bill.billId) },
        },
        data: { status: "FATURADO" },
      })

      if (updatedBills.count !== paidBills.length) {
        throw new AppError("As contas pagas mudaram durante a criação da fatura. Tente novamente.", 409)
      }
    }

    return createdInvoice
  })
}


export async function getPaginatedInvoicesRepository(userId: string, page: number, limit: number, cardId?: string) {
  const skip = (page - 1) * limit;
  const where = { userId, ...(cardId ? { cardId } : {}) }

  const [invoices, totalItems] = await Promise.all([
    prisma.invoices.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }, { status: "desc" }],
      include: {
        card: {
          select: {
            idCard: true,
            name: true,
            cardNumber: true,
          },
        },
      },
    }),
    prisma.invoices.count({ where })
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: invoices.map(({ card, ...invoice }) => {
      const actualAmount = getInvoiceItemsTotal(invoice.itens)
      const totalPaid = invoice.totalPaid.greaterThan(actualAmount) ? actualAmount : invoice.totalPaid
      return {
        ...invoice,
        totalAmount: actualAmount,
        totalPredicted: getEffectivePredictedAmount(invoice.totalAmount, invoice.totalPredicted, actualAmount),
        totalPaid,
        status: invoice.status === "CANCELADO"
          ? invoice.status
          : actualAmount.isZero() || totalPaid.greaterThanOrEqualTo(actualAmount)
            ? "PAGO"
            : invoice.status,
        card: card
          ? {
              id: card.idCard,
              name: card.name,
              lastFour: card.cardNumber.slice(-4),
            }
          : null,
      }
    }),
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

export async function deleteInvoiceRepository(userId: string, invoiceId: string) {
    const result = await prisma.invoices.deleteMany({
        where: { invoiceId, userId }
    })
    return result.count > 0
}

export async function payInvoiceWithAccountBalanceRepository(invoiceId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoices.findFirst({
      where: { invoiceId, userId },
      select: { totalPaid: true, itens: true, status: true, cardId: true },
    })

    if (!invoice) {
      throw new AppError("Fatura não encontrada.", 404)
    }
    if (invoice.status === "CANCELADO") {
      throw new AppError("Esta fatura foi cancelada.", 409)
    }
    const actualAmount = getInvoiceItemsTotal(invoice.itens)
    if (actualAmount.isZero()) {
      throw new AppError("Esta fatura não possui gastos reais para pagar.", 409)
    }
    if (invoice.status === "PAGO" || invoice.totalPaid.greaterThanOrEqualTo(actualAmount)) {
      throw new AppError("A fatura já foi paga.", 409)
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    })
    if (!user) {
      throw new AppError("Usuário não encontrado.", 404)
    }
    if (user.balance.lessThanOrEqualTo(0)) {
      throw new AppError("Saldo insuficiente.", 402)
    }

    const remainingAmount = actualAmount.sub(invoice.totalPaid)
    const amountPaid = user.balance.lessThan(remainingAmount) ? user.balance : remainingAmount
    const debit = await tx.user.updateMany({
      where: { id: userId, balance: { gte: amountPaid } },
      data: { balance: { decrement: amountPaid } },
    })
    if (debit.count !== 1) {
      throw new AppError("Saldo insuficiente. Atualize a página e tente novamente.", 402)
    }

    const invoicePaid = amountPaid.greaterThanOrEqualTo(remainingAmount)
    const updatedInvoice = await tx.invoices.updateMany({
      where: {
        invoiceId,
        userId,
        status: "EM_ABERTO",
        totalPaid: invoice.totalPaid,
      },
      data: {
        totalPaid: { increment: amountPaid },
        status: invoicePaid ? "PAGO" : "EM_ABERTO",
      },
    })
    if (updatedInvoice.count !== 1) {
      throw new AppError("A fatura foi atualizada durante o pagamento. Atualize e tente novamente.", 409)
    }

    const card = await tx.creditCards.findFirst({
      where: { idCard: invoice.cardId, userId },
      select: { freeLimit: true, totalLimit: true },
    })
    if (!card) {
      throw new AppError("O cartão vinculado à fatura não foi encontrado.", 404)
    }

    const availableLimitToRestore = card.totalLimit.sub(card.freeLimit)
    const cardLimitRestored = availableLimitToRestore.greaterThan(0)
      ? amountPaid.lessThan(availableLimitToRestore) ? amountPaid : availableLimitToRestore
      : new Decimal(0)

    if (cardLimitRestored.greaterThan(0)) {
      const cardUpdated = await tx.creditCards.updateMany({
        where: {
          idCard: invoice.cardId,
          userId,
          freeLimit: card.freeLimit,
        },
        data: { freeLimit: { increment: cardLimitRestored } },
      })
      if (cardUpdated.count !== 1) {
        throw new AppError("O limite do cartão foi atualizado durante o pagamento. Atualize e tente novamente.", 409)
      }
    }

    return { amountPaid, invoicePaid, cardLimitRestored }
  })
}

function getInvoiceItemsTotal(items: unknown): Decimal {
  if (!Array.isArray(items)) {
    throw new AppError("O detalhamento da fatura é inválido.", 500)
  }

  return items.reduce((total, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new AppError("O detalhamento da fatura é inválido.", 500)
    }

    if (!("value" in item)) {
      throw new AppError("O detalhamento da fatura é inválido.", 500)
    }

    const value = item.value
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new AppError("O detalhamento da fatura é inválido.", 500)
    }

    return total.add(new Decimal(value))
  }, new Decimal(0))
}

function getEffectivePredictedAmount(totalAmount: Decimal, totalPredicted: Decimal, actualAmount: Decimal): Decimal {
  const legacyPredicted = totalAmount.sub(actualAmount)
  const nonNegativeLegacyPredicted = legacyPredicted.greaterThan(0) ? legacyPredicted : new Decimal(0)
  return totalPredicted.greaterThan(nonNegativeLegacyPredicted) ? totalPredicted : nonNegativeLegacyPredicted
}