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
    description: "Acompanhe os pedidos combinados com as clientes e atualize o status de cada um.",
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
    <div className="min-h-screen bg-forest-950 text-cream">
      <header className="border-b border-gold-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl">Painel JW Joalheria</h1>
          <p className="text-cream/50 text-sm">Logada como {admin?.name || admin?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm border border-gold-500/30 hover:border-gold-400 rounded-full px-4 py-2 text-cream/80 transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para home
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm border border-gold-500/30 hover:border-gold-400 rounded-full px-4 py-2 text-cream/80"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 px-6 pt-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-body border transition-colors ${
              tab === t.key
                ? "bg-gold-500 border-gold-500 text-forest-950"
                : "border-gold-500/30 text-cream/70 hover:border-gold-400"
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </nav>

      <main className="px-6 py-8">
        {activeTab && (
          <p className="text-cream/50 text-sm mb-6 max-w-2xl">{activeTab.description}</p>
        )}
        {tab === "estoque" && <AdminEstoque />}
        {tab === "pedidos" && <AdminPedidos />}
        {tab === "avaliacoes" && <AdminAvaliacoes />}
        {tab === "anuncios" && <AdminAnuncios />}
      </main>
    </div>
  );
}
