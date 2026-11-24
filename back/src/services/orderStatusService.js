import Order from "../models/Order.js";
import { releaseOrderStock } from "./orderStockService.js";

// Único ponto que muda o `status` interno do pedido (produção/despacho).
// Garante transições válidas e grava o histórico (`statusHistory`), que nunca
// é apagado. O status do PAGAMENTO (`paymentStatus`, Mercado Pago) e a
// situação da ENTREGA (`tracking.deliveryStatus`, Correios) são independentes.

export const STATUS_FLOW = [
  "pendente",
  "confirmado",
  "em produção",
  "pronto para envio",
  "enviado",
  "entregue",
];

// Etapas em que ainda dá para cancelar (antes do despacho).
const CANCELABLE = ["pendente", "confirmado", "em produção", "pronto para envio"];

// Código de rastreio dos Correios: 2 letras + 9 dígitos + 2 letras (ex.: AA123456789BR).
export const TRACKING_CODE_REGEX = /^[A-Z]{2}\d{9}[A-Z]{2}$/;

export class StatusTransitionError extends Error {}

export function normalizeTrackingCode(value) {
  return String(value || "").replace(/\s+/g, "").toUpperCase();
}

export function isValidTrackingCode(value) {
  return TRACKING_CODE_REGEX.test(normalizeTrackingCode(value));
}

export function historyEntry({ status, paymentStatus, source = "sistema", actor, note = "" }) {
  return {
    status,
    paymentStatus,
    at: new Date(),
    source,
    actorUid: actor?.uid,
    actorEmail: actor?.email,
    note: String(note || "").slice(0, 300),
  };
}

function assertTransition(order, to, { source, hasTrackingCode }) {
  const from = order.status;

  if (to === "cancelado") {
    if (!CANCELABLE.includes(from)) {
      throw new StatusTransitionError(
        `Um pedido "${from}" não pode ser cancelado.`
      );
    }
    return;
  }

  // Pagamento aprovado depois da expiração reabre o pedido cancelado.
  if (from === "cancelado") {
    if (source === "pagamento" && to === "confirmado") return;
    throw new StatusTransitionError("Um pedido cancelado não pode mudar de etapa.");
  }

  const fromIdx = STATUS_FLOW.indexOf(from);
  const toIdx = STATUS_FLOW.indexOf(to);
  if (toIdx === -1) throw new StatusTransitionError("Status de pedido inválido.");
  if (toIdx <= fromIdx) {
    throw new StatusTransitionError(
      `Não é possível voltar de "${from}" para "${to}".`
    );
  }

  if (to === "enviado" && !hasTrackingCode) {
    throw new StatusTransitionError(
      "Informe um código de rastreio válido dos Correios para registrar o despacho."
    );
  }
  if (to === "entregue" && from !== "enviado") {
    throw new StatusTransitionError("Só um pedido enviado pode ser marcado como entregue.");
  }
}

/**
 * Muda o status do pedido de forma atômica e registra no histórico.
 *
 * @param {object} order documento atual do pedido
 * @param {string} to novo status
 * @param {object} opts
 * @param {"admin"|"pagamento"|"sistema"|"correios"} opts.source origem da mudança
 * @param {{uid?: string, email?: string}} [opts.actor] quem fez (admin)
 * @param {string} [opts.note] observação
 * @param {object} [opts.set] campos extras gravados junto (ex.: tracking)
 * @returns {Promise<{ order: object, changed: boolean }>}
 */
export async function changeStatus(order, to, { source = "sistema", actor, note, set = {} } = {}) {
  if (order.status === to) return { order, changed: false };

  const code = set.tracking?.code || order.tracking?.code;
  assertTransition(order, to, { source, hasTrackingCode: isValidTrackingCode(code) });

  const updated = await Order.findOneAndUpdate(
    // Condiciona ao status lido: se outro processo mudou o pedido no meio
    // tempo, não sobrescreve.
    { _id: order._id, status: order.status },
    {
      $set: { ...set, status: to },
      $push: {
        statusHistory: historyEntry({
          status: to,
          paymentStatus: order.paymentStatus,
          source,
          actor,
          note,
        }),
      },
    },
    { new: true }
  );

  if (!updated) {
    throw new StatusTransitionError(
      "O pedido foi alterado por outro processo. Atualize a página e tente novamente."
    );
  }

  if (to === "cancelado") {
    await releaseOrderStock(updated._id);
  }

  return { order: updated, changed: true };
}
