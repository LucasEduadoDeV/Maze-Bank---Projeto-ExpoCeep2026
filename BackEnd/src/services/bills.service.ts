import { AppError } from "../errors/AppError";

//Repositories
import { checkBillExistsRepository, deleteSettledBillRepository, findBillById, payBillWithAccountBalanceRepository, payBillWithCardRepository } from "../repositories/bills.repository";
import { checkBalanceCardRepository, checkIfCardIsAvailable } from "../repositories/cards.repository";
import { findUserByCpf, findUserById, getBalanceOfUser } from "../repositories/me.repository";

export async function checkBillExistsService(billId: string) {
    return await checkBillExistsRepository(billId)
}

export async function deleteSettledBillService(userId: string, billId: string) {
    const result = await deleteSettledBillRepository(userId, billId)
    if (result === "NOT_FOUND") {
        throw new AppError("Conta não encontrada.", 404)
    }
    if (result === "NOT_ALLOWED") {
        throw new AppError("Só é possível excluir contas pagas ou faturadas.", 409)
    }
    return result
}

export async function payBillWithCardService(billId: string, cardId: string) {
    const billExists = await findBillById(billId);

    if (!billExists) {
        throw new AppError("Conta não encontrada.", 404)
    }

    const checkBalance = await checkBalanceCardRepository(cardId);

    if (!checkBalance) {
        throw new AppError("Erro inesperado, tente novamente.", 500)
    }

    if (billExists.status === "PAGO") {
        throw new AppError("Essa conta já foi paga", 409)
    }

    if (billExists.value > checkBalance.freeLimit) {
        throw new AppError("Saldo insuficiente", 402)
    }

    const checkCard = await checkIfCardIsAvailable(cardId);
    
    if (checkCard?.status === "BLOQUEADO") {
        throw new AppError("O cartão está bloquado", 403)
    }

    let today: Date = new Date();
    let cardValidate = checkCard?.validateDate
    let todayMilliseconds = today.getTime();
    let validateMilliseconds = cardValidate?.getTime()

    if (!validateMilliseconds) {
        throw new AppError("Erro inesperado, tente novamente.", 500)
    }

    if (validateMilliseconds! < todayMilliseconds) {
        throw new AppError("O cartão está vencido.", 422)
    }

    const value = billExists.value;
    
    return await payBillWithCardRepository(billId, cardId, value);
}



export async function payBillWithBalanceAccountService(userId: string, billId: string) {
    const billExists = await findBillById(billId);

    if (!billExists) {
        throw new AppError("Conta não encontrada.", 404)
    }

    if (billExists.status !== "EM_ABERTO") {
        throw new AppError("Essa conta não está disponível para pagamento.", 409)
    }

    const userExists = await findUserById(userId);

    if (!userExists) {
        throw new AppError("Usuário não encontrado.", 404)
    }

    const userBalanceGet = await getBalanceOfUser(userId);

    if (!userBalanceGet) {
        throw new AppError("Erro interno, tente novamente.", 500)
    }

    const billValue = billExists.value
    const userBalance = userBalanceGet.balance

    if (billValue.greaterThan(userBalance)) {
        throw new AppError("Saldo insuficiente", 402)
    }

    return await payBillWithAccountBalanceRepository(billId, userId, billValue)
}

export async function checkUserIdByCpfService(cpf: string) {
    if (!cpf) {
        throw new AppError("CPF inválido.", 400)
    }

    const userId = await findUserByCpf(cpf)

    if (!userId) {
        throw new AppError("CPF não encontrado.", 404)
    }

    return userId;
}