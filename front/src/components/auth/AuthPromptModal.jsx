import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

// Exibido quando um visitante não autenticado tenta adicionar um produto ao
// carrinho (ou ir para o pagamento).
export default function AuthPromptModal({ open, onClose }) {
  const navigate = useNavigate();

  if (!open) return null;

  function goTo(path) {
    onClose();
    navigate(path);
  }

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-[60] animate-fadeIn"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Entrar para continuar"
        className="fixed inset-0 z-[60] flex items-center justify-center px-6 pointer-events-none"
      >
        <div className="relative bg-paper border border-line p-10 w-full max-w-sm text-center animate-fadeUp pointer-events-auto">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 p-2 text-stone hover:text-ink transition-colors"
          >
            <X size={20} strokeWidth={1.25} />
          </button>

          <img src="/jw-logo.png" alt="JW" className="h-12 w-auto mx-auto mb-5 mix-blend-multiply" />

          <h2 className="font-display text-3xl text-ink mb-2">Entre para continuar</h2>
          <p className="text-stone text-sm mb-8 leading-relaxed">
            Você precisa estar logada(o) para adicionar peças ao carrinho.
          </p>

          <div className="space-y-3">
            <button onClick={() => goTo("/login")} className="btn w-full">
              Entrar
            </button>
            <button onClick={() => goTo("/cadastro")} className="btn-ghost w-full">
              Cadastre-se
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
