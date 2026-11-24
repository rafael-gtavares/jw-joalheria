import React, { useEffect, useRef, useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, Loader2, Truck, Info } from "lucide-react";
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
        className={`fixed inset-0 bg-forest-950/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        aria-hidden={!open}
      />

      {/* Painel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-forest-900 border-l border-gold-500/20 z-50 flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"
          }`}
        role="dialog"
        aria-label="Carrinho de compras"
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gold-500/15">
          <h2 className="font-display text-xl text-cream flex items-center gap-2">
            <ShoppingBag size={18} className="text-gold-400" /> Seu carrinho
          </h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar carrinho"
            className="text-cream/60 hover:text-cream transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {items.length === 0 ? (
            <p className="text-cream/40 text-sm text-center py-16">
              Seu carrinho está vazio. Explore nossas peças autorais.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3">
                <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-forest-800 flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-gold-500/40 text-sm">JW</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-cream text-sm truncate">{item.name}</p>
                  <p className="text-gold-300 text-sm">{formatCurrency(item.price)}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      aria-label="Diminuir quantidade"
                      className="w-6 h-6 flex items-center justify-center rounded-full border border-gold-500/30 text-cream/70 hover:border-gold-400 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm text-cream w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      aria-label="Aumentar quantidade"
                      className="w-6 h-6 flex items-center justify-center rounded-full border border-gold-500/30 text-cream/70 hover:border-gold-400 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      aria-label="Remover item"
                      className="ml-auto text-red-300/80 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gold-500/15 px-6 py-5 space-y-4">
            <form onSubmit={handleCalculateShipping} className="flex gap-2">
              <input
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="Seu CEP"
                className="flex-1 bg-forest-950 border border-gold-500/20 focus:border-gold-400 outline-none rounded-full px-4 py-2 text-sm text-cream placeholder:text-cream/40"
              />
              <button
                type="submit"
                disabled={loadingShipping}
                className="bg-gold-500/15 hover:bg-gold-500/25 text-gold-300 text-xs uppercase tracking-wide px-4 rounded-full transition-colors disabled:opacity-60"
              >
                {loadingShipping ? <Loader2 size={14} className="animate-spin" /> : "Calcular frete"}
              </button>
            </form>
            {shippingError && <p className="text-red-300 text-xs">{shippingError}</p>}
            {quote && (
              <div className="space-y-2" role="radiogroup" aria-label="Opções de envio">
                {quote.options.map((option) => {
                  const selected = option.serviceCode === selectedCode;
                  return (
                    <label
                      key={option.serviceCode}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                        selected
                          ? "border-gold-400 bg-gold-500/10"
                          : "border-gold-500/20 hover:border-gold-500/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping-option"
                        value={option.serviceCode}
                        checked={selected}
                        onChange={() => handleSelectOption(option.serviceCode)}
                        className="accent-gold-400"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-cream text-sm">{option.serviceName}</span>
                        <span className="block text-cream/50 text-xs">
                          até {option.totalBusinessDays} dias úteis
                        </span>
                      </span>
                      <span className="text-gold-300 text-sm">{formatCurrency(option.price)}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {shipping && (
              <p className="text-cream/50 text-xs flex items-start gap-1.5">
                <Truck size={13} className="text-gold-400 mt-0.5 shrink-0" />
                <span>
                  Prazo estimado:{" "}
                  <span className="text-cream/70">
                    {shipping.productionDays} dias úteis de produção +{" "}
                    {shipping.shippingDays} dias úteis de entrega
                  </span>
                  {" "}· Total:{" "}
                  <span className="text-gold-300">{shipping.totalBusinessDays} dias úteis</span>
                  {shipping.estimatedDeliveryDate && (
                    <> (previsão: {shipping.estimatedDeliveryDate})</>
                  )}
                </span>
              </p>
            )}

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-cream/70">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-cream/70">
                <span>Frete</span>
                <span>{shipping ? formatCurrency(shipping.price) : "a calcular"}</span>
              </div>
              <div className="flex justify-between text-cream text-base font-medium pt-1 border-t border-gold-500/10">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <p className="text-cream/40 text-[11px] leading-relaxed">
              6x sem juros no cartão de crédito · 5% de desconto no Pix.
              Consultar forma de entrega.
            </p>

            <button
              onClick={handleGoToPayment}
              disabled={!shipping || paying}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-gold-500/30 disabled:cursor-not-allowed disabled:hover:bg-gold-500/30 text-forest-950 font-medium py-3 rounded-full transition-colors flex items-center justify-center gap-2"
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
              <p className="text-cream/50 text-xs text-center flex items-center justify-center gap-1.5">
                <Info size={12} className="shrink-0" />
                Calcule o frete para continuar.
              </p>
            )}
            {paymentError && <p className="text-red-300 text-xs text-center">{paymentError}</p>}

            <button
              onClick={clearCart}
              className="w-full text-cream/40 hover:text-cream/70 text-xs transition-colors"
            >
              Esvaziar carrinho
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
