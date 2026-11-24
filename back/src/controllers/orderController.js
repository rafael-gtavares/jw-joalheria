import mongoose from "mongoose";

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import {
  isValidCep,
  quoteForService,
  ShippingProviderError,
} from "../services/shippingService.js";
import {
  mercadoPagoService,
  isSandboxToken,
  PaymentProviderError,
} from "../services/mercadoPagoService.js";
import {
  reserveStock,
  releaseOrderStock,
  restoreStock,
  StockError,
} from "../services/orderStockService.js";
import {
  getOrderExpirationMs,
  expireOverdueOrders,
} from "../services/orderExpirationService.js";
import {
  changeStatus,
  historyEntry,
  isValidTrackingCode,
  normalizeTrackingCode,
  StatusTransitionError,
} from "../services/orderStatusService.js";
import { refreshTracking } from "../services/trackingService.js";
import { GENDERS } from "../models/User.js";

const MAX_QUANTITY_PER_ITEM = 20;

const round2 = (n) => Math.round(n * 100) / 100;

// Erro de entrada do cliente: mensagem segura para devolver como 400.
class OrderInputError extends Error {}

// ======================================================
// ADMIN: recalcula preços a partir do banco
// ======================================================

// Recalcula subtotal/total no servidor a partir dos preços reais do banco.
// Usado pelas rotas administrativas (que aceitam peças fora de estoque).
async function buildValidatedItems(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error("O pedido precisa ter ao menos um item.");
  }

  const ids = items.map((i) => i.product).filter(Boolean);

  const products = await Product.find({
    _id: { $in: ids },
  });

  const byId = new Map(
    products.map((p) => [String(p._id), p])
  );

  return items.map((item) => {
    const product = byId.get(String(item.product));

    const quantity = Math.max(
      1,
      Number(item.quantity) || 1
    );

    return {
      product: product?._id,
      name: product?.name || item.name || "Peça",
      price: product
        ? product.price
        : Number(item.price) || 0,
      quantity,
    };
  });
}

// ======================================================
// CHECKOUT: itens validados com rigor (cliente)
// ======================================================

