export class AppError extends Error {
  public statusCode: number;
  public field: "email" | "cpf" | "password";

  constructor(message: string, statusCode = 400, field: "email" | "cpf" | "password") {
    super(message);
    this.statusCode = statusCode;
    this.field = field;
  }
}