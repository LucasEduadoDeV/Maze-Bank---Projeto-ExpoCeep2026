import { Router } from "express";
//Middlewares
import { auth } from "../middlewares/me.middleware";
//Controllers
import { changeUserThemeController, getMe } from "../controllers/me.controller";

const router = Router();

router.get("/", auth, getMe)
router.get("/theme", auth, changeUserThemeController)

export default router;