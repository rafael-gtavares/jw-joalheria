import Order from "../models/Order.js";
import { getTracking } from "./correiosService.js";
import { changeStatus } from "./orderStatusService.js";

// Evita consultas desnecessárias à API dos Correios:
// - só pedidos "enviado", com código, que não chegaram a um estado final;
// - intervalo mínimo entre consultas por pedido (TRACKING_MIN_INTERVAL_HOURS);
// - uma consulta por pedido por vez (visitas simultâneas compartilham);
// - dados simulados (seed de teste) nunca chamam os Correios;
// - ao falhar, recua a próxima tentativa em vez de insistir.

const FINAL_STATES = ["entregue", "devolvido"];
const ADMIN_REFRESH_COOLDOWN_MS = 10 * 60 * 1000;
const ERROR_BACKOFF_MS = 30 * 60 * 1000;

export function getMinIntervalMs() {
  const hours = Number(process.env.TRACKING_MIN_INTERVAL_HOURS);
  return (Number.isFinite(hours) && hours > 0 ? hours : 3) * 60 * 60 * 1000;
}

const inFlight = new Map();

function needsRefresh(order) {
  const t = order.tracking;
  if (!t?.code || t.simulated) return false;
  if (order.status !== "enviado") return false;
  if (FINAL_STATES.includes(t.deliveryStatus)) return false;
  return !t.nextCheckAt || t.nextCheckAt.getTime() <= Date.now();
}

async function doRefresh(order) {
  const now = new Date();
  try {
    const result = await getTracking(order.tracking.code);

    const set = {
      "tracking.deliveryStatus": result.deliveryStatus,
      "tracking.events": result.events,
      "tracking.lastEventAt": result.events[0]?.at,
      "tracking.lastCheckedAt": now,
      "tracking.nextCheckAt": new Date(now.getTime() + getMinIntervalMs()),
      "tracking.lastError": null,
    };

    let updated = await Order.findOneAndUpdate({ _id: order._id }, { $set: set }, { new: true });

    // Os Correios confirmaram a entrega: fecha o pedido (com histórico).
    if (result.deliveryStatus === "entregue" && updated.status === "enviado") {
      const out = await changeStatus(updated, "entregue", {
        source: "correios",
        note: result.events[0]?.description || "Entrega confirmada pelos Correios.",
      });
      updated = out.order;
    }
    return updated;
  } catch (err) {
    console.error(`Rastreio: falha ao consultar o pedido ${order._id}:`, err.message);
    return Order.findOneAndUpdate(
      { _id: order._id },
      {
        $set: {
          "tracking.lastCheckedAt": now,
          "tracking.nextCheckAt": new Date(now.getTime() + ERROR_BACKOFF_MS),
          "tracking.lastError": String(err.message || "Erro desconhecido").slice(0, 200),
        },
      },
      { new: true }
    );
  }
}

/**
 * Atualiza o rastreio do pedido se (e somente se) for necessário.
 * Nunca lança: em falha devolve o pedido com o último estado conhecido.
 *
 * @param {object} order documento do pedido
 * @param {{ force?: boolean }} [opts] force: ignora o intervalo mínimo
 *   (respeitando apenas o cooldown curto do botão do admin).
 * @returns {Promise<{ order: object, refreshed: boolean, retryAfterSeconds?: number }>}
 */
export async function refreshTracking(order, { force = false } = {}) {
  const t = order.tracking;
  if (!t?.code || t.simulated || order.status !== "enviado") {
    return { order, refreshed: false };
  }
  if (FINAL_STATES.includes(t.deliveryStatus)) return { order, refreshed: false };

  if (force) {
    const since = t.lastCheckedAt ? Date.now() - t.lastCheckedAt.getTime() : Infinity;
    if (since < ADMIN_REFRESH_COOLDOWN_MS) {
      return {
        order,
        refreshed: false,
        retryAfterSeconds: Math.ceil((ADMIN_REFRESH_COOLDOWN_MS - since) / 1000),
      };
    }
  } else if (!needsRefresh(order)) {
    return { order, refreshed: false };
  }

  const key = String(order._id);
  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      doRefresh(order).finally(() => inFlight.delete(key))
    );
  }
  const updated = await inFlight.get(key);
  return { order: updated || order, refreshed: true };
}

// Varredura periódica: atualiza em lote os pedidos enviados com consulta vencida.
const SWEEP_BATCH = 50;
let sweeping = false;

export async function sweepTracking() {
  if (sweeping) return 0;
  sweeping = true;
  try {
    const due = await Order.find({
      status: "enviado",
      "tracking.code": { $exists: true },
      "tracking.simulated": { $ne: true },
      "tracking.deliveryStatus": { $nin: FINAL_STATES },
      $or: [
        { "tracking.nextCheckAt": { $exists: false } },
        { "tracking.nextCheckAt": null },
        { "tracking.nextCheckAt": { $lte: new Date() } },
      ],
    })
      .sort({ "tracking.nextCheckAt": 1 })
      .limit(SWEEP_BATCH);

    let refreshed = 0;
    for (const order of due) {
      const result = await refreshTracking(order);
      if (result.refreshed) refreshed += 1;
    }
    return refreshed;
  } finally {
    sweeping = false;
  }
}

export function startTrackingJob() {
  const run = () =>
    sweepTracking().catch((err) => console.error("Erro na varredura de rastreio:", err));

  setInterval(run, getMinIntervalMs()).unref();
}
