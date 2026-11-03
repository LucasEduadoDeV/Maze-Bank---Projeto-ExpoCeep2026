import { Router } from "express";

const router = Router();

//Controllers
import {
    createCardController,
    deleteCardController,
    getCardsController,
    revealCardSensitiveDetailsController,
    blockCardController,
    desblockCardController,
    changeMainCard
} from "../controllers/cards.controller";

//Middlewares
import { validateDataFromCards } from "../middlewares/cards.middleware";
import { auth } from "../middlewares/me.middleware";

router.post("/", auth, validateDataFromCards, createCardController)

router.get("/", auth, getCardsController)
router.post("/:id/details", auth, revealCardSensitiveDetailsController)
router.patch("/:id/block", auth, blockCardController)
router.patch("/:id/desblock", auth, desblockCardController)
router.patch("/:id/main", auth, changeMainCard)
router.delete("/:id/delete", auth, deleteCardController)

export default router;