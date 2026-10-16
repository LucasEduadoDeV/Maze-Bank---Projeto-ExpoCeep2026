import { NextFunction, Request, Response } from "express";
//Services
import { comparePasswordHash } from "../services/login.service";
//Repositories
import { getPasswordHash } from "../repositories/login.repository";
export async function loginController(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;
    try {
        const result = await getPasswordHash(email);
        if (!result) {
            return res.status(404).json(`Email Não Cadastrado`);
        }
        await comparePasswordHash(password, result?.passwordHash!);
        res.status(200).json(`Login Feito Com Sucesso`);
    }
    catch (err) {
        return next(err);
    }
}