import { Router } from "express";
const router = Router();

//Controllers
import { transactionController } from "../controllers/transaction.controller";
//Middlewares
import { canTransaction } from "../middlewares/transaction.middleware";
import { auth } from "../middlewares/me.middleware";

router.post("/", auth, canTransaction, transactionController )

export default router;