// Aceita apenas { productId, quantity } do cliente. Preço e nome vêm sempre
// do banco; produto inexistente/inativo, quantidade inválida ou sem estoque
// suficiente são rejeitados.
async function buildCheckoutItems(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new OrderInputError("O carrinho está vazio.");
  }
  if (items.length > 50) {
    throw new OrderInputError("Carrinho com itens demais.");
  }

  // Une linhas repetidas do mesmo produto.
  const quantities = new Map();
  for (const raw of items) {
    const productId = String(raw?.productId || raw?.product || "");
    const quantity = Number(raw?.quantity);

    if (!mongoose.isValidObjectId(productId)) {
      throw new OrderInputError("Um dos itens do carrinho é inválido.");
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new OrderInputError("Quantidade inválida em um dos itens.");
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  return [...quantities.entries()].map(([productId, quantity]) => {
    const product = byId.get(productId);

    if (!product) {
      throw new OrderInputError("Um dos produtos do carrinho não foi encontrado.");
    }
    if (product.active === false) {
      throw new OrderInputError(`A peça "${product.name}" não está mais disponível.`);
    }
    if (quantity > MAX_QUANTITY_PER_ITEM) {
      throw new OrderInputError(
        `Quantidade máxima por peça: ${MAX_QUANTITY_PER_ITEM}. Para pedidos maiores, fale conosco.`
      );
    }
    if (quantity > product.stock) {
      throw new OrderInputError(
        `A peça "${product.name}" não tem estoque suficiente (disponível: ${product.stock}).`
      );
    }

    return {
      product: product._id,
      name: product.name,
      price: round2(product.price),
      quantity,
    };
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function baseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

function checkoutResponse(order) {
  return {
    orderId: order._id,
    initPoint: order.checkoutUrl,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    expiresAt: order.expiresAt,
  };
}

// Cancela um pedido que não chegou a ser pago (falha ao criar a preferência)
// e devolve o estoque reservado.
async function abortOrder(order) {
  await Order.updateOne(
    { _id: order._id, paymentStatus: "pending", status: "pendente" },
    {
      $set: { status: "cancelado" },
      $push: {
        statusHistory: historyEntry({
          status: "cancelado",
          paymentStatus: "pending",
          source: "sistema",
          note: "Não foi possível iniciar o pagamento.",
        }),
      },
    }
  );
  await releaseOrderStock(order._id);
}

// ======================================================
// CRIA PEDIDO (CLIENTE LOGADO) + PREFERÊNCIA MERCADO PAGO
// ======================================================

export async function createPublicOrder(req, res) {
  let order = null;
  let stockReserved = false;
  let validatedItems = [];

  try {
    const {
      customerName,
      customerPhone,
      items,
      shippingCep,
      shippingServiceCode,
      idempotencyKey,
      notes,
    } = req.body || {};

    // Nenhum valor monetário do cliente é usado: nem preço de item, nem
    // frete. Tudo é recalculado aqui a partir do banco e dos Correios.
    const name = String(customerName || req.user.name || "").trim();
    const email = String(req.user.email || "").trim();

    if (!name) throw new OrderInputError("Nome do cliente é obrigatório.");
    if (!isValidEmail(email)) {
      throw new OrderInputError("Sua conta não tem um e-mail válido para o pedido.");
    }
    if (!shippingCep || !isValidCep(shippingCep)) {
      throw new OrderInputError("Informe um CEP válido e calcule o frete antes de finalizar.");
    }
    if (!shippingServiceCode) {
      throw new OrderInputError("Escolha uma opção de frete antes de finalizar.");
    }
    if (
      typeof idempotencyKey !== "string" ||
      idempotencyKey.length < 8 ||
      idempotencyKey.length > 100
    ) {
      throw new OrderInputError("Requisição de pedido inválida.");
    }

    // --------------------------------------------------
    // 0. Pedido repetido (duplo clique / retry): devolve o mesmo pedido
    // --------------------------------------------------
    const existing = await Order.findOne({ user: req.user.uid, idempotencyKey });
    if (existing) {
      if (existing.status === "pendente" && existing.checkoutUrl) {
        return res.status(200).json(checkoutResponse(existing));
      }
      return res.status(409).json({
        error: "Este pedido já foi processado. Atualize a página e tente novamente.",
      });
    }

    // --------------------------------------------------
    // 1. Itens e frete recalculados no servidor
    // --------------------------------------------------
    validatedItems = await buildCheckoutItems(items);

    let quote;
    try {
      quote = await quoteForService(
        shippingCep,
        validatedItems.map((i) => ({ productId: i.product, quantity: i.quantity })),
        shippingServiceCode
      );
    } catch (err) {
      if (err instanceof ShippingProviderError) throw err;
      throw new OrderInputError(err.message);
    }

    const shippingPrice = round2(quote.option.price);
    if (!(shippingPrice > 0)) {
      throw new ShippingProviderError("Os Correios retornaram um valor de frete inválido.");
    }

    const subtotal = round2(
      validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    );
    const total = round2(subtotal + shippingPrice);

    // --------------------------------------------------
    // 2. Reserva de estoque (atômica) e criação do pedido
    // --------------------------------------------------
    await reserveStock(validatedItems);
    stockReserved = true;

    const expiresAt = new Date(Date.now() + getOrderExpirationMs());

    try {
      order = await Order.create({
        user: req.user.uid,
        idempotencyKey,
        customerName: name,
        customerPhone: String(customerPhone || "").trim(),
        customerEmail: email,
        items: validatedItems,
        subtotal,
        shippingCep: quote.cep,
        shippingCost: shippingPrice,
        shipping: {
          cep: quote.cep,
          serviceCode: quote.option.serviceCode,
          serviceName: quote.option.serviceName,
          price: shippingPrice,
          productionDays: quote.option.productionDays,
          shippingDays: quote.option.shippingDays,
          estimatedDeliveryDate: quote.option.estimatedDeliveryDate,
        },
        total,
        paymentMethod: "Mercado Pago",
        status: "pendente",
        paymentStatus: "pending",
        stockReserved: true,
        expiresAt,
        statusHistory: [
          historyEntry({
            status: "pendente",
            paymentStatus: "pending",
            source: "sistema",
            note: "Pedido criado.",
          }),
        ],
        notes: String(notes || "").slice(0, 500),
      });
    } catch (err) {
      // Corrida: outra requisição com a mesma chave criou o pedido primeiro.
      if (err?.code === 11000) {
        await restoreStock(validatedItems);
        stockReserved = false;
        const winner = await Order.findOne({ user: req.user.uid, idempotencyKey });
        if (winner?.checkoutUrl) return res.status(200).json(checkoutResponse(winner));
        return res.status(409).json({
          error: "Este pedido já está sendo processado. Aguarde um instante.",
        });
      }
      throw err;
    }

    // --------------------------------------------------
    // 3. Preferência do Mercado Pago
    // --------------------------------------------------
    const frontUrl = baseUrl(process.env.FRONTEND_URL);
    const backUrl = baseUrl(process.env.BACKEND_URL);
    if (!frontUrl || !backUrl) {
      throw new PaymentProviderError(
        "Pagamento indisponível: FRONTEND_URL/BACKEND_URL não configurados."
      );
    }

    const mercadoPagoItems = validatedItems.map((item) => ({
      id: String(item.product),
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: "BRL",
    }));

    mercadoPagoItems.push({
      id: "shipping",
      title: `Frete (${quote.option.serviceName})`,
      quantity: 1,
      unit_price: shippingPrice,
      currency_id: "BRL",
    });

    const preferenceData = {
      items: mercadoPagoItems,
      payer: { name, email },
      external_reference: String(order._id),

      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: expiresAt.toISOString(),

      back_urls: {
        success: `${frontUrl}/pagamento/sucesso`,
        failure: `${frontUrl}/pagamento/falha`,
        pending: `${frontUrl}/pagamento/pendente`,
      },
      notification_url: `${backUrl}/api/payments/webhook`,
    };

    // O Mercado Pago só aceita auto_return com back_urls https públicas.
    if (frontUrl.startsWith("https://")) {
      preferenceData.auto_return = "approved";
    }

    const preference = await mercadoPagoService.createPreference(preferenceData, {
      idempotencyKey: `order-${order._id}`,
    });

    const checkoutUrl = isSandboxToken()
      ? preference.sandbox_init_point || preference.init_point
      : preference.init_point;

    if (!preference.id || !checkoutUrl) {
      throw new PaymentProviderError("Resposta inesperada do Mercado Pago.");
    }

    order.preferenceId = preference.id;
    order.checkoutUrl = checkoutUrl;
    await order.save();

    return res.status(201).json(checkoutResponse(order));
  } catch (err) {
    // Qualquer falha depois da reserva: cancela o pedido e devolve o estoque.
    try {
      if (order) await abortOrder(order);
      else if (stockReserved) await restoreStock(validatedItems);
    } catch (cleanupErr) {
      console.error("Erro ao desfazer pedido após falha:", cleanupErr);
    }

    if (err instanceof OrderInputError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof StockError) {
      return res.status(409).json({ error: err.message });
    }
    if (err instanceof ShippingProviderError || err instanceof PaymentProviderError) {
      console.error("Falha de integração ao criar pedido:", err);
      return res.status(502).json({ error: err.message });
    }

    console.error("Erro ao criar pedido:", err);
    return res.status(500).json({ error: "Não foi possível criar o pedido. Tente novamente." });
  }
}

// ======================================================
// CLIENTE: meus pedidos
// ======================================================

const CUSTOMER_FIELDS =
  "items subtotal shippingCost shipping total status paymentStatus paymentMethod " +
  "checkoutUrl paidAt expiresAt createdAt statusHistory tracking";

// Projeção segura para o cliente: sem e-mail/uid de quem alterou, sem erros
// internos de integração e sem flags de simulação.
export function toCustomerOrder(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    _id: o._id,
    items: o.items,
    subtotal: o.subtotal,
    shippingCost: o.shippingCost,
    shipping: o.shipping,
    total: o.total,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    checkoutUrl: o.status === "pendente" ? o.checkoutUrl : undefined,
    paidAt: o.paidAt,
    expiresAt: o.expiresAt,
    createdAt: o.createdAt,
    statusHistory: (o.statusHistory || []).map((h) => ({
      status: h.status,
      paymentStatus: h.paymentStatus,
      at: h.at,
      note: h.source === "admin" || h.source === "correios" ? h.note : "",
    })),
    tracking: o.tracking
      ? {
          code: o.tracking.code,
          carrier: o.tracking.carrier,
          dispatchedAt: o.tracking.dispatchedAt,
          deliveryStatus: o.tracking.deliveryStatus,
          lastEventAt: o.tracking.lastEventAt,
          events: o.tracking.events || [],
        }
      : undefined,
  };
}

// A listagem usa apenas o que já está gravado: nunca consulta os Correios.
export async function listMyOrders(req, res) {
  try {
    const orders = await Order.find({ user: req.user.uid })
      .select(CUSTOMER_FIELDS)
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(orders.map(toCustomerOrder));
  } catch (err) {
    console.error("Erro ao listar pedidos do cliente:", err);
    res.status(500).json({ error: "Não foi possível carregar seus pedidos." });
  }
}

export async function getMyOrder(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }
    // Filtra pelo uid do token: cliente nunca acessa pedido de outro (404,
    // sem revelar que o pedido existe).
    let order = await Order.findOne({ _id: req.params.id, user: req.user.uid });
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

    // Só consulta os Correios se o intervalo mínimo venceu.
    const result = await refreshTracking(order);
    order = result.order;

    res.json(toCustomerOrder(order));
  } catch (err) {
    console.error("Erro ao carregar pedido do cliente:", err);
    res.status(500).json({ error: "Não foi possível carregar o pedido." });
  }
}


// ======================================================
// ADMIN
// ======================================================

export async function createAdminOrder(req, res) {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      items,
      shippingCep,
      shippingCost,
      paymentMethod,
      notes,
      status,
      paymentStatus,
    } = req.body;

    const validatedItems =
      await buildValidatedItems(items);

    const subtotal = validatedItems.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );

    const shipping =
      Number(shippingCost) || 0;

    // Venda fora do site: o admin informa se já foi paga.
    const initialPayment = paymentStatus === "approved" ? "approved" : "pending";

    const initialStatus = status || "pendente";
    if (!VALID_STATUSES.includes(initialStatus)) {
      return res.status(400).json({ error: "Status de pedido inválido." });
    }
    if (["enviado", "entregue"].includes(initialStatus)) {
      return res.status(400).json({
        error: "Crie o pedido e registre o despacho (com o código de rastreio) depois.",
      });
    }

    const order = await Order.create({
      customerName,
      customerPhone,
      customerEmail,
      items: validatedItems,
      subtotal,
      shippingCep,
      shippingCost: shipping,
      total: subtotal + shipping,
      paymentMethod:
        paymentMethod || "Mercado Pago",
      notes,
      status: initialStatus,
      paymentStatus: initialPayment,
      paidAt: initialPayment === "approved" ? new Date() : undefined,
      statusHistory: [
        historyEntry({
          status: initialStatus,
          paymentStatus: initialPayment,
          source: "admin",
          actor: req.user,
          note: "Pedido criado manualmente.",
        }),
      ],
    });

    res.status(201).json(order);

  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
}


