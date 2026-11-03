import { Decimal } from "@prisma/client/runtime/client";
import prisma from "../config/prisma";
import { AppError } from "../errors/AppError";

export async function createBillRepository(userId: string, billName: string, biller: string, description: string, dueDate: Date, value: string) {
    const result = await prisma.bills.create({
        data: {
            billName,
            biller,
            description,
            dueDate,
            value,
            userId,
        },
        select: { 
            billName: true,
            biller: true,
            description: true,
            dueDate: true,
            status: true,
            value: true,
         }
    })
    return result;
}

export async function getPaginatedBillsRepository(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [bills, totalItems] = await Promise.all([
    prisma.bills.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: [ { status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" } ],
    }),
    prisma.bills.count({ where: { userId } })
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: bills,
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

export async function checkBillExistsRepository(billId: string) {
  const result = await prisma.bills.findUnique({
    where: { billId },
    select: { billId: true }
  })
  return result;
}

export async function findBillById(billId: string) {
  const result = await prisma.bills.findUnique({
    where: { billId },
    select: { value: true,
              status: true,
              dueDate: true
     }
  })
  return result;
}

export async function deleteSettledBillRepository(userId: string, billId: string) {
  const bill = await prisma.bills.findFirst({
    where: { billId, userId },
    select: { status: true },
  })

  if (!bill) return "NOT_FOUND" as const
  if (bill.status !== "PAGO" && bill.status !== "FATURADO") return "NOT_ALLOWED" as const

  const result = await prisma.bills.deleteMany({
    where: {
      billId,
      userId,
      status: { in: ["PAGO", "FATURADO"] },
    },
  })

  return result.count > 0 ? "DELETED" as const : "NOT_ALLOWED" as const
}

export async function payBillWithCardRepository(billId: string, cardId: string, value: Decimal) {
    const result = await prisma.$transaction( async (tx) => {
      const receiver = await tx.bills.findUnique({
      where: { billId },
      select: { billId: true },
    });

    if (!receiver) {
      throw new AppError("Conta não encontrada", 404)
    }

      const debit = await tx.creditCards.updateMany({
      where: {
        idCard: cardId
      },
      data: {
        freeLimit: { decrement: value }
      },
    });

      if (debit.count === 0) {
        throw new AppError("Saldo insuficiente", 402);
      }

      await tx.bills.update({
      where: { billId },
      data: {
        status: { set: "PAGO" },
        cardId
      },
    });

      if (debit.count === 0) {
        throw new AppError("Saldo insuficiente", 402);
      }
  })
  return result;
}

export async function payBillWithAccountBalanceRepository(billId: string, userId: string, amount: Decimal) {
    const result = await prisma.$transaction( async (tx) => {
      const receiver = await tx.bills.findUnique({
      where: { billId },
      select: { billId: true },
    });

    if (!receiver) {
      throw new AppError("Conta não encontrada", 404)
    }

      const debit = await tx.user.updateMany({
      where: {
        id: userId
      },
      data: {
        balance: { decrement: amount }
      },
    });

      if (debit.count === 0) {
        throw new AppError("Saldo insuficiente", 402);
      }

      await tx.bills.update({
      where: { billId },
      data: {
        status: { set: "PAGO" }
      },
    });

      if (debit.count === 0) {
        throw new AppError("Saldo insuficiente", 402);
      }
  })
  return result;
}