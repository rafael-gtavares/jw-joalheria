import Product from "../models/Product.js";
import { CATEGORIES } from "../constants/categories.js";

function normalizeImages(images = []) {
  return images.map((img) =>
    typeof img === "string" ? { url: img, publicId: "" } : img
  );
}

function validatePayload(body, { partial = false } = {}) {
  const errors = [];
  if (!partial || body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) {
      errors.push("Categoria inválida.");
    }
  }
  if (!partial || body.price !== undefined) {
    if (typeof body.price !== "number" || body.price < 0) {
      errors.push("Preço inválido.");
    }
  }
  if (!partial || body.stock !== undefined) {
    if (body.stock !== undefined && (typeof body.stock !== "number" || body.stock < 0)) {
      errors.push("Quantidade em estoque inválida.");
    }
  }
  // Peso da peça (gramas) — usado internamente para o cálculo de frete.
  // Obrigatório no cadastro; validado também na edição sempre que enviado.
  if (!partial || body.shipping !== undefined) {
    const weight = body.shipping?.weight;
    if (weight === undefined || weight === null || weight === "") {
      errors.push("Informe o peso da peça em gramas.");
    } else if (typeof weight !== "number" || Number.isNaN(weight)) {
      errors.push("O peso da peça deve ser um número.");
    } else if (weight <= 0) {
      errors.push("O peso da peça deve ser maior que zero.");
    }
  }
  return errors;
}

export async function listPublicProducts(req, res) {
  const { category, featured, search, collection } = req.query;
  // "collection" no query mapeia para o campo collectionName no schema
  const filter = { active: true };
  if (category) filter.category = category;
  if (collection) filter.collectionName = collection;
  if (featured) filter.featured = featured === "true";
  if (search) filter.name = { $regex: search, $options: "i" };

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
}

export async function getProductBySlug(req, res) {
  const product = await Product.findOne({ slug: req.params.slug, active: true });
  if (!product) return res.status(404).json({ error: "Peça não encontrada." });
  res.json(product);
}

export async function listAllProducts(req, res) {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
}

function normalizeShipping(shipping) {
  if (!shipping) return shipping;
  const weight = Number(shipping.weight);
  return { weight: Number.isFinite(weight) ? weight : shipping.weight };
}

export async function createProduct(req, res) {
  const payloadForValidation = { ...req.body, shipping: normalizeShipping(req.body.shipping) };
  const errors = validatePayload(payloadForValidation);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  try {
    const payload = { ...payloadForValidation, images: normalizeImages(req.body.images) };
    const product = await Product.create(payload);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateProduct(req, res) {
  const payloadForValidation = {
    ...req.body,
    shipping: req.body.shipping ? normalizeShipping(req.body.shipping) : undefined,
  };
  const errors = validatePayload(payloadForValidation, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  try {
    const payload = { ...req.body };
    if (payload.shipping) payload.shipping = normalizeShipping(payload.shipping);
    if (payload.images) payload.images = normalizeImages(payload.images);

    const product = await Product.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: "Peça não encontrada." });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: "Peça não encontrada." });
  res.json({ ok: true });
}