// ======================================================
// LISTAR
// ======================================================

const PAYMENT_STATUSES = Order.schema.path("paymentStatus").enumValues;

class FilterError extends Error {}

function parseDate(value, label, endOfDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    throw new FilterError(`Data inválida em "${label}".`);
  }
  const d = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  if (Number.isNaN(d.getTime())) throw new FilterError(`Data inválida em "${label}".`);
  return d;
}

function parseAge(value, label) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 120) {
    throw new FilterError(`"${label}" deve ser um número entre 0 e 120.`);
  }
  return n;
}

function yearsAgo(years, from = new Date()) {
  const d = new Date(from);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d;
}

function ageFromBirthDate(birthDate, now = new Date()) {
  if (!birthDate) return null;
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const hadBirthday =
    now.getUTCMonth() > birthDate.getUTCMonth() ||
    (now.getUTCMonth() === birthDate.getUTCMonth() && now.getUTCDate() >= birthDate.getUTCDate());
  if (!hadBirthday) age -= 1;
  return age;
}

// Monta o $match do pedido e o $match sobre os dados do cliente. Todos os
// filtros se combinam com AND.
function buildOrderFilters(query) {
  const match = {};
  const customerMatch = {};

  if (query.from || query.to) {
    match.createdAt = {};
    if (query.from) match.createdAt.$gte = parseDate(query.from, "de");
    if (query.to) match.createdAt.$lte = parseDate(query.to, "até", true);
    if (query.from && query.to && match.createdAt.$gte > match.createdAt.$lte) {
      throw new FilterError("A data inicial deve ser anterior à data final.");
    }
  }

  if (query.status) {
    if (!VALID_STATUSES.includes(query.status)) throw new FilterError("Status inválido.");
    match.status = query.status;
  }
  if (query.origin === "site") {
    match.user = { $nin: [null, ""] };
  } else if (query.origin === "manual") {
    match.user = { $in: [null, ""] };
  } else if (query.origin) {
    throw new FilterError("Origem inválida.");
  }
  if (query.paymentStatus) {
    if (!PAYMENT_STATUSES.includes(query.paymentStatus)) {
      throw new FilterError("Status de pagamento inválido.");
    }
    match.paymentStatus = query.paymentStatus;
  }
  if (query.deliveryStatus) {
    match["tracking.deliveryStatus"] = String(query.deliveryStatus);
  }

  if (query.q) {
    const escaped = String(query.q).trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (escaped) {
      match.$or = [
        { customerName: { $regex: escaped, $options: "i" } },
        { customerEmail: { $regex: escaped, $options: "i" } },
      ];
    }
  }

  if (query.gender) {
    if (!GENDERS.includes(query.gender)) throw new FilterError("Opção de sexo inválida.");
    customerMatch.gender = query.gender;
  }

  const minAge = query.minAge !== undefined && query.minAge !== "" ? parseAge(query.minAge, "Idade mínima") : null;
  const maxAge = query.maxAge !== undefined && query.maxAge !== "" ? parseAge(query.maxAge, "Idade máxima") : null;
  if (minAge !== null && maxAge !== null && minAge > maxAge) {
    throw new FilterError("A idade mínima deve ser menor ou igual à máxima.");
  }
  if (minAge !== null || maxAge !== null) {
    customerMatch.birthDate = {};
    // Idade >= minAge  <=>  nasceu em ou antes de (hoje - minAge anos)
    if (minAge !== null) customerMatch.birthDate.$lte = yearsAgo(minAge);
    // Idade <= maxAge  <=>  nasceu depois de (hoje - (maxAge+1) anos)
    if (maxAge !== null) customerMatch.birthDate.$gt = yearsAgo(maxAge + 1);
  }

  return { match, customerMatch: Object.keys(customerMatch).length ? customerMatch : null };
}

