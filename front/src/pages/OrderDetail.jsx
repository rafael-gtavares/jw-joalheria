import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { orderApi } from "../api/orderApi";
import OrderTimeline from "../components/OrderTimeline";
import {
  formatCurrency,
  formatDateTime,
  shortOrderId,
  customerOrderLabel,
  PAYMENT_LABELS,
} from "../helpers/orderStatus";

// Detalhe e acompanhamento de um pedido do cliente logado.
export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    orderApi
      .getMine(id)
      .then(async (data) => {
        if (cancelled) return;
        setOrder(data);
        setError("");
        // Pedido aguardando pagamento: confere no Mercado Pago sem esperar o webhook.
        if (data.status === "pendente" && data.paymentStatus === "pending") {
          const synced = await orderApi.syncPayment(id).catch(() => null);
          if (!cancelled && synced) setOrder(synced);
        }
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function checkPayment() {
    setChecking(true);
    try {
      setOrder(await orderApi.syncPayment(id));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-[70vh] bg-paper px-5 py-14 md:py-20">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/pedidos"
          className="inline-flex items-center gap-1 text-stone hover:text-ink text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Meus pedidos
        </Link>

        {loading && <Loader2 size={24} className="animate-spin text-ink mx-auto mt-10" />}

        {error && (
          <p className="field-error">
            {error}
          </p>
        )}

        {order && (
          <div className="space-y-5">
            <div>
              <h1 className="heading !text-3xl md:!text-4xl">Pedido #{shortOrderId(order._id)}</h1>
              <p className="text-stone/70 text-sm">Feito em {formatDateTime(order.createdAt)}</p>
              <p className="text-ink text-xs uppercase tracking-wide mt-1">
                {customerOrderLabel(order)}
              </p>
            </div>

            <section className="bg-white border border-line p-6">
              <h2 className="font-display text-lg text-ink mb-4">Acompanhamento</h2>
              <OrderTimeline order={order} />
            </section>

            <section className="bg-white border border-line p-6">
              <h2 className="font-display text-lg text-ink mb-3">Peças</h2>
              <ul className="divide-y divide-line text-sm">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between py-2">
                    <span className="text-ink/80">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-stone">{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-line space-y-1 text-sm">
                <p className="flex justify-between text-stone">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </p>
                <p className="flex justify-between text-stone">
                  <span>Frete{order.shipping?.serviceName ? ` (${order.shipping.serviceName})` : ""}</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </p>
                <p className="flex justify-between text-ink font-medium">
                  <span>Total</span>
                  <span className="text-ink">{formatCurrency(order.total)}</span>
                </p>
              </div>
            </section>

            <section className="bg-white border border-line p-6 text-sm space-y-1">
              <h2 className="font-display text-lg text-ink mb-2">Pagamento</h2>
              <p className="text-ink/80">
                Situação:{" "}
                <span className="text-ink">{PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}</span>
              </p>
              <p className="text-ink/80">Forma: {order.paymentMethod}</p>
              {order.paidAt && <p className="text-ink/80">Pago em {formatDateTime(order.paidAt)}</p>}
              {order.status === "pendente" && order.checkoutUrl && (
                <a
                  href={order.checkoutUrl}
                  className="btn mt-3"
                >
                  Concluir pagamento
                </a>
              )}
              {order.status === "pendente" && (
                <button
                  onClick={checkPayment}
                  disabled={checking}
                  className="block mt-3 text-ink hover:text-stone disabled:opacity-60 text-xs underline"
                >
                  {checking ? "Verificando..." : "Já paguei: verificar pagamento"}
                </button>
              )}
              {order.status === "pendente" && order.expiresAt && (
                <p className="text-stone/70 text-xs mt-2">
                  Reservado até {formatDateTime(order.expiresAt)}. Depois disso o pedido é cancelado.
                </p>
              )}
            </section>

            {order.shipping?.estimatedDeliveryDate && order.status !== "cancelado" && (
              <p className="text-stone/70 text-xs text-center">
                Previsão de entrega: {order.shipping.estimatedDeliveryDate}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
