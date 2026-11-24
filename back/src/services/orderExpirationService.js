import Order from "../models/Order.js";
import { mercadoPagoService } from "./mercadoPagoService.js";
import { releaseOrderStock } from "./orderStockService.js";
import { historyEntry } from "./orderStatusService.js";

const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

// Prazo de expiração de um pedido não pago (padrão: 24h = 1 dia).
export function getOrderExpirationMs() {
  const hours = Number(process.env.ORDER_EXPIRATION_HOURS);
  return (Number.isFinite(hours) && hours > 0 ? hours : 24) * 60 * 60 * 1000;
}

let sweeping = false;

// Cancela pedidos pendentes vencidos e devolve o estoque reservado.
// Antes de cancelar, confere no Mercado Pago se não existe pagamento
// aprovado cujo webhook ainda não chegou (nesse caso o pedido é mantido).
export async function expireOverdueOrders() {
  if (sweeping) return 0;
  sweeping = true;

  try {
    const overdue = await Order.find({
      status: "pendente",
      expiresAt: { $lt: new Date() },
      paymentStatus: { $nin: ["approved", "authorized"] },
    }).limit(100);

    let expired = 0;

    for (const order of overdue) {
      try {
        const payments = await mercadoPagoService.searchPaymentsByReference(order._id);
        if (payments.some((p) => p.status === "approved")) {
          // Pago, mas o webhook ainda não aplicou: deixa o webhook concluir.
          continue;
        }
      } catch (err) {
        // Sem conseguir consultar o Mercado Pago, não cancela agora: tenta
        // de novo na próxima varredura em vez de arriscar cancelar um pago.
        console.error(`Expiração: falha ao consultar pagamentos do pedido ${order._id}:`, err);
        continue;
      }

      const result = await Order.updateOne(
        {
          _id: order._id,
          status: "pendente",
          paymentStatus: { $nin: ["approved", "authorized"] },
        },
        {
          $set: { status: "cancelado" },
          $push: {
            statusHistory: historyEntry({
              status: "cancelado",
              paymentStatus: order.paymentStatus,
              source: "sistema",
              note: "Pedido expirado sem pagamento.",
            }),
          },
        }
      );

      if (result.modifiedCount === 1) {
        await releaseOrderStock(order._id);
        expired += 1;
      }
    }

    if (expired) console.log(`[expiração] ${expired} pedido(s) expirado(s).`);
    return expired;
  } finally {
    sweeping = false;
  }
}

export function startOrderExpirationJob() {
  const run = () =>
    expireOverdueOrders().catch((err) => console.error("Erro ao expirar pedidos:", err));

  run();
  setInterval(run, SWEEP_INTERVAL_MS).unref();
}
