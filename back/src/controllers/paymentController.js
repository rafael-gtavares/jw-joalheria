import crypto from "node:crypto";

import mongoose from "mongoose";

import Order from "../models/Order.js";
import { toCustomerOrder } from "./orderController.js";
import { mercadoPagoService } from "../services/mercadoPagoService.js";
import {
  applyPaymentToOrder,
  syncOrderPayment,
} from "../services/paymentSyncService.js";

// Janela generosa: o Mercado Pago reenvia notificações por horas com a
// mesma assinatura. Replay não é risco real, pois o estado do pagamento é
// sempre consultado na API do Mercado Pago e o processamento é idempotente.
const SIGNATURE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function parseSignature(header) {
  const parts = {};
  for (const part of String(header || "").split(",")) {
    const [key, value] = part.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  }
  return parts;
}

// Valida o header x-signature (HMAC-SHA256 do manifesto
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;").
function isValidSignature(req, dataId) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const xRequestId = req.headers["x-request-id"];
  const { ts, v1 } = parseSignature(req.headers["x-signature"]);

  if (!secret || !xRequestId || !ts || !v1) return false;

  const tsMs = Number(ts) < 1e12 ? Number(ts) * 1000 : Number(ts);
  if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > SIGNATURE_MAX_AGE_MS) {
    return false;
  }

  // O Mercado Pago assina com o data.id em minúsculas quando alfanumérico.
  const manifest = `id:${String(dataId).toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function paymentWebhook(req, res) {
  try {
    // data.id vem na query (formato oficial); o corpo é fallback.
    const type = req.query.type || req.query.topic || req.body?.type;
    const rawId = req.query["data.id"] || req.body?.data?.id || req.query.id;

    // Ignora eventos que não sejam de pagamento.
    if (type !== "payment" || !rawId) {
      return res.sendStatus(200);
    }

    const paymentId = String(rawId);
    if (!/^\d{1,20}$/.test(paymentId)) {
      return res.sendStatus(200);
    }

    // --------------------------------------------------
    // Assinatura (obrigatória; em desenvolvimento sem segredo, só avisa)
    // --------------------------------------------------
    if (process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
      if (!isValidSignature(req, paymentId)) {
        console.warn("Webhook Mercado Pago com assinatura inválida.");
        return res.sendStatus(401);
      }
    } else {
      console.warn("MERCADO_PAGO_WEBHOOK_SECRET ausente: assinatura do webhook NÃO validada.");
    }

    // --------------------------------------------------
    // Consulta o pagamento direto na API (fonte de verdade)
    // --------------------------------------------------
    let payment;
    try {
      payment = await mercadoPagoService.getPayment(paymentId);
    } catch (err) {
      // Pagamento inexistente (ex.: notificação de teste): não adianta reenviar.
      if (err?.status === 404) return res.sendStatus(200);
      throw err;
    }

    const outcome = await applyPaymentToOrder(payment);

    // Não conseguiu aplicar por concorrência: o Mercado Pago reenviará.
    return res.sendStatus(outcome === "retry" ? 500 : 200);
  } catch (error) {
    console.error("Erro no webhook do Mercado Pago:", error);
    // Erro transitório (banco, API): 500 faz o Mercado Pago tentar de novo.
    return res.sendStatus(500);
  }
}

// Sincroniza o pedido com o Mercado Pago sem depender do webhook (que não
// chega em desenvolvimento local e pode atrasar em produção). O cliente só
// sincroniza o próprio pedido; o admin, qualquer um.
export async function syncPayment(req, res) {
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }

    const admin = req.user?.role === "admin";
    const order = await Order.findOne(admin ? { _id: orderId } : { _id: orderId, user: req.user.uid });
    if (!order) return res.status(404).json({ error: "Pedido não encontrado." });

    // Pedidos manuais não têm pagamento no Mercado Pago.
    if (order.user) {
      await syncOrderPayment(order);
    }

    const fresh = await Order.findById(order._id);
    return res.json(admin ? fresh : toCustomerOrder(fresh));
  } catch (err) {
    console.error("Erro ao sincronizar pagamento:", err);
    return res.status(502).json({
      error: "Não foi possível consultar o Mercado Pago agora. Tente novamente em instantes.",
    });
  }
}
