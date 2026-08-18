import { Router } from "express";
import Feedback from "../models/Feedback.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Público — só mostra avaliações aprovadas
router.get("/", async (req, res) => {
  const feedback = await Feedback.find({ approved: true }).sort({ createdAt: -1 }).limit(20);
  res.json(feedback);
});

router.post("/", async (req, res) => {
  try {
    const feedback = await Feedback.create(req.body);
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin — modera todas, inclusive pendentes
router.get("/admin/all", requireAdmin, async (req, res) => {
  const feedback = await Feedback.find().sort({ createdAt: -1 });
  res.json(feedback);
});

router.put("/:id/approve", requireAdmin, async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { approved: req.body.approved },
    { new: true }
  );
  res.json(feedback);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await Feedback.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
