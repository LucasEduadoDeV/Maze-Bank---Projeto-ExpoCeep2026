export class AppError extends Error {
  public statusCode: number;
  public field?: "email" | "cpf";

  constructor(message: string, statusCode = 400, field?: "email" | "cpf") {
    super(message);
    this.statusCode = statusCode;
    this.field = field;
  }
}