import { NextFunction, Request, Response } from "express";
//Services
import { comparePasswordHash } from "../services/login.service";
import { signToken } from "../services/login.service";
//Repositories
import { getPasswordHash } from "../repositories/login.repository";
import { AppError } from "../errors/AppError";

export async function loginController(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    try {
        const user = await getPasswordHash(email);
        if (!user) {
            throw new AppError(`Email inválido`, 404, `email`)
        }
        await comparePasswordHash(password, user?.passwordHash!);
        const token = await signToken(user);
        res.status(200).json({Result: `Login Feito Com Sucesso`, token: token});
    }
    catch (err) {
        return next(err);
    }   
}