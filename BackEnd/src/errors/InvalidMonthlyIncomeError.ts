export class InvalidMonthlyIncomeError extends Error {
    public statusCode: number;
    public monthlyIncome: number;

    constructor(statusCode = 400, monthlyIncome: number) {
        super(`A Renda R$${monthlyIncome} é inválida`);
        this.statusCode = statusCode;
        this.monthlyIncome = monthlyIncome;
    }
}