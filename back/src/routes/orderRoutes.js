import { Router } from "express";
import {
  createPublicOrder,
  createAdminOrder,
  listOrders,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import { requireAdmin } from "../middleware/authentication.js";

const router = Router();

router.post("/", createPublicOrder);

router.get("/", requireAdmin, listOrders);
router.post("/admin", requireAdmin, createAdminOrder);
router.put("/:id", requireAdmin, updateOrder);
router.put("/:id/status", requireAdmin, updateOrderStatus);
router.delete("/:id", requireAdmin, deleteOrder);

export default router;
