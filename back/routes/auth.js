import { Router } from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Login do admin — não existe cadastro público, o admin é criado via seed
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email?.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const valid = await admin.checkPassword(password || "");
    if (!valid) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      admin: { name: admin.name, email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao autenticar." });
  }
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

export default router;
