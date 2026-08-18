import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { requireAdmin } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new Error("Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF."));
    }
    cb(null, true);
  },
});

const router = Router();

// Admin — upload de até 6 fotos por vez (usado no cadastro/edição de peças)
router.post("/", requireAdmin, (req, res) => {
  upload.array("images", 6)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Erro ao enviar imagens." });
    }
    if (!req.files?.length) {
      return res.status(400).json({ error: "Nenhuma imagem enviada." });
    }
    const urls = req.files.map((f) => `/uploads/${f.filename}`);
    res.status(201).json({ urls });
  });
});

export default router;
