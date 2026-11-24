import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Gem, Package, MessageSquareQuote, Megaphone, LogOut, ArrowLeft } from "lucide-react";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import AdminEstoque from "../components/admin/AdminEstoque";
import AdminPedidos from "../components/admin/AdminPedidos";
import AdminAvaliacoes from "../components/admin/AdminAvaliacoes";
import AdminAnuncios from "../components/admin/AdminAnuncios";

const TABS = [
  {
    key: "estoque",
    label: "Estoque",
    icon: Gem,
    description: "Cadastre as peças que aparecem no catálogo: fotos, preço, material e quantidade disponível.",
  },
  {
    key: "pedidos",
    label: "Pedidos",
    icon: Package,
    description: "Acompanhe os pedidos do site e registre vendas feitas fora dele, atualizando o status de cada um.",
  },
  {
    key: "avaliacoes",
    label: "Avaliações",
    icon: MessageSquareQuote,
    description: "Cadastre os depoimentos das clientes (com foto, se tiver) e escolha quais aparecem no site.",
  },
  {
    key: "anuncios",
    label: "Anúncios",
    icon: Megaphone,
    description: "Publique novidades e avisos para as clientes e escolha até 6 para aparecer na Home.",
  },
];

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const [tab, setTab] = useState("estoque");
  const activeTab = TABS.find((t) => t.key === tab);

  return (
    <div className="theme-admin min-h-screen bg-forest-950 text-cream">
      <header className="bg-white border-b border-line px-5 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <img src="/jw-logo.png" alt="JW" className="h-10 w-auto mix-blend-multiply" />
          <div>
            <h1 className="font-display text-2xl leading-none">Painel JW</h1>
            <p className="text-stone text-xs mt-1">Logada como {admin?.name || admin?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.2em]">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-stone hover:text-ink transition-colors"
          >
            <ArrowLeft size={14} /> Ver loja
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-stone hover:text-ink transition-colors"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-x-8 gap-y-2 px-5 md:px-8 pt-6 border-b border-line bg-white">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 pb-3 text-[11px] uppercase tracking-[0.2em] border-b-2 transition-colors ${
              tab === t.key
                ? "border-ink text-ink"
                : "border-transparent text-stone hover:text-ink"
            }`}
          >
            <t.icon size={15} strokeWidth={1.5} />
            {t.label}
          </button>
        ))}
      </nav>

      <main className="px-5 md:px-8 py-8">
        {activeTab && (
          <p className="text-stone text-sm mb-6 max-w-2xl">{activeTab.description}</p>
        )}
        {tab === "estoque" && <AdminEstoque />}
        {tab === "pedidos" && <AdminPedidos />}
        {tab === "avaliacoes" && <AdminAvaliacoes />}
        {tab === "anuncios" && <AdminAnuncios />}
      </main>
    </div>
  );
}
