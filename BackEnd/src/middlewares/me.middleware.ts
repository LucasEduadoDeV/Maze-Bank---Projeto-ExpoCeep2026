import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function auth(req: Request, res: Response, next: NextFunction) {
  // CORREÇÃO PARA O NAVEGADOR: Se for uma requisição de verificação do CORS, deixa passar livre
  if (req.method === 'OPTIONS') {
    return next();
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(new Error("JWT_SECRET não configurada"));
  }

  const authHeader = req.get("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Token não informado" });
  }

  const [scheme, token, ...extraParts] = authHeader.trim().split(/\s+/);

  if (
    scheme?.toLowerCase() !== "bearer" ||
    !token ||
    extraParts.length > 0
  ) {
    return res.status(401).json({ message: "Formato de autorização inválido" });
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return res.status(401).json({ message: "Token inválido" });
    }

    req.user = { userId: payload.sub };
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }

    return next(error);
  }
}