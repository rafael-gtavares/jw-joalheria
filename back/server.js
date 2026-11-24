// Deve ser o primeiro import: carrega o .env antes de qualquer módulo que
// leia process.env na hora do import (ex.: shippingConfig, mercadoPagoService).
import "dotenv/config";

import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import connectDatabase from "./src/config/database.js";
import { initFirebaseAdmin } from "./src/config/firebase.js";
import "./src/config/cloudinary.js";

import authRoutes from "./src/routes/authRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import announcementRoutes from "./src/routes/announcementRoutes.js";
import shippingRoutes from "./src/routes/shippingRoutes.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import cartRoutes from "./src/routes/cartRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import { startOrderExpirationJob } from "./src/services/orderExpirationService.js";
import { startTrackingJob } from "./src/services/trackingService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

// Fallback local de imagens (usado apenas quando o Cloudinary não está configurado)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Handler de erro genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

const PORT = process.env.PORT || 4000;

initFirebaseAdmin();

// Variáveis indispensáveis ao checkout. Sem elas o pagamento não funciona
// (ex.: notification_url e back_urls ficariam "undefined/...").
const REQUIRED_CHECKOUT_ENV = [
  "MERCADO_PAGO_ACCESS_TOKEN",
  "FRONTEND_URL",
  "BACKEND_URL",
];
const missingEnv = REQUIRED_CHECKOUT_ENV.filter((name) => !process.env[name]);
if (missingEnv.length) {
  console.warn(
    `[checkout] Variáveis ausentes no .env: ${missingEnv.join(", ")}. ` +
      "O checkout com Mercado Pago não funcionará até configurá-las."
  );
}
if (process.env.NODE_ENV === "production" && !process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
  console.error(
    "MERCADO_PAGO_WEBHOOK_SECRET é obrigatório em produção (validação da assinatura do webhook)."
  );
  process.exit(1);
}

connectDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
    startOrderExpirationJob();
    startTrackingJob();
  })
  .catch((err) => {
    console.error("Erro ao conectar no MongoDB:", err);
    process.exit(1);
  });
