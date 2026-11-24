import React from "react";
import { Check, Circle, Ban, Truck, ExternalLink } from "lucide-react";
import {
  STATUS_FLOW,
  STEP_LABELS,
  DELIVERY_LABELS,
  formatDateTime,
  trackingUrl,
} from "../helpers/orderStatus";

// Linha do tempo do pedido: etapas internas (produção e despacho) definidas
// pela loja e, depois do despacho, os eventos de entrega dos Correios.
export default function OrderTimeline({ order }) {
  const history = order.statusHistory || [];
  const cancelled = order.status === "cancelado";
  const currentIdx = STATUS_FLOW.indexOf(order.status);

  // Primeira vez em que cada etapa foi atingida.
  const reachedAt = {};
  for (const h of history) {
    if (!reachedAt[h.status]) reachedAt[h.status] = h.at;
  }
  // Pedidos antigos sem histórico: ao menos a criação.
  if (!reachedAt.pendente) reachedAt.pendente = order.createdAt;

  const tracking = order.tracking;

  return (
    <div>
      {cancelled && (
        <p className="flex items-center gap-2 field-error mb-4">
          <Ban size={15} /> Este pedido foi cancelado
          {reachedAt.cancelado && <> em {formatDateTime(reachedAt.cancelado)}</>}.
        </p>
      )}

      <ol className="space-y-0">
        {STATUS_FLOW.map((step, idx) => {
          const done = Boolean(reachedAt[step]) || (!cancelled && idx < currentIdx);
          const current = !cancelled && idx === currentIdx;
          const isLast = idx === STATUS_FLOW.length - 1;

          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    done
                      ? "bg-accent border-accent text-paper"
                      : current
                      ? "border-ink text-ink"
                      : "border-line text-stone/70"
                  }`}
                >
                  {done ? <Check size={13} /> : <Circle size={7} />}
                </span>
                {!isLast && (
                  <span className={`w-px flex-1 min-h-[22px] ${done ? "bg-accent/60" : "bg-line"}`} />
                )}
              </div>
              <div className="pb-4">
                <p className={`text-sm ${done || current ? "text-ink" : "text-stone/70"}`}>
                  {STEP_LABELS[step]}
                  {current && !done && <span className="text-ink text-xs ml-2">(atual)</span>}
                </p>
                {reachedAt[step] && (
                  <p className="text-stone/70 text-xs">{formatDateTime(reachedAt[step])}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {tracking?.code && (
        <div className="mt-2 border-t border-line pt-4">
          <p className="flex items-center gap-2 text-ink text-sm">
            <Truck size={15} className="text-ink" />
            Entrega pelos Correios ·{" "}
            <span className="text-ink">
              {DELIVERY_LABELS[tracking.deliveryStatus] || tracking.deliveryStatus}
            </span>
          </p>
          <p className="text-stone text-xs mt-1">
            Código de rastreio:{" "}
            <span className="text-ink/80 font-mono">{tracking.code}</span>{" "}
            <a
              href={trackingUrl(tracking.code)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-ink hover:text-stone underline"
            >
              Abrir nos Correios <ExternalLink size={11} />
            </a>
          </p>

          {tracking.events?.length > 0 ? (
            <ul className="mt-3 space-y-3 border-l border-line pl-4 ml-1">
              {tracking.events.map((ev, idx) => (
                <li key={idx} className="relative">
                  <span
                    className={`absolute -left-[21px] top-1 w-2 h-2 rounded-full ${
                      idx === 0 ? "bg-accent" : "bg-stone/40"
                    }`}
                  />
                  <p className={`text-sm ${idx === 0 ? "text-ink" : "text-ink/80"}`}>
                    {ev.description}
                  </p>
                  <p className="text-stone/70 text-xs">
                    {formatDateTime(ev.at)}
                    {ev.location && <> · {ev.location}</>}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-stone/70 text-xs mt-3">
              Ainda sem movimentação. Os eventos aparecem aqui depois que os Correios receberem o objeto.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
