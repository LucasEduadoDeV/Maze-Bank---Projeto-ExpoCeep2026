import { NextFunction, Request, Response } from "express";

//Repositories
import { getCredentials } from "../repositories/me.repository";
import { getThreeLastActivities } from "../repositories/me.repository";

export async function getMe(req: Request, res: Response, next: NextFunction) {
  const id = req.user?.userId
  if (!req.user) {
    return res.status(401).json({ message: "Autenticação necessária" });
  }

  const { userId } = req.user;
  try{
    const result = await getCredentials(userId);
    if (!result) {
        return res.status(404).json({message: `Usuário Não Encontrado`})
    }
    const activities = await getThreeLastActivities(id!)
    return res.status(200).json({Usuário: result, Ativadades: activities});
  }
  catch(err) {
    return next(err);
  }
}