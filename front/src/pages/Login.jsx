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
    <div className="bg-paper min-h-[calc(100vh-110px)] grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-accent">
        <img
          src="/products/anel-ondas-do-mar.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <p className="absolute bottom-12 left-12 right-12 font-display italic text-4xl text-paper leading-tight">
          Joias autorais, feitas para durar.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="mb-10">
            <p className="label mb-3">Minha conta</p>
            <h1 className="heading">Entrar</h1>
          </div>

          {error && <p className="field-error mb-6">{error}</p>}

          <label className="block label">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field mb-6"
          />

          <label className="block label">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field mb-6"
          />

          <label className="flex items-center gap-2 text-stone text-sm mb-8 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-accent w-4 h-4"
            />
            Lembrar de mim por 30 dias
          </label>

          <button type="submit" disabled={loading} className="btn w-full">
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="flex items-center gap-3 my-6">
            <span className="h-px flex-1 bg-line" />
            <span className="label">ou</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="btn-ghost w-full"
          >
            {googleLoading ? "Conectando..." : "Continuar com Google"}
          </button>

          <p className="text-stone text-sm text-center mt-8">
            Não possui uma conta?{" "}
            <Link to="/cadastro" className="text-ink border-b border-ink/40 hover:border-ink">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
