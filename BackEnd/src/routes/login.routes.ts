import { Router } from "express";

const router = Router();

//Controllers
import { loginController } from "../controllers/login.controller";

//Middlewares
import { canLogin } from "../middlewares/login.middleware";

router.post("/", canLogin, loginController)

export default router;