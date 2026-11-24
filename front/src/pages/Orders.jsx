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
    <div className="min-h-[70vh] bg-paper px-5 py-14 md:py-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="heading !text-3xl md:!text-4xl mb-1">Meus pedidos</h1>
        <p className="text-stone text-sm mb-6">
          Acompanhe a produção e a entrega das suas peças.
        </p>

        {loading && <Loader2 size={24} className="animate-spin text-ink mx-auto mt-10" />}

        {error && (
          <p className="field-error">
            {error}
          </p>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="bg-white border border-line py-14 text-center">
            <PackageOpen size={28} className="mx-auto text-stone/40 mb-2" />
            <p className="text-stone text-sm mb-4">Você ainda não fez nenhum pedido.</p>
            <Link
              to="/joias"
              className="btn"
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
              className="block bg-white border border-line hover:border-ink p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-ink text-sm">Pedido #{shortOrderId(order._id)}</p>
                  <p className="text-stone/70 text-xs">{formatDate(order.createdAt)}</p>
                </div>
                <span className="text-ink text-xs uppercase tracking-wide text-right">
                  {customerOrderLabel(order)}
                </span>
              </div>

              <ul className="text-stone text-xs mt-2 space-y-0.5">
                {order.items.map((item, idx) => (
                  <li key={idx} className="truncate">
                    {item.quantity}x {item.name}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-line text-sm">
                <span className="text-stone text-xs">
                  Pagamento: {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
                </span>
                <span className="flex items-center gap-1 text-ink">
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
