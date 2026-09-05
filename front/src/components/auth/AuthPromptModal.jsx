import React from "react";
import { useNavigate } from "react-router-dom";
import { X, LogIn, UserPlus } from "lucide-react";

// Exibido quando um visitante não autenticado tenta adicionar um produto ao
// carrinho. Segue o mesmo padrão visual do CartDrawer (overlay + painel).
// Pronto para ser reaproveitado futuramente ao proteger checkout/pagamento.
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
        className="fixed inset-0 bg-forest-950/70 backdrop-blur-sm z-[60] transition-opacity duration-300"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Entrar para continuar"
        className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      >
        <div className="relative bg-forest-900 border border-gold-500/20 rounded-lg p-8 w-full max-w-sm text-center">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 text-cream/50 hover:text-cream transition-colors"
          >
            <X size={20} />
          </button>

          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold-400 text-gold-300 font-display text-xl mb-4">
            JW
          </span>

          <h2 className="font-display text-xl text-cream mb-2">Entre para continuar</h2>
          <p className="text-cream/50 text-sm mb-6">
            Você precisa estar logada(o) para adicionar peças ao carrinho.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => goTo("/login")}
              className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-forest-950 font-medium py-2.5 rounded-full transition-colors"
            >
              <LogIn size={16} /> Entrar
            </button>
            <button
              onClick={() => goTo("/cadastro")}
              className="w-full flex items-center justify-center gap-2 border border-gold-500/30 hover:border-gold-400 text-cream py-2.5 rounded-full transition-colors"
            >
              <UserPlus size={16} /> Cadastre-se
            </button>
          </div>
        </div>
      </div>
    </>
  );
}