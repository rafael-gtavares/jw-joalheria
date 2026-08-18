import { Router } from "express";
import Product from "../models/Product.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Público — catálogo com filtros
router.get("/", async (req, res) => {
  const { category, featured, search } = req.query;
  const filter = { active: true };
  if (category) filter.category = category;
  if (featured) filter.featured = featured === "true";
  if (search) filter.name = { $regex: search, $options: "i" };

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
});

router.get("/:slug", async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, active: true });
  if (!product) return res.status(404).json({ error: "Peça não encontrada." });
  res.json(product);
});

// Admin — CRUD completo do estoque
router.post("/", requireAdmin, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ error: "Peça não encontrada." });
  res.json(product);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Admin — lista completa (inclusive inativos), pra tela de estoque
router.get("/admin/all", requireAdmin, async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

export default router;
