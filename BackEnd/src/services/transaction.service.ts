import { AppError } from "../errors/AppError";
import { InvalidAmountError } from "../errors/InvalidAmountError";
import { NotFundsError } from "../errors/NotFundsError";

//Repositories
import { checkUserMoney } from "../repositories/transaction.repository";

export async function checkIfUserHaveMoney(id: string, amount: number) {

    const userMoney = await checkUserMoney(id);

    if (userMoney?.balance.lt(amount)) {
        throw new NotFundsError(400)
    }
}