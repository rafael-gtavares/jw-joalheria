import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminAvaliacoes() {
  const [feedback, setFeedback] = useState([]);

  function load() {
    api.getAllFeedback().then(setFeedback);
  }

  useEffect(load, []);

  async function toggleApprove(f) {
    await api.approveFeedback(f._id, !f.approved);
    load();
  }

  async function remove(id) {
    if (!confirm("Remover essa avaliação?")) return;
    await api.deleteFeedback(id);
    load();
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {feedback.map((f) => (
        <div
          key={f._id}
          className="bg-forest-900 border border-gold-500/20 rounded-lg p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-display text-lg text-cream">{f.customerName}</p>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                f.approved
                  ? "border-green-400/40 text-green-300"
                  : "border-yellow-400/40 text-yellow-300"
              }`}
            >
              {f.approved ? "Aprovada" : "Pendente"}
            </span>
          </div>
          <p className="text-gold-400 text-sm mb-2">
            {"★".repeat(f.rating)}
            {"☆".repeat(5 - f.rating)}
          </p>
          <p className="text-cream/70 text-sm mb-4">{f.message}</p>
          <div className="flex gap-3 text-xs">
            <button onClick={() => toggleApprove(f)} className="text-gold-400">
              {f.approved ? "Ocultar do site" : "Aprovar e mostrar"}
            </button>
            <button onClick={() => remove(f._id)} className="text-red-300">
              Remover
            </button>
          </div>
        </div>
      ))}
      {feedback.length === 0 && (
        <p className="text-cream/40 text-sm py-10 col-span-2 text-center">
          Nenhuma avaliação recebida ainda.
        </p>
      )}
    </div>
  );
}
