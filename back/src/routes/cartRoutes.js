import { Router } from "express";
import { getCart, updateCart } from "../controllers/cartController.js";
import { requireAuth } from "../middleware/authentication.js";

const router = Router();

router.get("/", requireAuth, getCart);
router.put("/", requireAuth, updateCart);

export default router;