import { Router } from "express";

const router = Router();

//Middlwares
import { validateBillBody } from "../middlewares/bills.middleware";
import { auth } from "../middlewares/me.middleware";

//Controllers
import { createBillController, deleteSettledBillController, getBillsController, payBillWithBalanceAccountController, payBillWithCardController } from "../controllers/bills.controller";

router.post("/post", validateBillBody, createBillController)
router.get("/", auth, getBillsController)
router.delete("/:billId/delete", auth, deleteSettledBillController)
router.patch("/cards/:cardId/bills/:billId", auth, payBillWithCardController)
router.patch("/:billId", auth, payBillWithBalanceAccountController)

export default router;