import mongoose from "mongoose";

import Order from "../models/Order.js";
import { mercadoPagoService } from "./mercadoPagoService.js";
import { releaseOrderStock, reReserveOrderStock } from "./orderStockService.js";
import { historyEntry } from "./orderStatusService.js";

// Aplica o estado de um pagamento do Mercado Pago a um pedido. É o único
// ponto que muda o pedido por causa de pagamento, usado tanto pelo webhook
// quanto pela sincronização sob demanda (cliente voltando do checkout ou
// admin), de modo que as duas rotas têm exatamente as mesmas regras e são
// idempotentes entre si.

export const PAYMENT_STATUSES = Order.schema.path("paymentStatus").enumValues;

// Statuses em que o pedido já está em andamento/entregue: um estorno ou
// cancelamento tardio só é registrado, e quem decide é o admin.
const IN_FLIGHT_STATUSES = ["em produção", "enviado", "entregue"];

// Decide as mudanças no pedido para um pagamento, a partir do estado lido.
function planUpdate(order, payment) {
  const status = payment.status;
  const set = { paymentStatus: status, paymentId: String(payment.id) };
  let releaseStock = false;
  let reserveAgain = false;
  let note = null;

  if (status === "approved") {
    if (order.status === "pendente" || order.status === "cancelado") {
      set.status = "confirmado";
      if (order.status === "cancelado") reserveAgain = true;
    }
    if (!order.paidAt) set.paidAt = new Date();
  } else if (status === "cancelled") {
    if (order.status === "pendente") {
      set.status = "cancelado";
      releaseStock = true;
    }
  } else if (status === "refunded" || status === "charged_back") {
    if (order.status === "pendente" || order.status === "confirmado") {
      set.status = "cancelado";
      releaseStock = true;
    } else if (IN_FLIGHT_STATUSES.includes(order.status)) {
      note = `Pagamento ${status} com o pedido já "${order.status}": verifique manualmente.`;
    }
  }
  // pending, in_process, authorized, in_mediation e rejected só atualizam o
  // paymentStatus: com rejected o cliente ainda pode tentar outro meio de
  // pagamento na mesma preferência, então o pedido segue aberto até expirar.

  return { set, releaseStock, reserveAgain, note };
}

/**
 * @param {object} payment pagamento já consultado na API do Mercado Pago
 * @returns {Promise<"applied"|"ignored"|"retry">} "retry" = não conseguiu
 *   aplicar por concorrência; quem chamou decide se tenta de novo.
 */
export async function applyPaymentToOrder(payment) {
  const reference = String(payment.external_reference || "");
  if (!mongoose.isValidObjectId(reference)) return "ignored";

  if (!PAYMENT_STATUSES.includes(payment.status)) {
    console.warn("Status de pagamento desconhecido:", payment.status);
    return "ignored";
  }

  const eventKey = `${payment.id}:${payment.status}`;

  // Trava otimista: se outro processamento mexer no pedido ao mesmo tempo,
  // relê e tenta de novo.
  for (let attempt = 0; attempt < 3; attempt++) {
    const order = await Order.findById(reference).select("+processedPaymentEvents");

    if (!order) {
      console.warn("Pedido não encontrado para o pagamento:", payment.id);
      return "ignored";
    }

    if (order.processedPaymentEvents.includes(eventKey)) {
      return "ignored"; // evento repetido
    }

    // O valor pago precisa bater com o total do pedido.
    const paid = Number(payment.transaction_amount);
    const currencyOk = !payment.currency_id || payment.currency_id === "BRL";
    if (!Number.isFinite(paid) || Math.abs(paid - order.total) > 0.01 || !currencyOk) {
      console.error(
        `Pagamento ${payment.id} com valor divergente do pedido ${order._id}: ` +
          `pago ${payment.transaction_amount} ${payment.currency_id}, esperado ${order.total}.`
      );
      return "ignored";
    }

    // Segundo pagamento aprovado para um pedido que já está pago.
    if (
      order.paymentStatus === "approved" &&
      order.paymentId &&
      order.paymentId !== String(payment.id)
    ) {
      console.error(
        `Pagamento duplicado ${payment.id} para o pedido ${order._id} ` +
          `(já pago por ${order.paymentId}). Estorno manual necessário.`
      );
      return "ignored";
    }

    const { set, releaseStock, reserveAgain, note } = planUpdate(order, payment);

    if (note) {
      set.notes = [order.notes, `[Mercado Pago] ${note}`].filter(Boolean).join("\n");
    }

    const update = { $set: set, $addToSet: { processedPaymentEvents: eventKey } };

    // Registra no histórico quando o pagamento ou o status do pedido mudam.
    const nextStatus = set.status || order.status;
    if (nextStatus !== order.status || payment.status !== order.paymentStatus) {
      update.$push = {
        statusHistory: historyEntry({
          status: nextStatus,
          paymentStatus: payment.status,
          source: "pagamento",
          note: `Pagamento ${payment.status} (Mercado Pago).`,
        }),
      };
    }

    const result = await Order.updateOne(
      { _id: order._id, status: order.status, paymentStatus: order.paymentStatus },
      update
    );

    if (result.modifiedCount !== 1) continue; // perdeu a corrida: relê

    if (releaseStock) {
      await releaseOrderStock(order._id);
    }

    if (reserveAgain) {
      // Pago depois de expirar: tenta reservar de novo as peças.
      const ok = await reReserveOrderStock(order);
      if (!ok) {
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              notes: [
                order.notes,
                "[Mercado Pago] Pagamento aprovado após a expiração e sem estoque suficiente: resolver com o cliente.",
              ]
                .filter(Boolean)
                .join("\n"),
            },
          }
        );
      }
    }

    return "applied";
  }

  return "retry";
}

// Prioridade ao escolher qual pagamento representa o pedido.
const PAYMENT_PRIORITY = {
  approved: 6,
  authorized: 5,
  in_process: 4,
  pending: 3,
  in_mediation: 3,
  refunded: 2,
  charged_back: 2,
  rejected: 1,
  cancelled: 1,
};

function paymentTime(p) {
  return new Date(p.date_last_updated || p.date_created || 0).getTime();
}

// Consulta os pagamentos do pedido no Mercado Pago e aplica o mais relevante
// (aprovado > em análise > pendente > o resto; empate: o mais recente).
// Não depende do webhook: serve para o retorno do checkout e para o admin.
export async function syncOrderPayment(order) {
  const payments = await mercadoPagoService.searchPaymentsByReference(order._id);
  if (!payments.length) return { found: false, result: "ignored" };

  const best = [...payments].sort(
    (a, b) =>
      (PAYMENT_PRIORITY[b.status] || 0) - (PAYMENT_PRIORITY[a.status] || 0) ||
      paymentTime(b) - paymentTime(a)
  )[0];

  // O resultado da busca pode vir resumido: relê o pagamento completo, como
  // o webhook faz (a API é a fonte de verdade).
  const payment = await mercadoPagoService.getPayment(String(best.id));
  const result = await applyPaymentToOrder(payment);
  return { found: true, result };
}
