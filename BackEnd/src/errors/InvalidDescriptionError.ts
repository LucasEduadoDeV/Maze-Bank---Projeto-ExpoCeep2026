export class InvalidDescriptionError extends Error {
    public statusCode: number;

    constructor(statusCode = 400) {
        super(`Descrição inválida`);
        this.statusCode = statusCode;
    }
}