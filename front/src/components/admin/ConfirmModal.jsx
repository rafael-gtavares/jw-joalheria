import React from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

/**
 * Modal de confirmação genérico (uso principal: confirmar exclusão).
 *
 * Uso:
 * const [confirm, setConfirm] = useState(null); // guarda o item/id a remover
 *
 * <button onClick={() => setConfirm(item)}>Remover</button>
 *
 * {confirm && (
 *   <ConfirmModal
 *     title="Remover peça?"
 *     description={`Tem certeza que quer remover "${confirm.name}"? Essa ação não pode ser desfeita.`}
 *     confirmLabel="Remover"
 *     loading={deleting}
 *     onCancel={() => setConfirm(null)}
 *     onConfirm={async () => {
 *       setDeleting(true);
 *       await productApi.remove(confirm._id);
 *       setDeleting(false);
 *       setConfirm(null);
 *       load();
 *     }}
 *   />
 * )}
 */
export default function ConfirmModal({
  title = "Tem certeza?",
  description = "Essa ação não pode ser desfeita.",
  confirmLabel = "Remover",
  cancelLabel = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 bg-forest-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-forest-900 border border-gold-500/20 rounded-2xl max-w-sm w-full p-6 relative shadow-lg shadow-black/20"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 text-cream/50 hover:text-cream"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center gap-3">
          <span className="bg-red-500/10 text-red-300 rounded-full p-3">
            <AlertTriangle size={22} />
          </span>
          <h3 className="font-display text-lg text-cream">{title}</h3>
          <p className="text-cream/60 text-sm">{description}</p>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 text-sm text-cream/70 hover:text-cream border border-gold-500/20 rounded-full px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500/90 hover:bg-red-500 disabled:opacity-60 text-white font-medium px-4 py-2.5 rounded-full text-sm transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}