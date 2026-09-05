import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import friendlyAuthError from "../helpers/authErrors";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, remember);
      navigate(redirectTo);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle(remember);
      navigate(redirectTo);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-forest-950 flex items-center justify-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="bg-forest-900 border border-gold-500/20 rounded-lg p-8 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold-400 text-gold-300 font-display text-xl mb-3">
            JW
          </span>
          <h1 className="font-display text-2xl text-cream">Entrar</h1>
          <p className="text-cream/50 text-sm mt-1">Acesse sua conta</p>
        </div>

        {error && (
          <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <label className="block text-cream/70 text-xs uppercase tracking-wider mb-1">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-forest-950 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-4 py-2 text-cream mb-4"
        />

        <label className="block text-cream/70 text-xs uppercase tracking-wider mb-1">Senha</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-forest-950 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-4 py-2 text-cream mb-4"
        />

        <label className="flex items-center gap-2 text-cream/60 text-sm mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-gold-500 w-4 h-4"
          />
          Lembrar de mim por 30 dias
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-forest-950 font-body font-medium py-2.5 rounded-full transition-colors"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-cream/50 text-sm text-center mt-5">
          Não possui uma conta?{" "}
          <Link to="/cadastro" className="text-gold-400 hover:text-gold-300">
            Cadastre-se
          </Link>
        </p>

        <div className="flex items-center gap-3 my-5">
          <span className="h-px flex-1 bg-gold-500/15" />
          <span className="text-cream/30 text-xs uppercase tracking-wider">ou</span>
          <span className="h-px flex-1 bg-gold-500/15" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2 border border-gold-500/30 hover:border-gold-400 disabled:opacity-60 text-cream py-2.5 rounded-full transition-colors"
        >
          {googleLoading ? "Conectando..." : "Continuar com Google"}
        </button>
      </form>
    </div>
  );
}