import { Router } from "express";
import multer from "multer";
import { uploadImages } from "../controllers/uploadController.js";
import { requireAdmin } from "../middleware/authentication.js";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new Error("Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF."));
    }
    cb(null, true);
  },
});

const router = Router();

router.post("/", requireAdmin, upload.array("images", 6), uploadImages);

export default router;
