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
    <div className="min-h-screen bg-forest-950 px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/pedidos"
          className="inline-flex items-center gap-1 text-cream/50 hover:text-cream text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Meus pedidos
        </Link>

        {loading && <Loader2 size={24} className="animate-spin text-gold-400 mx-auto mt-10" />}

        {error && (
          <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded px-3 py-2">
            {error}
          </p>
        )}

        {order && (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-2xl text-cream">Pedido #{shortOrderId(order._id)}</h1>
              <p className="text-cream/40 text-sm">Feito em {formatDateTime(order.createdAt)}</p>
              <p className="text-gold-300 text-xs uppercase tracking-wide mt-1">
                {customerOrderLabel(order)}
              </p>
            </div>

            <section className="bg-forest-900 border border-gold-500/20 rounded-lg p-6">
              <h2 className="font-display text-lg text-cream mb-4">Acompanhamento</h2>
              <OrderTimeline order={order} />
            </section>

            <section className="bg-forest-900 border border-gold-500/20 rounded-lg p-6">
              <h2 className="font-display text-lg text-cream mb-3">Peças</h2>
              <ul className="divide-y divide-gold-500/10 text-sm">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between py-2">
                    <span className="text-cream/80">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-cream/60">{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-gold-500/10 space-y-1 text-sm">
                <p className="flex justify-between text-cream/60">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </p>
                <p className="flex justify-between text-cream/60">
                  <span>Frete{order.shipping?.serviceName ? ` (${order.shipping.serviceName})` : ""}</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </p>
                <p className="flex justify-between text-cream font-medium">
                  <span>Total</span>
                  <span className="text-gold-300">{formatCurrency(order.total)}</span>
                </p>
              </div>
            </section>

            <section className="bg-forest-900 border border-gold-500/20 rounded-lg p-6 text-sm space-y-1">
              <h2 className="font-display text-lg text-cream mb-2">Pagamento</h2>
              <p className="text-cream/70">
                Situação:{" "}
                <span className="text-cream">{PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}</span>
              </p>
              <p className="text-cream/70">Forma: {order.paymentMethod}</p>
              {order.paidAt && <p className="text-cream/70">Pago em {formatDateTime(order.paidAt)}</p>}
              {order.status === "pendente" && order.checkoutUrl && (
                <a
                  href={order.checkoutUrl}
                  className="inline-block mt-3 bg-gold-500 hover:bg-gold-400 text-forest-950 font-medium px-6 py-2 rounded-full transition-colors"
                >
                  Concluir pagamento
                </a>
              )}
              {order.status === "pendente" && (
                <button
                  onClick={checkPayment}
                  disabled={checking}
                  className="block mt-3 text-gold-300 hover:text-gold-400 disabled:opacity-60 text-xs underline"
                >
                  {checking ? "Verificando..." : "Já paguei: verificar pagamento"}
                </button>
              )}
              {order.status === "pendente" && order.expiresAt && (
                <p className="text-cream/40 text-xs mt-2">
                  Reservado até {formatDateTime(order.expiresAt)}. Depois disso o pedido é cancelado.
                </p>
              )}
            </section>

            {order.shipping?.estimatedDeliveryDate && order.status !== "cancelado" && (
              <p className="text-cream/40 text-xs text-center">
                Previsão de entrega: {order.shipping.estimatedDeliveryDate}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
