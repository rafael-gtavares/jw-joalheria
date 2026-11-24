import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  Wallet,
  Trash2,
  X,
  StickyNote,
  Clock,
  CheckCircle2,
  Hammer,
  Truck,
  PackageCheck,
  Ban,
  Plus,
  Pencil,
  Minus,
  Gem,
  Save,
  Loader2,
  AlertTriangle,
  Package,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Send,
  History,
} from "lucide-react";
import { orderApi } from "../../api/orderApi";
import { productApi } from "../../api/productApi";
import ConfirmModal from "./ConfirmModal";

import {
  STATUS_FLOW,
  ALL_STATUSES,
  STEP_LABELS,
  PAYMENT_LABELS,
  DELIVERY_LABELS,
  GENDER_OPTIONS,
  GENDER_LABELS,
  formatCurrency,
  formatDateTime,
  trackingUrl,
} from "../../helpers/orderStatus";

// Status permitidos no formulário de edição/criação (o despacho tem fluxo próprio).
const STATUSES = ALL_STATUSES;
const NEW_ORDER_STATUSES = ["pendente", "confirmado", "em produção", "pronto para envio"];

const STATUS_META = {
  pendente: { color: "text-yellow-300", bg: "bg-yellow-500/10", icon: Clock },
  confirmado: { color: "text-blue-300", bg: "bg-blue-500/10", icon: CheckCircle2 },
  "em produção": { color: "text-purple-300", bg: "bg-purple-500/10", icon: Hammer },
  "pronto para envio": { color: "text-orange-300", bg: "bg-orange-500/10", icon: Package },
  enviado: { color: "text-cyan-300", bg: "bg-cyan-500/10", icon: Truck },
  entregue: { color: "text-green-300", bg: "bg-green-500/10", icon: PackageCheck },
  cancelado: { color: "text-red-300", bg: "bg-red-500/10", icon: Ban },
};

const PAYMENT_META = {
  approved: "text-green-300 bg-green-500/10",
  authorized: "text-green-300 bg-green-500/10",
  pending: "text-yellow-300 bg-yellow-500/10",
  in_process: "text-yellow-300 bg-yellow-500/10",
  in_mediation: "text-orange-300 bg-orange-500/10",
  rejected: "text-red-300 bg-red-500/10",
  cancelled: "text-red-300 bg-red-500/10",
  refunded: "text-red-300 bg-red-500/10",
  charged_back: "text-red-300 bg-red-500/10",
};

const SOURCE_LABELS = {
  admin: "Admin",
  pagamento: "Mercado Pago",
  sistema: "Sistema",
  correios: "Correios",
};

const EMPTY_FORM = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  paymentMethod: "Pix",
  notes: "",
  status: "pendente",
  alreadyPaid: false,
  items: [],
};

const EMPTY_FILTERS = {
  from: "",
  to: "",
  minAge: "",
  maxAge: "",
  gender: "",
  status: "",
  paymentStatus: "",
  origin: "",
  q: "",
};

const PAGE_SIZE = 20;
const POLL_INTERVAL_MS = 30_000;

const inputClass =
  "bg-forest-900 border border-gold-500/20 rounded-full px-4 py-2 text-sm focus:border-gold-400 outline-none";

