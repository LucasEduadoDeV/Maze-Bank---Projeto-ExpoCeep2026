import { Router } from "express";

const router = Router();

//Middlewares
import { validateInvoicesBodyMiddleware } from "../middlewares/invoices.middleware";
import { auth } from "../middlewares/me.middleware";

//Controllers
import { createInvoiceController, deleteInvoiceController, getInvoicesController, payInvoiceWithBalanceAccountController } from "../controllers/invoices.controller";

router.post("/:cardId", auth, validateInvoicesBodyMiddleware, createInvoiceController)
router.get("/", auth, getInvoicesController)
router.delete("/:invoiceId/delete", auth, deleteInvoiceController)
router.patch("/invoice/:invoiceId/payment", auth, payInvoiceWithBalanceAccountController)
export default router;