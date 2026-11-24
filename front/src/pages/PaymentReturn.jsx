import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { orderApi } from "../api/orderApi";
import { useCart } from "../contexts/CartContext";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 10;

// Estado exibido a partir do que o BACKEND registrou (o webhook é a fonte de
// verdade); o parâmetro da URL só indica por qual retorno o cliente chegou.
function describe(order, variant) {
  const payment = order?.paymentStatus;

  if (payment === "approved") {
    return {
      icon: CheckCircle2,
      tone: "text-green-800",
      title: "Pagamento aprovado!",
      text: "Recebemos seu pagamento. Sua peça entra em produção e você acompanha o andamento em Meus pedidos.",
    };
  }
  if (["pending", "in_process", "authorized", "in_mediation"].includes(payment)) {
    // "pending" também é o estado de quem chegou pelo retorno de sucesso
    // antes de o webhook chegar; nesse caso seguimos aguardando.
    return {
      icon: Clock,
      tone: "text-ink",
      title: variant === "sucesso" ? "Confirmando seu pagamento..." : "Pagamento pendente",
      text:
        variant === "sucesso"
          ? "Estamos aguardando a confirmação do Mercado Pago. Isso costuma levar alguns segundos."
          : "Assim que o pagamento for confirmado, atualizaremos o seu pedido. Pix e boleto podem levar mais tempo.",
    };
  }
  return {
    icon: XCircle,
    tone: "text-red-800",
    title: "Pagamento não concluído",
    text: "O pagamento não foi aprovado. Seu pedido segue reservado por um tempo limitado: você pode tentar novamente.",
  };
}

export default function PaymentReturn({ variant }) {
  const [params] = useSearchParams();
  const orderId = params.get("external_reference");
  const { clearCart } = useCart();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(orderId));
  const clearedRef = useRef(false);

  useEffect(() => {
    if (!orderId) return undefined;

    let cancelled = false;
    let timer = null;
    let attempts = 0;

    async function load() {
      try {
        // Confirma com o Mercado Pago sem esperar o webhook (que não chega em
        // desenvolvimento local). Falha de sync não impede de mostrar o pedido.
        const data = await orderApi.syncPayment(orderId).catch(() => orderApi.getMine(orderId));
        if (cancelled) return;
        setOrder(data);
        setError("");
        setLoading(false);

        // Retornando pelo "sucesso", espera o webhook confirmar o pagamento.
        const waiting = variant === "sucesso" && data.paymentStatus === "pending";
        if (waiting && ++attempts < POLL_MAX_ATTEMPTS) {
          timer = setTimeout(load, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, variant]);

  // O carrinho só é esvaziado depois que o pagamento foi aprovado.
  useEffect(() => {
    if (order?.paymentStatus === "approved" && !clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
  }, [order, clearCart]);

  const view = order ? describe(order, variant) : null;
  const Icon = view?.icon;
  const canRetry = order && order.status === "pendente" && order.checkoutUrl && view?.icon === XCircle;

  return (
    <div className="min-h-[70vh] bg-paper px-5 py-14 md:py-20">
      <div className="max-w-lg mx-auto bg-white border border-line p-8 text-center">
        {loading && <Loader2 size={28} className="animate-spin text-ink mx-auto" />}

        {!loading && !orderId && (
          <>
            <h1 className="heading !text-3xl md:!text-4xl mb-2">Pedido não identificado</h1>
            <p className="text-stone text-sm">
              Não encontramos o pedido desta página. Consulte seus pedidos em Meus pedidos.
            </p>
          </>
        )}

        {!loading && error && (
          <p className="field-error">
            {error}
          </p>
        )}

        {view && (
          <>
            <Icon size={44} className={`${view.tone} mx-auto mb-4`} />
            <h1 className="heading !text-3xl md:!text-4xl mb-2">{view.title}</h1>
            <p className="text-stone text-sm mb-6">{view.text}</p>

            <div className="text-left text-sm text-ink/80 border-t border-line pt-4 space-y-1">
              <div className="flex justify-between">
                <span>Pedido</span>
                <span className="text-stone">#{String(order._id).slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total</span>
                <span className="text-ink">{formatCurrency(order.total)}</span>
              </div>
              {order.shipping?.serviceName && (
                <div className="flex justify-between">
                  <span>Envio</span>
                  <span>{order.shipping.serviceName}</span>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {canRetry && (
            <a
              href={order.checkoutUrl}
              className="btn"
            >
              Tentar pagar novamente
            </a>
          )}
          <Link
            to={order ? `/pedidos/${order._id}` : "/pedidos"}
            className="btn-ghost"
          >
            Acompanhar pedido
          </Link>
          <Link to="/joias" className="text-stone hover:text-ink/80 text-xs transition-colors">
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
