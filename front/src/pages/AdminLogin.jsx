import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../lib/AdminAuthContext";

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-forest-950 flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="bg-forest-900 border border-gold-500/20 rounded-lg p-8 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold-400 text-gold-300 font-display text-xl mb-3">
            JW
          </span>
          <h1 className="font-display text-2xl text-cream">Painel Administrativo</h1>
          <p className="text-cream/50 text-sm mt-1">Acesso restrito</p>
        </div>

        {error && (
          <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <label className="block text-cream/70 text-xs uppercase tracking-wider mb-1">
          E-mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-forest-950 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-4 py-2 text-cream mb-4"
        />

        <label className="block text-cream/70 text-xs uppercase tracking-wider mb-1">
          Senha
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-forest-950 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-4 py-2 text-cream mb-6"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-forest-950 font-body font-medium py-2.5 rounded-full transition-colors"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
