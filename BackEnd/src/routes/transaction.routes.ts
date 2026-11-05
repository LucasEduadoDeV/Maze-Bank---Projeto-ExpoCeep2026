import { Router } from "express";
const router = Router();

//Controllers
import { transactionController, getStatementController, getTransactionDetailsController } from "../controllers/transaction.controller";
//Middlewares
import { canTransaction } from "../middlewares/transaction.middleware";
import { auth } from "../middlewares/me.middleware";

router.get("/", auth, getStatementController);
router.get("/:transactionId", auth, getTransactionDetailsController);
router.post("/", auth, canTransaction, transactionController );

export default router;