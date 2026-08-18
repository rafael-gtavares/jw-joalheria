import { Router } from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// Público — cliente finaliza pedido
router.post("/", async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, items, paymentMethod, notes } = req.body;
    if (!items?.length) return res.status(400).json({ error: "Carrinho vazio." });

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const order = await Order.create({
      customerName,
      customerEmail,
      customerPhone,
      items,
      total,
      paymentMethod,
      notes,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin — listar e gerenciar pedidos
router.get("/", requireAdmin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

// Admin — criar pedido manualmente (ex.: venda pelo WhatsApp/Instagram)
router.post("/admin", requireAdmin, async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, items, paymentMethod, notes, status } = req.body;
    if (!items?.length) return res.status(400).json({ error: "Adicione ao menos um item ao pedido." });

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const order = await Order.create({
      customerName,
      customerEmail: customerEmail || "não informado",
      customerPhone,
      items,
      total,
      paymentMethod,
      notes,
      status: status || "pendente",
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin — editar pedido completo (cliente, itens, pagamento, observações)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, items, paymentMethod, notes, status } = req.body;
    if (!items?.length) return res.status(400).json({ error: "O pedido precisa ter ao menos um item." });

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { customerName, customerEmail, customerPhone, items, total, paymentMethod, notes, status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id/status", requireAdmin, async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
  res.json(order);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
  res.json({ ok: true });
});

export default router;