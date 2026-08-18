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
} from "lucide-react";
import { api } from "../../lib/api";

const STATUSES = ["pendente", "confirmado", "em produção", "enviado", "entregue", "cancelado"];

const STATUS_META = {
  pendente: { color: "text-yellow-300", bg: "bg-yellow-500/10", icon: Clock },
  confirmado: { color: "text-blue-300", bg: "bg-blue-500/10", icon: CheckCircle2 },
  "em produção": { color: "text-purple-300", bg: "bg-purple-500/10", icon: Hammer },
  enviado: { color: "text-cyan-300", bg: "bg-cyan-500/10", icon: Truck },
  entregue: { color: "text-green-300", bg: "bg-green-500/10", icon: PackageCheck },
  cancelado: { color: "text-red-300", bg: "bg-red-500/10", icon: Ban },
};

const EMPTY_FORM = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  paymentMethod: "Pix",
  notes: "",
  status: "pendente",
  items: [],
};

export default function AdminPedidos() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  function load() {
    api.getOrders().then(setOrders);
  }

  useEffect(load, []);
  useEffect(() => {
    api.getAllProducts().then(setProducts).catch(() => {});
  }, []);

  async function changeStatus(id, status) {
    await api.updateOrderStatus(id, status);
    load();
    setSelected((s) => (s && s._id === id ? { ...s, status } : s));
  }

  async function removeOrder(id) {
    if (!confirm("Remover esse pedido? Essa ação não pode ser desfeita.")) return;
    await api.deleteOrder(id);
    setSelected(null);
    load();
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

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.customerEmail?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "Todos" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/40" />
          <input
            placeholder="Buscar por cliente ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-forest-900 border border-gold-500/20 rounded-full pl-9 pr-4 py-2.5 text-sm focus:border-gold-400 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-forest-900 border border-gold-500/20 rounded-full px-4 py-2.5 text-sm focus:border-gold-400 outline-none"
        >
          <option>Todos</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={openNewOrder}
          className="flex items-center justify-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-forest-950 font-medium px-5 py-2.5 rounded-full text-sm whitespace-nowrap transition-colors"
        >
          <Plus size={16} /> Novo pedido
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filteredOrders.map((o) => {
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
                  </p>
                </div>
                <span
                  className={`shrink-0 flex items-center gap-1 text-xs rounded-full px-2.5 py-1 ${meta.bg} ${meta.color}`}
                >
                  <StatusIcon size={12} />
                  {o.status}
                </span>
              </div>
              <p className="text-gold-300 text-lg font-display mt-3">
                {o.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="bg-forest-900 border border-gold-500/20 rounded-2xl py-14 text-center">
          <ClipboardList size={26} className="mx-auto text-gold-500/40 mb-2" />
          <p className="text-cream/40 text-sm">
            {orders.length === 0
              ? "Nenhum pedido ainda."
              : "Nenhum pedido encontrado com esse filtro."}
          </p>
        </div>
      )}

      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onChangeStatus={changeStatus}
          onDelete={removeOrder}
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
    </div>
  );
}

function OrderModal({ order, onClose, onChangeStatus, onDelete, onEdit }) {
  const meta = STATUS_META[order.status] || STATUS_META.pendente;

  return (
    <div
      className="fixed inset-0 bg-forest-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-forest-900 border border-gold-500/20 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cream/50 hover:text-cream"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="bg-gold-500/15 text-gold-400 rounded-full p-2">
            <ClipboardList size={18} />
          </span>
          <h2 className="font-display text-xl">Pedido de {order.customerName}</h2>
        </div>
        <p className="flex items-center gap-1.5 text-cream/40 text-xs ml-11">
          <Calendar size={12} />
          {new Date(order.createdAt).toLocaleString("pt-BR")}
        </p>

        <div className="mt-5 space-y-2 text-sm">
          <p className="flex items-center gap-2 text-cream/80">
            <Mail size={14} className="text-gold-400" /> {order.customerEmail}
          </p>
          {order.customerPhone && (
            <p className="flex items-center gap-2 text-cream/80">
              <Phone size={14} className="text-gold-400" /> {order.customerPhone}
            </p>
          )}
          <p className="flex items-center gap-2 text-cream/80">
            <Wallet size={14} className="text-gold-400" /> {order.paymentMethod || "Pix"}
          </p>
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-cream/50 mb-2">Itens</p>
          <div className="bg-forest-950 border border-gold-500/10 rounded-xl divide-y divide-gold-500/10">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between px-3 py-2 text-sm">
                <span className="text-cream/80">
                  {i.quantity}x {i.name}
                </span>
                <span className="text-cream/60">
                  {(i.price * i.quantity).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            ))}
          </div>
          <p className="flex justify-between mt-2 text-sm font-medium text-cream">
            <span>Total</span>
            <span className="text-gold-300">
              {order.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </p>
        </div>

        {order.notes && (
          <div className="mt-5">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-cream/50 mb-2">
              <StickyNote size={13} /> Observações
            </p>
            <p className="bg-forest-950 border border-gold-500/10 rounded-xl px-3 py-2 text-sm text-cream/70">
              {order.notes}
            </p>
          </div>
        )}

        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-cream/50 mb-2">Status do pedido</p>
          <select
            value={order.status}
            onChange={(e) => onChangeStatus(order._id, e.target.value)}
            className={`w-full border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm font-medium ${meta.bg} ${meta.color}`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-forest-950 text-cream">
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-gold-400 hover:text-gold-300 text-sm"
          >
            <Pencil size={15} /> Editar pedido
          </button>
          <button
            onClick={() => onDelete(order._id)}
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
  const [form, setForm] = useState(() =>
    isEditing
      ? {
          customerName: order.customerName,
          customerEmail: order.customerEmail || "",
          customerPhone: order.customerPhone || "",
          paymentMethod: order.paymentMethod || "Pix",
          notes: order.notes || "",
          status: order.status,
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
        await api.updateOrder(order._id, form);
      } else {
        await api.createOrderAdmin(form);
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
            {isEditing ? "Editar pedido" : "Novo pedido"}
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
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
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

          <div className="flex gap-2 mb-3">
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
                      onClick={() => changeQuantity(idx, -1)}
                      className="text-cream/50 hover:text-cream"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-cream/80 w-5 text-center">{i.quantity}</span>
                    <button
                      type="button"
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