const ORDER_LOOKUP_STAGES = [
  {
    $lookup: {
      from: "users",
      localField: "user",
      foreignField: "uid",
      pipeline: [{ $project: { _id: 0, gender: 1, birthDate: 1 } }],
      as: "customer",
    },
  },
  { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
];

export async function listOrders(req, res) {
  try {
    // Garante que pedidos vencidos sejam cancelados mesmo que o servidor
    // tenha ficado "dormindo" (planos gratuitos hibernam).
    await expireOverdueOrders().catch((err) =>
      console.error("Erro ao expirar pedidos:", err)
    );

    const { match, customerMatch } = buildOrderFilters(req.query);

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const requestedPage = Math.max(1, parseInt(req.query.page, 10) || 1);

    // Com filtro de idade/sexo o cruzamento com `users` vem antes da
    // paginação; sem ele, só a página atual é cruzada (mais barato).
    const pipeline = [{ $match: match }];
    if (customerMatch) {
      pipeline.push(...ORDER_LOOKUP_STAGES, {
        $match: Object.fromEntries(
          Object.entries(customerMatch).map(([k, v]) => [`customer.${k}`, v])
        ),
      });
    }

    const [result] = await Order.aggregate([
      ...pipeline,
      {
        $facet: {
          total: [{ $count: "n" }],
          items: [
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: (requestedPage - 1) * limit },
            { $limit: limit },
            ...(customerMatch ? [] : ORDER_LOOKUP_STAGES),
            { $project: { processedPaymentEvents: 0 } },
          ],
        },
      },
    ]);

    const total = result.total[0]?.n || 0;
    const now = new Date();
    const items = result.items.map(({ customer, ...order }) => ({
      ...order,
      origin: order.user ? "site" : "manual",
      customerProfile: customer
        ? {
            gender: customer.gender || "nao_informado",
            age: ageFromBirthDate(customer.birthDate, now),
          }
        : null,
    }));

    res.json({
      items,
      total,
      page: requestedPage,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    if (err instanceof FilterError) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Erro ao listar pedidos:", err);
    res.status(500).json({ error: "Não foi possível listar os pedidos." });
  }
}

// Pedido completo (inclui histórico e rastreio) para o painel admin.
export async function getOrderAdmin(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
    res.json({ ...order.toObject(), origin: order.user ? "site" : "manual" });
  } catch (err) {
    console.error("Erro ao carregar pedido:", err);
    res.status(500).json({ error: "Não foi possível carregar o pedido." });
  }
}

// ======================================================
// DESPACHO E RASTREIO (ADMIN)
// ======================================================

function handleAdminError(res, err, fallback) {
  if (err instanceof StatusTransitionError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(fallback, err);
  return res.status(500).json({ error: fallback });
}

// Registra o despacho: valida o código, grava o rastreio e muda o status para
// "enviado" (com histórico) numa única operação.
export async function dispatchOrder(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }
    const code = normalizeTrackingCode(req.body?.trackingCode);
    if (!isValidTrackingCode(code)) {
      return res.status(400).json({
        error: "Código de rastreio inválido. Use o formato dos Correios (ex.: AA123456789BR).",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

    if (order.user && !["approved", "authorized"].includes(order.paymentStatus)) {
      return res.status(409).json({
        error: "O pagamento deste pedido ainda não foi aprovado.",
      });
    }

    const now = new Date();
    const { order: updated } = await changeStatus(order, "enviado", {
      source: "admin",
      actor: req.user,
      note: String(req.body?.note || "").trim() || `Despachado. Rastreio ${code}.`,
      set: {
        tracking: {
          code,
          carrier: "correios",
          dispatchedAt: now,
          deliveryStatus: "aguardando_postagem",
          events: [],
          // Objeto recém-postado: a primeira consulta só depois do intervalo mínimo.
          nextCheckAt: new Date(now.getTime() + 60 * 60 * 1000),
          simulated: false,
        },
      },
    });

    res.json(updated);
  } catch (err) {
    handleAdminError(res, err, "Não foi possível registrar o despacho.");
  }
}

// Corrige o código de rastreio de um pedido já enviado (fica no histórico).
export async function setOrderTracking(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }
    const code = normalizeTrackingCode(req.body?.trackingCode);
    if (!isValidTrackingCode(code)) {
      return res.status(400).json({
        error: "Código de rastreio inválido. Use o formato dos Correios (ex.: AA123456789BR).",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });
    if (order.status !== "enviado" || !order.tracking?.code) {
      return res.status(400).json({ error: "Só é possível corrigir o rastreio de um pedido enviado." });
    }
    if (order.tracking.code === code) return res.json(order);

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: "enviado" },
      {
        $set: {
          "tracking.code": code,
          "tracking.deliveryStatus": "aguardando_postagem",
          "tracking.events": [],
          "tracking.lastEventAt": null,
          "tracking.lastCheckedAt": null,
          "tracking.nextCheckAt": new Date(Date.now() + 60 * 60 * 1000),
          "tracking.lastError": null,
        },
        $push: {
          statusHistory: historyEntry({
            status: order.status,
            paymentStatus: order.paymentStatus,
            source: "admin",
            actor: req.user,
            note: `Código de rastreio alterado de ${order.tracking.code} para ${code}.`,
          }),
        },
      },
      { new: true }
    );
    if (!updated) {
      return res.status(409).json({ error: "O pedido foi alterado. Atualize e tente novamente." });
    }
    res.json(updated);
  } catch (err) {
    handleAdminError(res, err, "Não foi possível atualizar o rastreio.");
  }
}

