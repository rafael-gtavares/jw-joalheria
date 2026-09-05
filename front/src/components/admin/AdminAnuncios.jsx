import React, { useEffect, useRef, useState } from "react";
import {
  Megaphone,
  ImagePlus,
  X,
  Pencil,
  Trash2,
  Home,
  AlertTriangle,
  Loader2,
  Save,
  XCircle,
} from "lucide-react";
import { announcementApi } from "../../api/announcementApi";
import { uploadApi } from "../../api/uploadApi";
import ConfirmModal from "./ConfirmModal";

const MAX_FEATURED = 6; // Home mostra no máx. 6 anúncios destacados

const EMPTY = {
  title: "",
  content: "",
  featuredHome: false,
  image: null, // { url, publicId } | null
};

export default function AdminAnuncios() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toRemove, setToRemove] = useState(null); // anúncio pendente de confirmação
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef(null);
  const formTopRef = useRef(null);

  function load() {
    announcementApi.listAllAdmin().then(setAnnouncements).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { images } = await uploadApi.images([file], "announcements");
      setForm((f) => ({ ...f, image: images[0] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage() {
    setForm((f) => ({ ...f, image: null }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        featuredHome: form.featuredHome,
        image: form.image || { url: "", publicId: "" },
      };
      if (editingId) {
        await announcementApi.update(editingId, payload);
      } else {
        await announcementApi.create(payload);
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

  function editAnnouncement(a) {
    setEditingId(a._id);
    setForm({
      title: a.title,
      content: a.content,
      featuredHome: a.featuredHome,
      image: a.image?.url ? a.image : null,
    });
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  async function confirmRemoveAnnouncement() {
    if (!toRemove) return;
    setRemoving(true);
    try {
      await announcementApi.remove(toRemove._id);
      if (editingId === toRemove._id) cancelEdit();
      load();
      setToRemove(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRemoving(false);
    }
  }

  const featuredCount = announcements.filter((a) => a.featuredHome).length;

  async function toggleFeatured(a) {
    if (!a.featuredHome && featuredCount >= MAX_FEATURED) {
      setError(
        `Você já tem ${MAX_FEATURED} anúncios destacados na Home (o máximo). Remova o destaque de algum antes de adicionar outro.`
      );
      return;
    }
    setError("");
    try {
      await announcementApi.update(a._id, { featuredHome: !a.featuredHome });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1.1fr_1.5fr] gap-8">
      {/* FORMULÁRIO */}
      <form
        ref={formTopRef}
        onSubmit={handleSubmit}
        className="bg-forest-900 border border-gold-500/20 rounded-2xl p-6 h-fit shadow-lg shadow-black/10"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-gold-500/15 text-gold-400 rounded-full p-2">
            {editingId ? <Pencil size={18} /> : <Megaphone size={18} />}
          </span>
          <h2 className="font-display text-xl">
            {editingId ? "Editar anúncio" : "Novo anúncio"}
          </h2>
        </div>
        <p className="text-cream/40 text-xs mb-5 ml-11">
          Cadastre aqui novidades ou avisos para destacar às clientes.
        </p>

        {error && (
          <p className="flex items-center gap-2 text-red-300 text-sm mb-3 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <AlertTriangle size={16} className="shrink-0" />
            {error}
          </p>
        )}

        {/* Imagem (máx. 1) */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-cream/50 mb-2">
            <ImagePlus size={14} /> Imagem do anúncio (no máx. 1)
          </label>

          {form.image?.url ? (
            <div className="relative w-24 aspect-square rounded-xl overflow-hidden border border-gold-500/20 bg-forest-950 group">
              <img src={form.image.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-forest-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  title="Remover imagem"
                  onClick={removeImage}
                  className="bg-forest-900 text-red-300 rounded-full p-1.5 hover:bg-forest-800"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-24 aspect-square rounded-xl border-2 border-dashed border-gold-500/30 hover:border-gold-400 flex flex-col items-center justify-center gap-1 text-cream/50 hover:text-gold-400 transition-colors disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ImagePlus size={20} />
              )}
              <span className="text-[11px]">{uploading ? "Enviando..." : "Adicionar"}</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={handleFileSelected}
          />
        </div>

        <div className="space-y-3">
          <input
            placeholder="Título do anúncio"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
          />

          <textarea
            placeholder="Texto/conteúdo do anúncio"
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 text-sm focus:border-gold-400 outline-none"
            rows={4}
          />

          <label
            className={`flex items-center gap-2 text-sm text-cream/70 bg-forest-950 border border-gold-500/20 rounded-xl px-3 py-2.5 cursor-pointer ${
              !form.featuredHome && featuredCount >= MAX_FEATURED && !editingId
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            <input
              type="checkbox"
              checked={form.featuredHome}
              disabled={!form.featuredHome && featuredCount >= MAX_FEATURED && !editingId}
              onChange={(e) => setForm({ ...form, featuredHome: e.target.checked })}
              className="accent-gold-500"
            />
            <Home size={14} className="text-gold-400" />
            Destacar na Home (aparece no site)
          </label>
          <p className="text-cream/40 text-[11px] -mt-1.5">
            {featuredCount}/{MAX_FEATURED} anúncios destacados na Home
          </p>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-forest-950 font-medium px-5 py-2.5 rounded-full text-sm transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {editingId ? "Salvar alterações" : "Adicionar anúncio"}
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

      {/* LISTAGEM */}
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {announcements.map((a) => (
            <div
              key={a._id}
              className={`bg-forest-900 border rounded-2xl p-5 flex gap-4 transition-colors ${
                editingId === a._id ? "border-gold-400" : "border-gold-500/20"
              }`}
            >
              {a.image?.url ? (
                <img
                  src={a.image.url}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gold-500/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl shrink-0 bg-forest-800 flex items-center justify-center">
                  <Megaphone size={20} className="text-gold-500/40" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <p className="font-display text-lg text-cream truncate">{a.title}</p>
                  <span
                    className={`shrink-0 text-xs px-2 py-1 rounded-full border ${
                      a.featuredHome
                        ? "border-green-400/40 text-green-300"
                        : "border-cream/20 text-cream/40"
                    }`}
                  >
                    {a.featuredHome ? "No site" : "Oculto"}
                  </span>
                </div>
                <p className="text-cream/70 text-sm mb-4 line-clamp-3">{a.content}</p>

                <div className="flex flex-wrap gap-3 text-xs">
                  <button
                    onClick={() => editAnnouncement(a)}
                    className="flex items-center gap-1 text-gold-400 hover:text-gold-300"
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  <button
                    onClick={() => toggleFeatured(a)}
                    disabled={!a.featuredHome && featuredCount >= MAX_FEATURED}
                    title={
                      !a.featuredHome && featuredCount >= MAX_FEATURED
                        ? `Limite de ${MAX_FEATURED} destaques atingido`
                        : undefined
                    }
                    className={`flex items-center gap-1 ${
                      a.featuredHome ? "text-cream" : "text-cream/50"
                    } hover:text-cream disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <Home size={12} />
                    {a.featuredHome ? "Ocultar da Home" : "Destacar na Home"}
                  </button>
                  <button
                    onClick={() => setToRemove(a)}
                    className="flex items-center gap-1 text-red-300 hover:text-red-200"
                  >
                    <Trash2 size={13} /> Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {announcements.length === 0 && (
          <div className="bg-forest-900 border border-gold-500/20 rounded-2xl py-14 text-center">
            <Megaphone size={26} className="mx-auto text-gold-500/40 mb-2" />
            <p className="text-cream/40 text-sm">Nenhum anúncio cadastrado ainda.</p>
          </div>
        )}
      </div>

      {toRemove && (
        <ConfirmModal
          title="Remover anúncio?"
          description={`Tem certeza que quer remover "${toRemove.title}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Remover"
          loading={removing}
          onCancel={() => setToRemove(null)}
          onConfirm={confirmRemoveAnnouncement}
        />
      )}
    </div>
  );
}