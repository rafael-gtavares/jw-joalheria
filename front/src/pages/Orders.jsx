import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ChevronRight, PackageOpen } from "lucide-react";
import { orderApi } from "../api/orderApi";
import {
  formatCurrency,
  formatDate,
  shortOrderId,
  customerOrderLabel,
  PAYMENT_LABELS,
} from "../helpers/orderStatus";

// Histórico de pedidos do cliente logado.
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    orderApi
      .listMine()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-forest-950 px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-2xl text-cream mb-1">Meus pedidos</h1>
        <p className="text-cream/50 text-sm mb-6">
          Acompanhe a produção e a entrega das suas peças.
        </p>

        {loading && <Loader2 size={24} className="animate-spin text-gold-400 mx-auto mt-10" />}

        {error && (
          <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded px-3 py-2">
            {error}
          </p>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="bg-forest-900 border border-gold-500/20 rounded-lg py-14 text-center">
            <PackageOpen size={28} className="mx-auto text-gold-500/40 mb-2" />
            <p className="text-cream/50 text-sm mb-4">Você ainda não fez nenhum pedido.</p>
            <Link
              to="/joias"
              className="inline-block bg-gold-500 hover:bg-gold-400 text-forest-950 font-medium px-6 py-2 rounded-full transition-colors"
            >
              Ver peças
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/pedidos/${order._id}`}
              className="block bg-forest-900 border border-gold-500/20 hover:border-gold-400 rounded-lg p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-cream text-sm">Pedido #{shortOrderId(order._id)}</p>
                  <p className="text-cream/40 text-xs">{formatDate(order.createdAt)}</p>
                </div>
                <span className="text-gold-300 text-xs uppercase tracking-wide text-right">
                  {customerOrderLabel(order)}
                </span>
              </div>

              <ul className="text-cream/60 text-xs mt-2 space-y-0.5">
                {order.items.map((item, idx) => (
                  <li key={idx} className="truncate">
                    {item.quantity}x {item.name}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gold-500/10 text-sm">
                <span className="text-cream/50 text-xs">
                  Pagamento: {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
                </span>
                <span className="flex items-center gap-1 text-gold-300">
                  {formatCurrency(order.total)} <ChevronRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