// Botão "Atualizar rastreio" do admin (com intervalo mínimo entre consultas).
export async function refreshOrderTracking(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

    if (!order.tracking?.code) {
      return res.status(400).json({ error: "Este pedido ainda não tem código de rastreio." });
    }
    if (order.tracking.simulated) {
      return res.status(400).json({ error: "Rastreio de dados fictícios não consulta os Correios." });
    }

    const result = await refreshTracking(order, { force: true });
    if (result.retryAfterSeconds) {
      const minutes = Math.ceil(result.retryAfterSeconds / 60);
      return res.status(429).json({
        error: `Rastreio consultado há pouco. Tente novamente em ${minutes} min.`,
      });
    }
    res.json(result.order);
  } catch (err) {
    handleAdminError(res, err, "Não foi possível atualizar o rastreio.");
  }
}


// ======================================================
// ATUALIZAR
// ======================================================

// Pedido do site ainda sem pagamento aprovado: o admin só pode cancelá-lo.
// Evita produzir/enviar uma peça que ninguém pagou.
function assertPaidToAdvance(order, to) {
  const paid = ["approved", "authorized"].includes(order.paymentStatus);
  if (order.user && !paid && to !== "cancelado" && to !== order.status) {
    throw new StatusTransitionError(
      "O pagamento deste pedido ainda não foi aprovado. Use \"Verificar pagamento\" ou aguarde a confirmação."
    );
  }
}

