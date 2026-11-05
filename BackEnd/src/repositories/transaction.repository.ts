import { Decimal } from "@prisma/client/runtime/client";
import db from "../config/database"
import prisma from "../config/prisma"
import { AppError } from "../errors/AppError";
import { NotFundsError } from "../errors/NotFundsError";

export async function cpfAlreadyExists(cpf: string) {
    const result = await prisma.user.findUnique({
        where: { cpf },
        select: {
            cpf: true
        }
    })
    return result;
}

export async function checkUserMoney(id: string) {
    const result = await prisma.user.findUnique({
        where: { id },
        select: {
            balance: true
        }
    })   
    return result;
}

export async function transaction(
  senderId: string,
  receiverCpf: string,
  amount: Decimal,
  description: string
) {
  return prisma.$transaction(async (tx) => {
    const receiver = await tx.user.findUnique({
      where: { cpf: receiverCpf },
      select: { id: true },
    });

    if (!receiver) {
      throw new AppError("Destinatário não encontrado", 404);
    }

    if (receiver.id === senderId) {
      throw new AppError("Não é possível transferir para si mesmo", 400);
    }

    const debit = await tx.user.updateMany({
      where: {
        id: senderId,
        balance: { gte: amount },
      },
      data: {
        balance: { decrement: amount },
      },
    });

    if (debit.count === 0) {
      throw new NotFundsError(400);
    }

    await tx.user.update({
      where: { id: receiver.id },
      data: {
        balance: { increment: amount },
      },
    });

    return tx.transaction.create({
      data: {
        senderId,
        receiverId: receiver.id,
        cpf: receiverCpf,
        amount,
        description
      },
    });
  });
}

export async function getPaginatedTransactionsRepository(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [transactions, totalItems] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { name: true, cpf: true }
        },
        receiver: {
          select: { name: true, cpf: true }
        }
      }
    }),
    prisma.transaction.count({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    })
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: transactions,
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

export async function getTransactionDetailsRepository(transactionId: string, userId: string) {
  return prisma.transaction.findFirst({
    where: {
      id: transactionId,
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    },
    select: {
      id: true,
      amount: true,
      cpf: true,
      createdAt: true,
      description: true,
      type: true,
      senderId: true,
      receiverId: true,
      sender: { select: { name: true, cpf: true } },
      receiver: { select: { name: true, cpf: true } },
    },
  });
}