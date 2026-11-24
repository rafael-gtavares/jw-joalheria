import express from "express";

import { paymentWebhook, syncPayment } from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/authentication.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/webhook", paymentWebhook);

// Sincroniza o pedido com o Mercado Pago sem depender do webhook.
router.post(
  "/sync/:orderId",
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 30 }),
  syncPayment
);

export default router;