export async function updateOrder(req, res) {
  try {
    const current = await Order.findById(req.params.id);
    if (!current) {
      return res.status(404).json({
        error: "Pedido não encontrado.",
      });
    }

    const { customerName, customerPhone, customerEmail, shippingCep, shippingCost, paymentMethod, notes, status } =
      req.body;

    // A mudança de status passa pelo serviço (valida a transição e grava o
    // histórico). Se for inválida, nada é salvo.
    if (status && status !== current.status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Status de pedido inválido." });
      }
      assertPaidToAdvance(current, status);
      await changeStatus(current, status, { source: "admin", actor: req.user });
    }

    let changes;
    if (current.user) {
      // Pedido do site: itens, frete e total já foram cobrados no Mercado Pago
      // e não podem mudar; só contato e observações.
      changes = { customerPhone, notes };
    } else {
      const validatedItems = await buildValidatedItems(req.body.items);
      const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shipping = Number(shippingCost) || 0;
      changes = {
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
      };
    }

    const order = await Order.findByIdAndUpdate(req.params.id, changes, {
      new: true,
      runValidators: true,
    });

    res.json(order);
  } catch (err) {
    if (err instanceof StatusTransitionError) {
      return res.status(400).json({ error: err.message });
    }
    res.status(400).json({
      error: err.message,
    });
  }
}


