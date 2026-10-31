import { Router } from "express";
const router = Router();
//Controllers
import { registerController } from "../controllers/register.controller";
//Middlewares
import { canRegister } from "../middlewares/register.middleware";
router.post("/", canRegister, registerController);
export default router;