export default function AdminPedidos() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [toRemove, setToRemove] = useState(null); // pedido pendente de confirmação
  const [removing, setRemoving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const orders = data.items;
  const hasFilters = Object.values(filters).some(Boolean);

  // Recarrega (com pequeno atraso na digitação) quando filtros/página mudam.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      orderApi
        .listAdmin({ ...filters, page, limit: PAGE_SIZE })
        .then((res) => {
          if (cancelled) return;
          setData(res);
          setLoadError("");
        })
        .catch((err) => !cancelled && setLoadError(err.message))
        .finally(() => !cancelled && setLoading(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters, page, reloadKey]);

  // Atualização automática: pedidos novos e pagamentos confirmados aparecem
  // sozinhos. Silenciosa (sem spinner) e só com a aba visível.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      orderApi
        .listAdmin({ ...filters, page, limit: PAGE_SIZE })
        .then((res) => {
          setData(res);
          setLoadError("");
          setSelected((s) => (s ? res.items.find((o) => o._id === s._id) || s : s));
        })
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [filters, page]);

  useEffect(() => {
    productApi.listAllAdmin().then(setProducts).catch(() => {});
  }, []);

  function load() {
    setReloadKey((k) => k + 1);
  }

  function updateFilter(key, value) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearFilters() {
    setPage(1);
    setFilters(EMPTY_FILTERS);
  }

  // Chamado pelo modal depois de qualquer ação (etapa, despacho, rastreio).
  function handleOrderUpdated(updated) {
    setSelected((s) => (s && s._id === updated._id ? { ...s, ...updated } : s));
    setData((d) => ({
      ...d,
      items: d.items.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)),
    }));
  }

  async function confirmRemoveOrder() {
    if (!toRemove) return;
    setRemoving(true);
    try {
      await orderApi.remove(toRemove._id);
      setSelected(null);
      setToRemove(null);
      load();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setRemoving(false);
    }
  }

  function openNewOrder() {
    setEditingOrder(null);
    setSelected(null);
    setShowForm(true);
  }

  function openEditOrder(order) {
    setEditingOrder(order);
    setSelected(null);
    setShowForm(true);
  }

  return (
    <div>
      {loadError && (
        <p className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-3 py-2">
          {loadError}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/40" />
          <input
            placeholder="Buscar por cliente ou e-mail..."
            value={filters.q}
            onChange={(e) => updateFilter("q", e.target.value)}
            className="w-full bg-forest-900 border border-gold-500/20 rounded-full pl-9 pr-4 py-2.5 text-sm focus:border-gold-400 outline-none"
          />
        </div>
        <button
          onClick={load}
          title="Atualizar lista"
          className="flex items-center justify-center gap-1.5 border border-gold-500/30 hover:border-gold-400 text-gold-300 px-4 py-2.5 rounded-full text-sm transition-colors"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
        <button
          onClick={openNewOrder}
          title="Para registrar vendas feitas fora do site"
          className="flex items-center justify-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-forest-950 font-medium px-5 py-2.5 rounded-full text-sm whitespace-nowrap transition-colors"
        >
          <Plus size={16} /> Novo pedido (venda externa)
        </button>
      </div>

      {/* Filtros combináveis: período, idade, sexo, etapa e pagamento */}
      <div className="bg-forest-900/60 border border-gold-500/15 rounded-2xl p-3 mb-5">
        <div className="flex items-center gap-1.5 text-cream/50 text-xs uppercase tracking-wide mb-2">
          <Filter size={12} /> Filtros
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <label className="text-xs text-cream/50">
            Pedidos de
            <input
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => updateFilter("from", e.target.value)}
              className={`${inputClass} w-full mt-1`}
            />
          </label>
          <label className="text-xs text-cream/50">
            até
            <input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => updateFilter("to", e.target.value)}
              className={`${inputClass} w-full mt-1`}
            />
          </label>
          <label className="text-xs text-cream/50">
            Idade mínima
            <input
              type="number"
              min="0"
              max="120"
              value={filters.minAge}
              onChange={(e) => updateFilter("minAge", e.target.value)}
              className={`${inputClass} w-full mt-1`}
            />
          </label>
          <label className="text-xs text-cream/50">
            Idade máxima
            <input
              type="number"
              min="0"
              max="120"
              value={filters.maxAge}
              onChange={(e) => updateFilter("maxAge", e.target.value)}
              className={`${inputClass} w-full mt-1`}
            />
          </label>
          <label className="text-xs text-cream/50">
            Sexo
            <select
              value={filters.gender}
              onChange={(e) => updateFilter("gender", e.target.value)}
              className={`${inputClass} w-full mt-1`}
            >
              <option value="">Todos</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-cream/50">
            Etapa do pedido
            <select
              value={filters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className={`${inputClass} w-full mt-1`}
            >
              <option value="">Todas</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STEP_LABELS[s] || s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-cream/50">
            Pagamento
            <select
              value={filters.paymentStatus}
              onChange={(e) => updateFilter("paymentStatus", e.target.value)}
              className={`${inputClass} w-full mt-1`}
            >
              <option value="">Todos</option>
              {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-cream/50">
            Origem
            <select
              value={filters.origin}
              onChange={(e) => updateFilter("origin", e.target.value)}
              className={`${inputClass} w-full mt-1`}
            >
              <option value="">Todas</option>
              <option value="site">Site</option>
              <option value="manual">Manual (fora do site)</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              disabled={!hasFilters}
              className="w-full text-sm text-gold-300 hover:text-gold-400 disabled:text-cream/20 py-2 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        </div>
        <p className="text-cream/35 text-[11px] mt-2">
          Idade e sexo usam o cadastro atual do cliente (informado por ele, opcional): pedidos de
          visitantes ou de clientes sem esses dados não aparecem quando esses filtros estão ativos.
        </p>
      </div>

      <p className="text-cream/50 text-xs mb-3 flex items-center gap-2">
        {loading && <Loader2 size={12} className="animate-spin" />}
        {data.total} {data.total === 1 ? "pedido" : "pedidos"}
        {hasFilters && " com os filtros aplicados"}
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {orders.map((o) => {
          const meta = STATUS_META[o.status] || STATUS_META.pendente;
          const StatusIcon = meta.icon;
          return (
            <button
              key={o._id}
              onClick={() => setSelected(o)}
              className="text-left bg-forest-900 border border-gold-500/20 hover:border-gold-400 rounded-2xl p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-cream text-sm font-medium truncate">
                    <User size={13} className="text-gold-400 shrink-0" />
                    {o.customerName}
                  </p>
                  <p className="text-cream/40 text-xs mt-0.5">
                    {o.items.length} {o.items.length === 1 ? "item" : "itens"} ·{" "}
                    {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                    {o.customerProfile && (
                      <>
                        {" "}
                        · {GENDER_LABELS[o.customerProfile.gender] || ""}
                        {o.customerProfile.age !== null && o.customerProfile.age !== undefined
                          ? `, ${o.customerProfile.age} anos`
                          : ""}
                      </>
                    )}
                  </p>
                </div>
                <span
                  className={`shrink-0 flex items-center gap-1 text-xs rounded-full px-2.5 py-1 ${meta.bg} ${meta.color}`}
                >
                  <StatusIcon size={12} />
                  {STEP_LABELS[o.status] || o.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
                <OriginBadge origin={o.origin} />
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    PAYMENT_META[o.paymentStatus] || "text-cream/60 bg-cream/5"
                  }`}
                >
                  Pgto: {PAYMENT_LABELS[o.paymentStatus] || o.paymentStatus}
                </span>
                {o.tracking?.code && (
                  <span className="rounded-full px-2 py-0.5 text-cyan-300 bg-cyan-500/10">
                    Entrega: {DELIVERY_LABELS[o.tracking.deliveryStatus] || o.tracking.deliveryStatus}
                  </span>
                )}
              </div>
              <p className="text-gold-300 text-lg font-display mt-3">{formatCurrency(o.total)}</p>
            </button>
          );
        })}
      </div>

      {!loading && orders.length === 0 && (
        <div className="bg-forest-900 border border-gold-500/20 rounded-2xl py-14 text-center">
          <ClipboardList size={26} className="mx-auto text-gold-500/40 mb-2" />
          <p className="text-cream/40 text-sm">
            {hasFilters ? "Nenhum pedido encontrado com esses filtros." : "Nenhum pedido ainda."}
          </p>
        </div>
      )}

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 text-gold-300 disabled:text-cream/20"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <span className="text-cream/50">
            Página {data.page} de {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page >= data.pages}
            className="flex items-center gap-1 text-gold-300 disabled:text-cream/20"
          >
            Próxima <ChevronRight size={16} />
          </button>
        </div>
      )}

      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleOrderUpdated}
          onRequestDelete={() => setToRemove(selected)}
          onEdit={() => openEditOrder(selected)}
        />
      )}

      {showForm && (
        <OrderFormModal
          order={editingOrder}
          products={products}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {toRemove && (
        <ConfirmModal
          title="Remover pedido?"
          description={`Tem certeza que quer remover o pedido de "${toRemove.customerName}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Remover"
          loading={removing}
          onCancel={() => setToRemove(null)}
          onConfirm={confirmRemoveOrder}
        />
      )}
    </div>
  );
}

const CANCELABLE = ["pendente", "confirmado", "em produção", "pronto para envio"];

function OriginBadge({ origin }) {
  return origin === "site" ? (
    <span className="rounded-full px-2 py-0.5 text-gold-300 bg-gold-500/10">Site</span>
  ) : (
    <span className="rounded-full px-2 py-0.5 text-cream/60 bg-cream/5">Manual</span>
  );
}

function OrderModal({ order, onClose, onUpdated, onRequestDelete, onEdit }) {
  const meta = STATUS_META[order.status] || STATUS_META.pendente;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [dispatchNote, setDispatchNote] = useState("");
  const [editingCode, setEditingCode] = useState(false);

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
  // Despachar (com código de rastreio) é a única forma de chegar a "enviado".
  const canDispatch = ["confirmado", "em produção", "pronto para envio"].includes(order.status);
  const canAdvance = nextStatus && nextStatus !== "enviado" && nextStatus !== "entregue";
  const canMarkDelivered = order.status === "enviado";

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      const updated = await action();
      onUpdated(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  const isSiteOrder = order.origin === "site";
  const awaitingPayment = isSiteOrder && order.status === "pendente";
  const checkPayment = () => run(() => orderApi.syncPayment(order._id));

  const advance = (status) => run(() => orderApi.updateStatus(order._id, status));

  async function handleCancel() {
    if (!window.confirm("Cancelar este pedido? As peças reservadas voltam ao estoque.")) return;
    await advance("cancelado");
  }

  async function handleDispatch(e) {
    e.preventDefault();
    const updated = await run(() => orderApi.dispatch(order._id, trackingCode, dispatchNote));
    if (updated) {
      setTrackingCode("");
      setDispatchNote("");
    }
  }

  async function handleFixCode(e) {
    e.preventDefault();
    const updated = await run(() => orderApi.setTracking(order._id, trackingCode));
    if (updated) {
      setEditingCode(false);
      setTrackingCode("");
    }
  }

  const history = [...(order.statusHistory || [])].reverse();

  return (
    <div
      className="fixed inset-0 bg-forest-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-forest-900 border border-gold-500/20 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-cream/50 hover:text-cream">
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="bg-gold-500/15 text-gold-400 rounded-full p-2">
            <ClipboardList size={18} />
          </span>
          <h2 className="font-display text-xl">Pedido de {order.customerName}</h2>
          <span className="text-[11px]">
            <OriginBadge origin={order.origin} />
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-cream/40 text-xs ml-11">
          <Calendar size={12} />
          {formatDateTime(order.createdAt)}
        </p>

        {/* Três situações distintas: pagamento, produção/despacho e entrega */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center text-[11px]">
          <div
            className={`rounded-xl px-2 py-2 ${
              PAYMENT_META[order.paymentStatus] || "bg-cream/5 text-cream/60"
            }`}
          >
            <p className="uppercase tracking-wide opacity-70 mb-0.5">Pagamento</p>
            {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
          </div>
          <div className={`rounded-xl px-2 py-2 ${meta.bg} ${meta.color}`}>
            <p className="uppercase tracking-wide opacity-70 mb-0.5">Produção</p>
            {STEP_LABELS[order.status] || order.status}
          </div>
          <div className="rounded-xl px-2 py-2 bg-cyan-500/10 text-cyan-300">
            <p className="uppercase tracking-wide opacity-70 mb-0.5">Entrega</p>
            {order.tracking?.code
              ? DELIVERY_LABELS[order.tracking.deliveryStatus] || order.tracking.deliveryStatus
              : "—"}
          </div>
        </div>

        <div className="mt-5 space-y-2 text-sm">
          <p className="flex items-center gap-2 text-cream/80">
            <Mail size={14} className="text-gold-400" /> {order.customerEmail}
          </p>
          {order.customerPhone && (
            <p className="flex items-center gap-2 text-cream/80">
              <Phone size={14} className="text-gold-400" /> {order.customerPhone}
            </p>
          )}
          {order.customerProfile && (
            <p className="flex items-center gap-2 text-cream/80">
              <User size={14} className="text-gold-400" />
              {GENDER_LABELS[order.customerProfile.gender] || "—"}
              {order.customerProfile.age !== null && order.customerProfile.age !== undefined
                ? ` · ${order.customerProfile.age} anos`
                : ""}
            </p>
          )}
          <p className="flex items-center gap-2 text-cream/80">
            <Wallet size={14} className="text-gold-400" /> {order.paymentMethod || "Pix"}
          </p>
          {(order.paymentId || order.paidAt) && (
            <p className="text-cream/60 text-xs ml-6 space-y-0.5">
              {order.paymentId && <span className="block">ID do pagamento: {order.paymentId}</span>}
              {order.paidAt && <span className="block">Pago em {formatDateTime(order.paidAt)}</span>}
            </p>
          )}
          {order.shipping?.serviceName ? (
            <p className="flex items-start gap-2 text-cream/80">
              <Truck size={14} className="text-gold-400 mt-0.5" />
              <span>
                {order.shipping.serviceName} · CEP {order.shipping.cep} ·{" "}
                {formatCurrency(order.shippingCost)}
                <span className="block text-cream/50 text-xs">
                  {order.shipping.productionDays} dias de produção + {order.shipping.shippingDays} de
                  entrega
                  {order.shipping.estimatedDeliveryDate &&
                    ` (previsão ${order.shipping.estimatedDeliveryDate})`}
                </span>
              </span>
            </p>
          ) : (
            order.shippingCep && (
              <p className="flex items-center gap-2 text-cream/80">
                <Truck size={14} className="text-gold-400" /> CEP {order.shippingCep}
              </p>
            )
          )}
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-cream/50 mb-2">Itens</p>
          <div className="bg-forest-950 border border-gold-500/10 rounded-xl divide-y divide-gold-500/10">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between px-3 py-2 text-sm">
                <span className="text-cream/80">
                  {i.quantity}x {i.name}
                </span>
                <span className="text-cream/60">{formatCurrency(i.price * i.quantity)}</span>
              </div>
            ))}
          </div>
          <p className="flex justify-between mt-2 text-sm font-medium text-cream">
            <span>Total</span>
            <span className="text-gold-300">{formatCurrency(order.total)}</span>
          </p>
        </div>

        {order.notes && (
          <div className="mt-5">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-cream/50 mb-2">
              <StickyNote size={13} /> Observações
            </p>
            <p className="bg-forest-950 border border-gold-500/10 rounded-xl px-3 py-2 text-sm text-cream/70 whitespace-pre-line">
              {order.notes}
            </p>
          </div>
        )}

        {/* Etapas de produção e despacho */}
        <div className="mt-5 border-t border-gold-500/10 pt-4">
          <p className="text-xs uppercase tracking-wide text-cream/50 mb-2">Produção e despacho</p>

          {error && (
            <p className="mb-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {awaitingPayment && (
            <div className="mb-3 flex flex-wrap items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2 text-xs text-yellow-200">
              Aguardando pagamento no Mercado Pago.
              <button
                disabled={busy}
                onClick={checkPayment}
                className="flex items-center gap-1 text-gold-300 hover:text-gold-400 disabled:opacity-60"
              >
                <RefreshCw size={12} /> Verificar pagamento
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {canAdvance && !awaitingPayment && (
              <button
                disabled={busy}
                onClick={() => advance(nextStatus)}
                className="bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-forest-950 text-sm font-medium px-4 py-2 rounded-full transition-colors"
              >
                Avançar para "{STEP_LABELS[nextStatus]}"
              </button>
            )}
            {canMarkDelivered && (
              <button
                disabled={busy}
                onClick={() => advance("entregue")}
                className="bg-green-500/20 hover:bg-green-500/30 disabled:opacity-60 text-green-300 text-sm px-4 py-2 rounded-full transition-colors"
              >
                Marcar como entregue
              </button>
            )}
            {CANCELABLE.includes(order.status) && (
              <button
                disabled={busy}
                onClick={handleCancel}
                className="border border-red-400/40 hover:border-red-300 disabled:opacity-60 text-red-300 text-sm px-4 py-2 rounded-full transition-colors"
              >
                Cancelar pedido
              </button>
            )}
          </div>

          {canDispatch && (
            <form
              onSubmit={handleDispatch}
              className="mt-4 bg-forest-950 border border-gold-500/10 rounded-xl p-3 space-y-2"
            >
              <p className="flex items-center gap-1.5 text-cream text-sm">
                <Send size={14} className="text-gold-400" /> Registrar despacho
              </p>
              <input
                required
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="Código de rastreio (ex.: AA123456789BR)"
                maxLength={13}
                className="w-full bg-forest-900 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-3 py-2 text-sm font-mono"
              />
              <input
                value={dispatchNote}
                onChange={(e) => setDispatchNote(e.target.value)}
                placeholder="Observação para o histórico (opcional)"
                maxLength={300}
                className="w-full bg-forest-900 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={busy}
                className="bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-forest-950 text-sm font-medium px-4 py-2 rounded-full transition-colors"
              >
                {busy ? "Salvando..." : "Registrar despacho e iniciar rastreio"}
              </button>
            </form>
          )}

          {order.tracking?.code && (
            <div className="mt-4 bg-forest-950 border border-gold-500/10 rounded-xl p-3 text-sm space-y-2">
              <p className="flex items-center gap-1.5 text-cream">
                <Truck size={14} className="text-gold-400" /> Rastreio dos Correios
                {order.tracking.simulated && (
                  <span className="text-[10px] uppercase text-yellow-300 bg-yellow-500/10 rounded-full px-2 py-0.5">
                    dados fictícios
                  </span>
                )}
              </p>
              <p className="text-cream/70 text-xs">
                Código <span className="font-mono text-cream">{order.tracking.code}</span> ·{" "}
                <a
                  href={trackingUrl(order.tracking.code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-300 underline"
                >
                  abrir nos Correios
                </a>
              </p>
              <p className="text-cream/50 text-xs">
                {order.tracking.lastCheckedAt
                  ? `Última consulta: ${formatDateTime(order.tracking.lastCheckedAt)}`
                  : "Ainda não consultado."}
                {order.tracking.lastError && (
                  <span className="block text-red-300">Erro: {order.tracking.lastError}</span>
                )}
              </p>

              {order.tracking.events?.length > 0 && (
                <ul className="text-xs text-cream/70 space-y-1 border-l border-gold-500/20 pl-3">
                  {order.tracking.events.slice(0, 5).map((ev, idx) => (
                    <li key={idx}>
                      {ev.description}
                      <span className="block text-cream/40">
                        {formatDateTime(ev.at)}
                        {ev.location && ` · ${ev.location}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {order.status === "enviado" && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {!order.tracking.simulated && (
                    <button
                      disabled={busy}
                      onClick={() => run(() => orderApi.refreshTracking(order._id))}
                      className="flex items-center gap-1 text-gold-300 hover:text-gold-400 disabled:opacity-60 text-xs"
                    >
                      <RefreshCw size={12} /> Atualizar rastreio
                    </button>
                  )}
                  <button
                    onClick={() => setEditingCode((v) => !v)}
                    className="text-cream/50 hover:text-cream text-xs"
                  >
                    Corrigir código
                  </button>
                </div>
              )}

              {editingCode && (
                <form onSubmit={handleFixCode} className="flex gap-2">
                  <input
                    required
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    placeholder="Novo código"
                    maxLength={13}
                    className="flex-1 bg-forest-900 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-3 py-1.5 text-sm font-mono"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-forest-950 text-xs font-medium px-3 rounded-full"
                  >
                    Salvar
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Histórico completo de alterações (nunca é apagado) */}
        <div className="mt-5 border-t border-gold-500/10 pt-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-cream/50 mb-2">
            <History size={13} /> Histórico de alterações
          </p>
          {history.length === 0 ? (
            <p className="text-cream/35 text-xs">
              Sem alterações registradas (pedido anterior ao histórico).
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((h, idx) => (
                <li key={idx} className="text-xs">
                  <p className="text-cream/80">
                    {STEP_LABELS[h.status] || h.status}
                    <span className="text-cream/40">
                      {" "}
                      · pgto {PAYMENT_LABELS[h.paymentStatus] || h.paymentStatus || "—"}
                    </span>
                  </p>
                  <p className="text-cream/40">
                    {formatDateTime(h.at)} · {SOURCE_LABELS[h.source] || h.source}
                    {h.actorEmail && ` (${h.actorEmail})`}
                    {h.note && ` — ${h.note}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-gold-400 hover:text-gold-300 text-sm"
          >
            <Pencil size={15} /> Editar pedido
          </button>
          <button
            onClick={onRequestDelete}
            className="flex items-center gap-1.5 text-red-300 hover:text-red-200 text-sm"
          >
            <Trash2 size={15} /> Remover pedido
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderFormModal({ order, products, onClose, onSaved }) {
  const isEditing = Boolean(order);
  // Pedido do site: itens, frete e total já foram cobrados no Mercado Pago.
  const locked = isEditing && order.origin === "site";
  const [form, setForm] = useState(() =>
    isEditing
      ? {
          customerName: order.customerName,
          customerEmail: order.customerEmail || "",
          customerPhone: order.customerPhone || "",
          paymentMethod: order.paymentMethod || "Pix",
          notes: order.notes || "",
          status: order.status,
          alreadyPaid: false,
          items: order.items.map((i) => ({ ...i })),
        }
      : EMPTY_FORM
  );
  const [productToAdd, setProductToAdd] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const total = form.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  function addItem() {
    if (!productToAdd) return;
    const product = products.find((p) => p._id === productToAdd);
    if (!product) return;

    setForm((f) => {
      const existing = f.items.find((i) => i.product === product._id);
      if (existing) {
        return {
          ...f,
          items: f.items.map((i) =>
            i.product === product._id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        ...f,
        items: [
          ...f.items,
          { product: product._id, name: product.name, price: product.price, quantity: 1 },
        ],
      };
    });
    setProductToAdd("");
  }

  function changeQuantity(idx, delta) {
    setForm((f) => {
      const items = [...f.items];
      const newQty = items[idx].quantity + delta;
      if (newQty < 1) {
        items.splice(idx, 1);
      } else {
        items[idx] = { ...items[idx], quantity: newQty };
      }
      return { ...f, items };
    });
  }

  function removeItem(idx) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.items.length) {
      setError("Adicione ao menos uma peça ao pedido.");
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await orderApi.update(order._id, form);
      } else {
        await orderApi.createAdmin({
          ...form,
          paymentStatus: form.alreadyPaid ? "approved" : "pending",
        });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-forest-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-forest-900 border border-gold-500/20 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-cream/50 hover:text-cream"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-5">
          <span className="bg-gold-500/15 text-gold-400 rounded-full p-2">
            {isEditing ? <Pencil size={18} /> : <Plus size={18} />}
          </span>
          <h2 className="font-display text-xl">
            {isEditing ? "Editar pedido" : "Novo pedido (venda externa)"}
          </h2>
        </div>

        {error && (
          <p className="flex items-center gap-2 text-red-300 text-sm mb-3 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <AlertTriangle size={16} className="shrink-0" />
            {error}
          </p>
        )}

        <div className="space-y-3">
          <input
            placeholder="Nome do cliente"
            required
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="E-mail (opcional)"
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
            />
            <input
              placeholder="Telefone / WhatsApp"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Forma de pagamento"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
            >
              {(isEditing ? STATUSES : NEW_ORDER_STATUSES).map((s) => (
                <option key={s} value={s}>
                  {STEP_LABELS[s] || s}
                </option>
              ))}
            </select>
          </div>
          {!isEditing && (
            <label className="flex items-center gap-2 text-sm text-cream/70">
              <input
                type="checkbox"
                checked={form.alreadyPaid}
                onChange={(e) => setForm({ ...form, alreadyPaid: e.target.checked })}
              />
              Venda já paga (fora do site)
            </label>
          )}
          <textarea
            placeholder="Observações (opcional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
            rows={2}
          />
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-cream/50 mb-2">Peças do pedido</p>

          {locked && (
            <p className="text-xs text-yellow-200 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2 mb-3">
              Pedido feito pelo site: peças, frete e valores já foram cobrados no Mercado Pago e não
              podem ser alterados. Só telefone, observações e etapa.
            </p>
          )}

          <div className={`flex gap-2 mb-3 ${locked ? "hidden" : ""}`}>
            <select
              value={productToAdd}
              onChange={(e) => setProductToAdd(e.target.value)}
              className="flex-1 bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
            >
              <option value="">Selecione uma peça...</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addItem}
              disabled={!productToAdd}
              className="flex items-center gap-1 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-forest-950 rounded-xl px-4 text-sm font-medium"
            >
              <Plus size={15} /> Add
            </button>
          </div>

          {form.items.length === 0 ? (
            <div className="bg-forest-950 border border-gold-500/10 rounded-xl py-6 text-center">
              <Gem size={20} className="mx-auto text-gold-500/40 mb-1" />
              <p className="text-cream/40 text-xs">Nenhuma peça adicionada ainda.</p>
            </div>
          ) : (
            <div className="bg-forest-950 border border-gold-500/10 rounded-xl divide-y divide-gold-500/10">
              {form.items.map((i, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-cream/80 truncate flex-1">{i.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      hidden={locked}
                      onClick={() => changeQuantity(idx, -1)}
                      className="text-cream/50 hover:text-cream"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-cream/80 w-5 text-center">{i.quantity}</span>
                    <button
                      type="button"
                      hidden={locked}
                      onClick={() => changeQuantity(idx, 1)}
                      className="text-cream/50 hover:text-cream"
                    >
                      <Plus size={13} />
                    </button>
                    <span className="text-cream/60 w-20 text-right">
                      {(i.price * i.quantity).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                    <button
                      type="button"
                      hidden={locked}
                      onClick={() => removeItem(idx)}
                      className="text-red-300 hover:text-red-200"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="flex justify-between mt-2 text-sm font-medium text-cream">
            <span>Total</span>
            <span className="text-gold-300">
              {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </p>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-forest-950 font-medium px-5 py-2.5 rounded-full text-sm transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEditing ? "Salvar alterações" : "Criar pedido"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-cream/60 hover:text-cream px-4 py-2.5"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}