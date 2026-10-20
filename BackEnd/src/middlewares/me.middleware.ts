import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function auth(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(new Error("JWT_SECRET não configurada"));
  }

  const token = req.cookies.__user__token__;

  if (!token) {
    return res.status(401).json({ message: "Token não informado" });
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      res.clearCookie("__user__token__", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      });
      return res.status(401).json({ message: "Token inválido" });
    }

    req.user = { userId: payload.sub };
    return next();
  } catch (error) {

    if (error instanceof jwt.TokenExpiredError) {
      res.clearCookie("__user__token__", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      });
      return res.status(401).json({ message: "Token expirado" })
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }

    return next(error);
  }
}