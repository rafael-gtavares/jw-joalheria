import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "../lib/AdminAuthContext";
import AdminEstoque from "../components/admin/AdminEstoque";
import AdminPedidos from "../components/admin/AdminPedidos";
import AdminAvaliacoes from "../components/admin/AdminAvaliacoes";

const TABS = [
  { key: "estoque", label: "Estoque" },
  { key: "pedidos", label: "Pedidos" },
  { key: "avaliacoes", label: "Avaliações" },
];

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const [tab, setTab] = useState("estoque");

  return (
    <div className="min-h-screen bg-forest-950 text-cream">
      <header className="border-b border-gold-500/20 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Painel JW Joalheria</h1>
          <p className="text-cream/50 text-sm">Logada como {admin?.name || admin?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm border border-gold-500/30 hover:border-gold-400 rounded-full px-4 py-2 text-cream/80 transition-colors"
          >
            ← Voltar para home
          </Link>
          <button
            onClick={logout}
            className="text-sm border border-gold-500/30 hover:border-gold-400 rounded-full px-4 py-2 text-cream/80"
          >
            Sair
          </button>
        </div>
      </header>

      <nav className="flex gap-2 px-6 pt-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-full text-sm font-body border transition-colors ${
              tab === t.key
                ? "bg-gold-500 border-gold-500 text-forest-950"
                : "border-gold-500/30 text-cream/70 hover:border-gold-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="px-6 py-8">
        {tab === "estoque" && <AdminEstoque />}
        {tab === "pedidos" && <AdminPedidos />}
        {tab === "avaliacoes" && <AdminAvaliacoes />}
      </main>
    </div>
  );
}
