import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import friendlyAuthError from "../helpers/authErrors";
import { orderApi } from "../api/orderApi";
import { userApi } from "../api/userApi";
import {
  GENDER_OPTIONS,
  formatCurrency,
  shortOrderId,
  customerOrderLabel,
} from "../helpers/orderStatus";

export default function Profile() {
  const { user, role, logout, updateDisplayName, changePassword } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.displayName || "");
  const [nameStatus, setNameStatus] = useState("");
  const [nameError, setNameError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("nao_informado");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const isPasswordProvider = user?.providerData?.some((p) => p.providerId === "password");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    if (!user) return;
    userApi
      .me()
      .then((profile) => {
        setBirthDate(profile.birthDate || "");
        setGender(profile.gender || "nao_informado");
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    orderApi
      .listMine()
      .then(setOrders)
      .catch((err) => setOrdersError(err.message))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  async function handleSaveName(e) {
    e.preventDefault();
    setNameError("");
    setNameStatus("");
    setSavingName(true);
    try {
      await updateDisplayName(name);
      await userApi.updateMe({ birthDate, gender });
      setNameStatus("Dados atualizados.");
    } catch (err) {
      setNameError(friendlyAuthError(err));
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordStatus("");
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordStatus("Senha alterada com sucesso.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(friendlyAuthError(err));
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-forest-950 px-6 py-16">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center mb-4">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold-400 text-gold-300 font-display text-xl mb-3">
            {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
          </span>
          <h1 className="font-display text-2xl text-cream">Meu perfil</h1>
          {role === "admin" && (
            <p className="text-gold-400 text-xs uppercase tracking-wider mt-1">Administradora</p>
          )}
        </div>

        {/* Dados da conta */}
        <form
          onSubmit={handleSaveName}
          className="bg-forest-900 border border-gold-500/20 rounded-lg p-6"
        >
          <h2 className="font-display text-lg text-cream mb-4">Dados da conta</h2>

          {nameError && (
            <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded px-3 py-2 mb-4">
              {nameError}
            </p>
          )}
          {nameStatus && (
            <p className="bg-green-500/10 border border-green-500/30 text-green-300 text-sm rounded px-3 py-2 mb-4">
              {nameStatus}
            </p>
          )}

          <label className="block text-cream/70 text-xs uppercase tracking-wider mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-forest-950 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-4 py-2 text-cream mb-4"
          />

          <label className="block text-cream/70 text-xs uppercase tracking-wider mb-1">E-mail</label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="w-full bg-forest-950/60 border border-gold-500/10 outline-none rounded px-4 py-2 text-cream/50 mb-4 cursor-not-allowed"
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
            Informações voluntárias, usadas apenas para estatísticas da loja.
          </p>

          <button
            type="submit"
            disabled={savingName}
            className="bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-forest-950 font-medium px-6 py-2 rounded-full transition-colors"
          >
            {savingName ? "Salvando..." : "Salvar"}
          </button>
        </form>

        {/* Senha */}
        {isPasswordProvider ? (
          <form
            onSubmit={handleChangePassword}
            className="bg-forest-900 border border-gold-500/20 rounded-lg p-6"
          >
            <h2 className="font-display text-lg text-cream mb-1">Alterar senha</h2>
            <p className="text-cream/40 text-xs mb-4">
              Por segurança, confirme sua senha atual para definir uma nova.
            </p>

            {passwordError && (
              <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded px-3 py-2 mb-4">
                {passwordError}
              </p>
            )}
            {passwordStatus && (
              <p className="bg-green-500/10 border border-green-500/30 text-green-300 text-sm rounded px-3 py-2 mb-4">
                {passwordStatus}
              </p>
            )}

            <label className="block text-cream/70 text-xs uppercase tracking-wider mb-1">
              Senha atual
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-forest-950 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-4 py-2 text-cream mb-4"
            />

            <label className="block text-cream/70 text-xs uppercase tracking-wider mb-1">
              Nova senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-forest-950 border border-gold-500/20 focus:border-gold-400 outline-none rounded px-4 py-2 text-cream mb-6"
            />

            <button
              type="submit"
              disabled={savingPassword}
              className="bg-gold-500 hover:bg-gold-400 disabled:opacity-60 text-forest-950 font-medium px-6 py-2 rounded-full transition-colors"
            >
              {savingPassword ? "Alterando..." : "Alterar senha"}
            </button>
          </form>
        ) : (
          <div className="bg-forest-900 border border-gold-500/20 rounded-lg p-6">
            <h2 className="font-display text-lg text-cream mb-1">Senha</h2>
            <p className="text-cream/40 text-sm">
              Sua conta usa login com Google, então a senha é gerenciada pela sua conta Google.
            </p>
          </div>
        )}

        {/* Meus pedidos (resumo) */}
        <div className="bg-forest-900 border border-gold-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-cream">Meus pedidos</h2>
            {orders.length > 0 && (
              <Link to="/pedidos" className="text-gold-300 hover:text-gold-400 text-xs underline">
                Ver todos
              </Link>
            )}
          </div>

          {ordersLoading && <p className="text-cream/40 text-sm">Carregando...</p>}
          {ordersError && (
            <p className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded px-3 py-2">
              {ordersError}
            </p>
          )}
          {!ordersLoading && !ordersError && orders.length === 0 && (
            <p className="text-cream/40 text-sm">Você ainda não fez nenhum pedido.</p>
          )}

          <div className="space-y-2">
            {orders.slice(0, 3).map((order) => (
              <Link
                key={order._id}
                to={`/pedidos/${order._id}`}
                className="flex justify-between items-center gap-3 border border-gold-500/15 hover:border-gold-400 rounded-lg px-4 py-3 text-sm transition-colors"
              >
                <span>
                  <span className="block text-cream">Pedido #{shortOrderId(order._id)}</span>
                  <span className="block text-gold-300 text-xs uppercase tracking-wide">
                    {customerOrderLabel(order)}
                  </span>
                </span>
                <span className="text-cream/70">{formatCurrency(order.total)}</span>
              </Link>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full border border-gold-500/30 hover:border-gold-400 text-cream py-2.5 rounded-full transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}