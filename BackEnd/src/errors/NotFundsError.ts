export class NotFundsError extends Error {
    public statusCode: number;

    constructor(statusCode = 400) {
        super(`Saldo insuficiente para realizar a transação.`)
        this.statusCode = statusCode
    }
}