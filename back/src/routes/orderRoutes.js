import { Router } from "express";
import {
  createPublicOrder,
  createAdminOrder,
  listMyOrders,
  getMyOrder,
  listOrders,
  getOrderAdmin,
  dispatchOrder,
  setOrderTracking,
  refreshOrderTracking,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import { requireAdmin, requireAuth } from "../middleware/authentication.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

// Checkout: exige cliente logado (o pedido fica ligado ao uid do Firebase).
router.post("/", requireAuth, rateLimit({ windowMs: 60_000, max: 10 }), createPublicOrder);

// Pedidos do próprio cliente (declarados antes das rotas com :id do admin).
router.get("/mine", requireAuth, listMyOrders);
router.get("/mine/:id", requireAuth, getMyOrder);

router.get("/", requireAdmin, listOrders);
router.post("/admin", requireAdmin, createAdminOrder);
router.get("/:id", requireAdmin, getOrderAdmin);
router.put("/:id", requireAdmin, updateOrder);
router.put("/:id/status", requireAdmin, updateOrderStatus);
router.put("/:id/dispatch", requireAdmin, dispatchOrder);
router.put("/:id/tracking", requireAdmin, setOrderTracking);
router.post("/:id/tracking/refresh", requireAdmin, refreshOrderTracking);
router.delete("/:id", requireAdmin, deleteOrder);

export default router;
