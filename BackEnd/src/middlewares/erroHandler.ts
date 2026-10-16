import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError"
export function errorHandler(err: unknown, req: Request, res: Response, next:  NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.field && { field: err.field }),
    });
  }
  res.status(500).json({ message: "Erro interno no servidor" });
}