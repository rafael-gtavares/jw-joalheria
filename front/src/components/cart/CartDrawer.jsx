import React, { useEffect, useRef, useState } from "react";
import { X, Minus, Plus, Loader2, Truck, Info } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { shippingApi } from "../../api/shippingApi";
import { orderApi } from "../../api/orderApi";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Chave que identifica esta tentativa de checkout. O backend a usa para não
// criar pedidos duplicados se a requisição for repetida.
function newIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, subtotal, open, setOpen, clearCart, setAuthPromptOpen } =
    useCart();
  const { user } = useAuth();
  const [cep, setCep] = useState("");
  // Resposta da cotação: { cep, options: [{ serviceCode, serviceName, price, ... }] }
  const [quote, setQuote] = useState(null);
  const [selectedCode, setSelectedCode] = useState("");
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const idempotencyKeyRef = useRef(newIdempotencyKey());

  // Opção de frete escolhida pelo cliente (o valor é só informativo: o
  // backend recotá o frete na hora de criar o pedido).
  const shipping = quote?.options.find((o) => o.serviceCode === selectedCode) || null;
  const total = subtotal + (shipping?.price || 0);

  // O frete considera peso e valor de TODOS os itens do carrinho, calculados
  // pelo backend a partir do MongoDB. Se o carrinho mudar depois de um
  // cálculo já feito, o frete anterior não vale mais e precisa ser refeito.
  const itemsSignature = items.map((i) => `${i.productId}:${i.quantity}`).join("|");
  useEffect(() => {
    setQuote(null);
    setSelectedCode("");
    setShippingError("");
    setPaymentError("");
    idempotencyKeyRef.current = newIdempotencyKey();
  }, [itemsSignature]);

  function handleSelectOption(code) {
    setSelectedCode(code);
    setPaymentError("");
    idempotencyKeyRef.current = newIdempotencyKey();
  }

  async function handleCalculateShipping(e) {
    e.preventDefault();
    setShippingError("");
    setPaymentError("");
    setQuote(null);
    setSelectedCode("");
    if (!cep.trim()) return;
    setLoadingShipping(true);
    try {
      const result = await shippingApi.quote({
        cep,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      setQuote(result);
      // Seleciona a opção mais barata por padrão.
      const cheapest = [...result.options].sort((a, b) => a.price - b.price)[0];
      setSelectedCode(cheapest?.serviceCode || "");
    } catch (err) {
      setShippingError(err.message);
    } finally {
      setLoadingShipping(false);
    }
  }

  // Cria o pedido no backend (que recalcula preços e frete, reserva o
  // estoque e cria a preferência do Mercado Pago) e redireciona para o
  // checkout do Mercado Pago. O carrinho só é limpo depois da aprovação.
  async function handleGoToPayment() {
    if (!shipping || paying) return;
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }

    setPaying(true);
    setPaymentError("");
    try {
      const order = await orderApi.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingCep: quote.cep,
        shippingServiceCode: shipping.serviceCode,
        customerName: user.displayName || "",
        idempotencyKey: idempotencyKeyRef.current,
      });
      window.location.assign(order.initPoint);
    } catch (err) {
      setPaymentError(err.message);
      // Uma nova tentativa é um novo pedido, com nova chave.
      idempotencyKeyRef.current = newIdempotencyKey();
      setPaying(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-50 transition-opacity duration-500 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        aria-hidden={!open}
      />

      {/* Painel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-paper z-50 flex flex-col transition-transform duration-500 ease-out ${open ? "translate-x-0" : "translate-x-full"
          }`}
        role="dialog"
        aria-label="Carrinho de compras"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-6 h-[68px] border-b border-line shrink-0">
          <h2 className="font-display text-2xl text-ink">Seu carrinho</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar carrinho"
            className="text-ink hover:text-stone transition-colors -mr-2 p-2"
          >
            <X size={22} strokeWidth={1.25} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {items.length === 0 ? (
            <p className="text-stone text-center py-20 font-display italic text-2xl">
              Seu carrinho está vazio.
              <span className="block not-italic font-body text-sm mt-2">
                Explore nossas peças autorais.
              </span>
            </p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-4">
                <div className="w-20 h-24 shrink-0 overflow-hidden bg-sand flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-stone/40 text-sm">JW</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <p className="font-display text-lg text-ink leading-snug">{item.name}</p>
                  <p className="text-stone text-sm">{formatCurrency(item.price)}</p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="flex items-center border border-line">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        aria-label="Diminuir quantidade"
                        className="w-8 h-8 flex items-center justify-center text-ink hover:bg-sand transition-colors"
                      >
                        <Minus size={12} strokeWidth={1.5} />
                      </button>
                      <span className="text-sm text-ink w-7 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        aria-label="Aumentar quantidade"
                        className="w-8 h-8 flex items-center justify-center text-ink hover:bg-sand transition-colors"
                      >
                        <Plus size={12} strokeWidth={1.5} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      aria-label="Remover item"
                      className="ml-auto text-[11px] uppercase tracking-[0.2em] text-stone hover:text-ink border-b border-transparent hover:border-ink transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line px-6 py-5 space-y-4 overflow-y-auto max-h-[62vh] bg-white">
            <form onSubmit={handleCalculateShipping} className="flex gap-4 items-end">
              <label className="flex-1">
                <span className="label">CEP</span>
                <input
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  inputMode="numeric"
                  className="field mt-1 text-sm"
                />
              </label>
              <button
                type="submit"
                disabled={loadingShipping}
                className="link-line mb-2 disabled:opacity-60"
              >
                {loadingShipping ? <Loader2 size={14} className="animate-spin" /> : "Calcular frete"}
              </button>
            </form>
            {shippingError && <p className="text-red-800 text-xs">{shippingError}</p>}
            {quote && (
              <div className="space-y-2" role="radiogroup" aria-label="Opções de envio">
                {quote.options.map((option) => {
                  const selected = option.serviceCode === selectedCode;
                  return (
                    <label
                      key={option.serviceCode}
                      className={`flex items-center gap-3 border px-4 py-3 cursor-pointer transition-colors duration-300 ${
                        selected ? "border-ink bg-paper" : "border-line hover:border-stone"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping-option"
                        value={option.serviceCode}
                        checked={selected}
                        onChange={() => handleSelectOption(option.serviceCode)}
                        className="accent-accent"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-ink text-sm">{option.serviceName}</span>
                        <span className="block text-stone text-xs">
                          até {option.totalBusinessDays} dias úteis
                        </span>
                      </span>
                      <span className="text-ink text-sm">{formatCurrency(option.price)}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {shipping && (
              <p className="text-stone text-xs flex items-start gap-1.5 leading-relaxed">
                <Truck size={13} strokeWidth={1.5} className="text-ink mt-0.5 shrink-0" />
                <span>
                  Prazo estimado:{" "}
                  <span className="text-ink/80">
                    {shipping.productionDays} dias úteis de produção +{" "}
                    {shipping.shippingDays} dias úteis de entrega
                  </span>
                  {" "}· Total:{" "}
                  <span className="text-ink">{shipping.totalBusinessDays} dias úteis</span>
                  {shipping.estimatedDeliveryDate && (
                    <> (previsão: {shipping.estimatedDeliveryDate})</>
                  )}
                </span>
              </p>
            )}

            <div className="space-y-1.5 text-sm pt-1">
              <div className="flex justify-between text-stone">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone">
                <span>Frete</span>
                <span>{shipping ? formatCurrency(shipping.price) : "a calcular"}</span>
              </div>
              <div className="flex justify-between items-baseline text-ink pt-3 border-t border-line">
                <span className="label">Total</span>
                <span className="font-display text-2xl">{formatCurrency(total)}</span>
              </div>
            </div>

            <p className="text-stone text-[11px] leading-relaxed">
              6x sem juros no cartão de crédito · 5% de desconto no Pix.
              Consultar forma de entrega.
            </p>

            <button
              onClick={handleGoToPayment}
              disabled={!shipping || paying}
              className="btn w-full"
            >
              {paying ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Preparando pagamento...
                </>
              ) : (
                "Ir para pagamento"
              )}
            </button>
            {!shipping && (
              <p className="text-stone text-xs text-center flex items-center justify-center gap-1.5">
                <Info size={12} className="shrink-0" />
                Calcule o frete para continuar.
              </p>
            )}
            {paymentError && <p className="text-red-800 text-xs text-center">{paymentError}</p>}

            <button
              onClick={clearCart}
              className="w-full text-stone hover:text-ink text-xs transition-colors"
            >
              Esvaziar carrinho
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
