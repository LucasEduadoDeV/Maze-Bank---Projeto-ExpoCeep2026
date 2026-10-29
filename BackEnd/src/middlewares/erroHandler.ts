import type { Request, Response, NextFunction } from "express";

type HttpError = Error & {
  statusCode: number;
  field?: string;
};

function isHttpError(error: unknown): error is HttpError {
  if (!(error instanceof Error) || !("statusCode" in error)) {
    return false;
  }

  const statusCode = error.statusCode;
  return typeof statusCode === "number"
    && Number.isInteger(statusCode)
    && statusCode >= 400
    && statusCode <= 599;
}

export function errorHandler(err: unknown, req: Request, res: Response, next:  NextFunction) {
  if (isHttpError(err)) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(typeof err.field === "string" && { field: err.field }),
    });
  }
  res.status(500).json({ message: "Erro interno no servidor" });
}