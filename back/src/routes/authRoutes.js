import { Router } from "express";
import { me as adminMe } from "../controllers/authController.js";
import { syncProfile, me, updateProfile } from "../controllers/userController.js";
import { requireAdmin, requireAuth } from "../middleware/authentication.js";

const router = Router();

// Rota administrativa existente (mantida como estava).
router.get("/admin-me", requireAdmin, adminMe);

// Rotas de usuário comum/qualquer usuário autenticado.
router.post("/sync", requireAuth, syncProfile);
router.get("/me", requireAuth, me);
router.put("/me", requireAuth, updateProfile);

export default router;