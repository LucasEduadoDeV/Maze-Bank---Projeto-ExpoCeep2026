import { Router } from "express";
//Middlewares
import { auth } from "../middlewares/me.middleware";
//Controllers
import { getMe } from "../controllers/me.controller";

const router = Router();

router.get("/", auth, getMe)

export default router;