// ======================================================
// ATUALIZAR STATUS DO PEDIDO
// ======================================================

const VALID_STATUSES = Order.schema.path("status").enumValues;

export async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body || {};

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Status de pedido inválido." });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }

    const current = await Order.findById(req.params.id);
    if (!current) {
      return res.status(404).json({
        error: "Pedido não encontrado.",
      });
    }

    assertPaidToAdvance(current, status);

    // Valida a transição, grava o histórico e (ao cancelar) devolve o
    // estoque reservado uma única vez.
    const { order } = await changeStatus(current, status, {
      source: "admin",
      actor: req.user,
      note: String(req.body?.note || "").trim(),
    });

    res.json(order);
  } catch (err) {
    handleAdminError(res, err, "Não foi possível atualizar o status.");
  }
}


// ======================================================
// DELETAR
// ======================================================

export async function deleteOrder(req, res) {
  try {
    const order =
      await Order.findByIdAndDelete(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        error: "Pedido não encontrado.",
      });
    }

    // Pedido excluído sem ter sido pago não deve manter peças reservadas.
    if (order.stockReserved && !order.stockReleased && order.paymentStatus !== "approved") {
      await restoreStock(order.items.filter((i) => i.product));
    }

    res.json({
      ok: true,
    });
  } catch (err) {
    console.error("Erro ao excluir pedido:", err);
    res.status(500).json({ error: "Não foi possível excluir o pedido." });
  }
}
