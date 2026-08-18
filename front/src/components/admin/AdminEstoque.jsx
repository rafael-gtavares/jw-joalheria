import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Gem,
  ImagePlus,
  Star,
  StarOff,
  X,
  Pencil,
  Trash2,
  Search,
  PackagePlus,
  PackageCheck,
  AlertTriangle,
  Loader2,
  Save,
  XCircle,
} from "lucide-react";
import { api } from "../../lib/api";

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  category: "Anéis",
  material: "Prata 925",
  price: "",
  stock: "",
  featured: false,
  images: [],
};

const CATEGORIES = ["Anéis", "Brincos", "Colares", "Pulseiras", "Broches"];

export default function AdminEstoque() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const fileInputRef = useRef(null);
  const formTopRef = useRef(null);

  function load() {
    api.getAllProducts().then(setProducts).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (form.images.length + files.length > 6) {
      setError("Máximo de 6 fotos por peça.");
      e.target.value = "";
      return;
    }
    setError("");
    setUploading(true);
    try {
      const { urls } = await api.uploadImages(files);
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(idx) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  function makeCover(idx) {
    setForm((f) => {
      const images = [...f.images];
      const [chosen] = images.splice(idx, 1);
      images.unshift(chosen);
      return { ...f, images };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        price: Number(form.price),
        stock: Number(form.stock),
      };
      if (editingId) {
        await api.updateProduct(editingId, payload);
      } else {
        await api.createProduct(payload);
      }
      setForm(EMPTY);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function editProduct(p) {
    setEditingId(p._id);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      category: p.category,
      material: p.material || "",
      price: p.price,
      stock: p.stock,
      featured: p.featured,
      images: p.images || [],
    });
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  async function removeProduct(id) {
    if (!confirm("Remover essa peça do estoque? Essa ação não pode ser desfeita.")) return;
    await api.deleteProduct(id);
    if (editingId === id) cancelEdit();
    load();
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "Todas" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  return (
    <div className="grid lg:grid-cols-[1.1fr_1.5fr] gap-8">
      <form
        ref={formTopRef}
        onSubmit={handleSubmit}
        className="bg-forest-900 border border-gold-500/20 rounded-2xl p-6 h-fit shadow-lg shadow-black/10"
      >
        <div className="flex items-center gap-2 mb-5">
          <span className="bg-gold-500/15 text-gold-400 rounded-full p-2">
            {editingId ? <Pencil size={18} /> : <PackagePlus size={18} />}
          </span>
          <h2 className="font-display text-xl">
            {editingId ? "Editar peça" : "Nova peça"}
          </h2>
        </div>

        {error && (
          <p className="flex items-center gap-2 text-red-300 text-sm mb-3 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <AlertTriangle size={16} className="shrink-0" />
            {error}
          </p>
        )}

        {/* Fotos */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-cream/50 mb-2">
            <ImagePlus size={14} /> Fotos da peça (até 6)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {form.images.map((url, idx) => (
              <div
                key={url}
                className="relative aspect-square rounded-xl overflow-hidden border border-gold-500/20 bg-forest-950 group"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute top-1 left-1 bg-gold-500 text-forest-950 text-[10px] font-medium rounded-full px-2 py-0.5 flex items-center gap-1">
                    <Star size={10} fill="currentColor" /> Capa
                  </span>
                )}
                <div className="absolute inset-0 bg-forest-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {idx !== 0 && (
                    <button
                      type="button"
                      title="Definir como capa"
                      onClick={() => makeCover(idx)}
                      className="bg-forest-900 text-gold-400 rounded-full p-1.5 hover:bg-forest-800"
                    >
                      <StarOff size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Remover foto"
                    onClick={() => removeImage(idx)}
                    className="bg-forest-900 text-red-300 rounded-full p-1.5 hover:bg-forest-800"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}

            {form.images.length < 6 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-gold-500/30 hover:border-gold-400 flex flex-col items-center justify-center gap-1 text-cream/50 hover:text-gold-400 transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <ImagePlus size={20} />
                )}
                <span className="text-[11px]">{uploading ? "Enviando..." : "Adicionar"}</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            hidden
            onChange={handleFilesSelected}
          />
          <p className="text-cream/40 text-[11px] mt-1.5">
            A primeira foto é usada como capa no catálogo. Clique na estrela para trocar.
          </p>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Nome da peça"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            placeholder="Material"
            value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
            className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
          />
          <textarea
            placeholder="Descrição"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Preço (R$)"
              type="number"
              step="0.01"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
            />
            <input
              placeholder="Estoque"
              type="number"
              required
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-cream/70 bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="accent-gold-500"
            />
            <Star size={14} className="text-gold-400" />
            Destaque na home
          </label>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-forest-950 font-medium px-5 py-2.5 rounded-full text-sm transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {editingId ? "Salvar alterações" : "Adicionar peça"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="flex items-center gap-1.5 text-sm text-cream/60 hover:text-cream px-4 py-2.5"
            >
              <XCircle size={16} />
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/40" />
            <input
              placeholder="Buscar peça pelo nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-forest-900 border border-gold-500/20 rounded-full pl-9 pr-4 py-2.5 text-sm focus:border-gold-400 outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-forest-900 border border-gold-500/20 rounded-full px-4 py-2.5 text-sm focus:border-gold-400 outline-none"
          >
            <option>Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p._id}
              className={`bg-forest-900 border rounded-2xl overflow-hidden flex gap-3 p-3 transition-colors ${
                editingId === p._id ? "border-gold-400" : "border-gold-500/20"
              }`}
            >
              <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-forest-800 flex items-center justify-center">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Gem size={22} className="text-gold-500/40" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-cream text-sm font-medium truncate">{p.name}</p>
                    <p className="text-cream/50 text-xs">{p.category}</p>
                  </div>
                  {p.featured && (
                    <Star size={14} className="text-gold-400 shrink-0 mt-0.5" fill="currentColor" />
                  )}
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-gold-300 text-sm font-medium">
                    {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${
                      p.stock <= 3
                        ? "bg-red-500/10 text-red-300"
                        : "bg-green-500/10 text-green-300"
                    }`}
                  >
                    {p.stock <= 3 ? <AlertTriangle size={11} /> : <PackageCheck size={11} />}
                    {p.stock} em estoque
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => editProduct(p)}
                    className="flex items-center gap-1 text-gold-400 hover:text-gold-300 text-xs"
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  <button
                    onClick={() => removeProduct(p._id)}
                    className="flex items-center gap-1 text-red-300 hover:text-red-200 text-xs"
                  >
                    <Trash2 size={13} /> Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-forest-900 border border-gold-500/20 rounded-2xl py-14 text-center">
            <Gem size={26} className="mx-auto text-gold-500/40 mb-2" />
            <p className="text-cream/40 text-sm">
              {products.length === 0
                ? "Nenhuma peça cadastrada ainda."
                : "Nenhuma peça encontrada com esse filtro."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
