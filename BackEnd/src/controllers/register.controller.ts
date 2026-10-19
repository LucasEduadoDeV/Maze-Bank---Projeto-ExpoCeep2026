import { NextFunction, Request, Response } from "express";
//Services
import { makePasswordHash, validateErrors } from "../services/register.service";

export async function registerController(req: Request, res: Response, next: NextFunction) {
    const { name, email, cpf, password } = req.body
    try{
        const passwordHash = await makePasswordHash(password);
        const dados = await validateErrors(name, email, cpf, passwordHash);
        res.status(201).json({message: `Registro Feito Com Sucesso`, dados});
    }
    catch(err) {
        return next(err);
    }
}