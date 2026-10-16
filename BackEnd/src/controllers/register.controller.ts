import { NextFunction, Request, Response } from "express";
//Services
import { makePasswordHash, validateErrors } from "../services/register.service";
export async function registerController(req: Request, res: Response, next: NextFunction) {
    const { name, email, cpf, password } = req.body
    try{
        const passwordHash = await makePasswordHash(password);
        await validateErrors(name, email, cpf, passwordHash);
        res.status(201).json(`Registro Feito Com Sucesso`);
    }
    catch(err) {
        return next(err);
    }
}