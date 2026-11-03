export class InvalidNameCardError extends Error {
    public statusCode: number;
    public name: string;

    constructor(statusCode = 400, name: string) {
        super(`O nome ${name} é inválido`);
        this.statusCode = statusCode;
        this.name = name;
    }
}