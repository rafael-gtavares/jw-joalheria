import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import friendlyAuthError from "../helpers/authErrors";
import { GENDER_OPTIONS } from "../helpers/orderStatus";

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("nao_informado");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, {
        ...(birthDate ? { birthDate } : {}),
        gender,
      });
      navigate("/");
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
      await loginWithGoogle(false);
      navigate("/");
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
          <h1 className="font-display text-2xl text-cream">Criar conta</h1>
          <p className="text-cream/50 text-sm mt-1">Leva menos de um minuto</p>
        </div>

        {error && (
          <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <label className="block text-cream/70 text-xs uppercase tracking-wider mb-1">Nome</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-forest-950 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-4 py-2 text-cream mb-4"
        />

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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-forest-950 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-4 py-2 text-cream mb-4"
        />

        <label className="block text-cream/70 text-xs uppercase tracking-wider mb-1">
          Data de nascimento <span className="normal-case text-cream/40">(opcional)</span>
        </label>
        <input
          type="date"
          value={birthDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full bg-forest-950 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-4 py-2 text-cream mb-4"
        />

        <label className="block text-cream/70 text-xs uppercase tracking-wider mb-1">
          Sexo <span className="normal-case text-cream/40">(opcional)</span>
        </label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full bg-forest-950 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-4 py-2 text-cream mb-2"
        >
          {GENDER_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
        <p className="text-cream/40 text-[11px] mb-6">
          Informações voluntárias, usadas apenas para estatísticas da loja. Você pode alterar depois no perfil.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-forest-950 font-body font-medium py-2.5 rounded-full transition-colors"
        >
          {loading ? "Criando conta..." : "Cadastrar"}
        </button>

        <p className="text-cream/50 text-sm text-center mt-5">
          Já possui uma conta?{" "}
          <Link to="/login" className="text-gold-400 hover:text-gold-300">
            Entrar
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