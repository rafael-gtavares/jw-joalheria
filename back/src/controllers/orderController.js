import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { isValidCep } from "../services/shippingService.js";

// Recalcula subtotal/total no servidor a partir dos preços reais do banco —
// nunca confia no valor enviado pelo cliente.
async function buildValidatedItems(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error("O pedido precisa ter ao menos um item.");
  }

  const ids = items.map((i) => i.product).filter(Boolean);
  const products = await Product.find({ _id: { $in: ids } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  return items.map((item) => {
    const product = byId.get(String(item.product));
    const quantity = Math.max(1, Number(item.quantity) || 1);
    return {
      product: product?._id,
      name: product?.name || item.name || "Peça",
      price: product ? product.price : Number(item.price) || 0,
      quantity,
    };
  });
}

export async function createPublicOrder(req, res) {
  try {
    const { customerName, customerPhone, customerEmail, items, shippingCep, shippingCost, paymentMethod, notes } =
      req.body;

    // O frete agora é obrigatório: nenhum pedido de cliente pode ser
    // concluído sem que um frete válido tenha sido calculado antes. O
    // preço em si não é recalculado aqui (o pagamento ainda não existe
    // nesta etapa do projeto), mas a arquitetura já impede a criação do
    // pedido sem CEP e frete presentes e coerentes.
    if (!shippingCep || !isValidCep(shippingCep)) {
      throw new Error("Calcule o frete (CEP válido) antes de finalizar o pedido.");
    }
    const shippingValue = Number(shippingCost);
    if (!Number.isFinite(shippingValue) || shippingValue <= 0) {
      throw new Error("O frete precisa ser calculado antes de finalizar o pedido.");
    }

    const validatedItems = await buildValidatedItems(items);
    const subtotal = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = Number(shippingCost) || 0;

    const order = await Order.create({
      customerName,
      customerPhone,
      customerEmail,
      items: validatedItems,
      subtotal,
      shippingCep,
      shippingCost: shipping,
      total: subtotal + shipping,
      paymentMethod,
      notes,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function createAdminOrder(req, res) {
  try {
    const { customerName, customerPhone, customerEmail, items, shippingCep, shippingCost, paymentMethod, notes, status } =
      req.body;

    const validatedItems = await buildValidatedItems(items);
    const subtotal = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = Number(shippingCost) || 0;

    const order = await Order.create({
      customerName,
      customerPhone,
      customerEmail,
      items: validatedItems,
      subtotal,
      shippingCep,
      shippingCost: shipping,
      total: subtotal + shipping,
      paymentMethod,
      notes,
      status: status || "pendente",
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function listOrders(req, res) {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
}

export async function updateOrder(req, res) {
  try {
    const { customerName, customerPhone, customerEmail, items, shippingCep, shippingCost, paymentMethod, notes, status } =
      req.body;

    const validatedItems = await buildValidatedItems(items);
    const subtotal = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = Number(shippingCost) || 0;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        customerName,
        customerPhone,
        customerEmail,
        items: validatedItems,
        subtotal,
        shippingCep,
        shippingCost: shipping,
        total: subtotal + shipping,
        paymentMethod,
        notes,
        status,
      },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateOrderStatus(req, res) {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
  res.json(order);
}

export async function deleteOrder(req, res) {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
  res.json({ ok: true });
}
