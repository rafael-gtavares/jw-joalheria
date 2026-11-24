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
    <div className="bg-paper min-h-[calc(100vh-110px)] grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-accent">
        <img
          src="/products/brinco-gota-de-luz.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <p className="absolute bottom-12 left-12 right-12 font-display italic text-4xl text-paper leading-tight">
          Peças que eternizam momentos.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="mb-10">
            <p className="label mb-3">Leva menos de um minuto</p>
            <h1 className="heading">Criar conta</h1>
          </div>

          {error && <p className="field-error mb-6">{error}</p>}

          <label className="block label">Nome</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field mb-6"
          />

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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field mb-6"
          />

          <label className="block label">
            Data de nascimento <span className="normal-case tracking-normal">(opcional)</span>
          </label>
          <input
            type="date"
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthDate(e.target.value)}
            className="field mb-6"
          />

          <label className="block label">
            Sexo <span className="normal-case tracking-normal">(opcional)</span>
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="field mb-2"
          >
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          <p className="text-stone text-[11px] mb-8 leading-relaxed">
            Informações voluntárias, usadas apenas para estatísticas da loja. Você pode alterar depois no perfil.
          </p>

          <button type="submit" disabled={loading} className="btn w-full">
            {loading ? "Criando conta..." : "Cadastrar"}
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
            Já possui uma conta?{" "}
            <Link to="/login" className="text-ink border-b border-ink/40 hover:border-ink">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
