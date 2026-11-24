import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../contexts/AdminAuthContext";

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
      setError("E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <img src="/jw-logo.png" alt="JW" className="h-14 w-auto mx-auto mb-6 mix-blend-multiply" />
          <p className="label mb-3">Acesso restrito</p>
          <h1 className="heading !text-4xl">Painel administrativo</h1>
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
          className="field mb-8"
        />

        <button type="submit" disabled={loading} className="btn w-full">
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-stone text-[11px] text-center mt-6 leading-relaxed">
          Acesso via Firebase Authentication. O usuário deve ser criado no
          Console do Firebase.
        </p>
      </form>
    </div>
  );
}
