import { Router } from "express";
import { addMoneyController } from "../controllers/money.controller";

const router = Router();

router.post("/increment", addMoneyController);

export default router;