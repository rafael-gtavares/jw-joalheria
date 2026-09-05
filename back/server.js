import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

dotenv.config();

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

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Handler de erro genérico
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

const PORT = process.env.PORT || 4000;

initFirebaseAdmin();

connectDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error("Erro ao conectar no MongoDB:", err);
    process.exit(1);
  });
