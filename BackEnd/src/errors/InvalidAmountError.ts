export class InvalidAmountError extends Error {
    public statusCode: number;
    public amount: number;

    constructor(statusCode = 400, amount: number) {
        super(`O Valor ${amount} é inválido`);
        this.statusCode = statusCode;
        this.amount = amount;
    }
}