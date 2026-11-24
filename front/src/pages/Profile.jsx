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
    <div className="min-h-[70vh] bg-paper px-5 py-14 md:py-20">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center mb-4">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-ink text-ink font-display text-xl mb-3">
            {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
          </span>
          <h1 className="heading !text-3xl md:!text-4xl">Meu perfil</h1>
          {role === "admin" && (
            <p className="text-ink text-xs uppercase tracking-wider mt-1">Administradora</p>
          )}
        </div>

        {/* Dados da conta */}
        <form
          onSubmit={handleSaveName}
          className="bg-white border border-line p-6"
        >
          <h2 className="font-display text-lg text-ink mb-4">Dados da conta</h2>

          {nameError && (
            <p className="field-error mb-4">
              {nameError}
            </p>
          )}
          {nameStatus && (
            <p className="text-sm text-green-800 bg-green-50 border border-green-200 px-4 py-3 mb-4">
              {nameStatus}
            </p>
          )}

          <label className="block label">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field mb-4"
          />

          <label className="block label">E-mail</label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="field text-stone cursor-not-allowed mb-6"
          />

          <label className="block label">
            Data de nascimento <span className="normal-case tracking-normal">(opcional)</span>
          </label>
          <input
            type="date"
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthDate(e.target.value)}
            className="field mb-4"
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
          <p className="text-stone/70 text-[11px] mb-6">
            Informações voluntárias, usadas apenas para estatísticas da loja.
          </p>

          <button
            type="submit"
            disabled={savingName}
            className="btn"
          >
            {savingName ? "Salvando..." : "Salvar"}
          </button>
        </form>

        {/* Senha */}
        {isPasswordProvider ? (
          <form
            onSubmit={handleChangePassword}
            className="bg-white border border-line p-6"
          >
            <h2 className="font-display text-lg text-ink mb-1">Alterar senha</h2>
            <p className="text-stone/70 text-xs mb-4">
              Por segurança, confirme sua senha atual para definir uma nova.
            </p>

            {passwordError && (
              <p className="field-error mb-4">
                {passwordError}
              </p>
            )}
            {passwordStatus && (
              <p className="text-sm text-green-800 bg-green-50 border border-green-200 px-4 py-3 mb-4">
                {passwordStatus}
              </p>
            )}

            <label className="block label">
              Senha atual
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="field mb-4"
            />

            <label className="block label">
              Nova senha
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="field mb-6"
            />

            <button
              type="submit"
              disabled={savingPassword}
              className="btn"
            >
              {savingPassword ? "Alterando..." : "Alterar senha"}
            </button>
          </form>
        ) : (
          <div className="bg-white border border-line p-6">
            <h2 className="font-display text-lg text-ink mb-1">Senha</h2>
            <p className="text-stone/70 text-sm">
              Sua conta usa login com Google, então a senha é gerenciada pela sua conta Google.
            </p>
          </div>
        )}

        {/* Meus pedidos (resumo) */}
        <div className="bg-white border border-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink">Meus pedidos</h2>
            {orders.length > 0 && (
              <Link to="/pedidos" className="text-ink hover:text-stone text-xs underline">
                Ver todos
              </Link>
            )}
          </div>

          {ordersLoading && <p className="text-stone/70 text-sm">Carregando...</p>}
          {ordersError && (
            <p className="field-error">
              {ordersError}
            </p>
          )}
          {!ordersLoading && !ordersError && orders.length === 0 && (
            <p className="text-stone/70 text-sm">Você ainda não fez nenhum pedido.</p>
          )}

          <div className="space-y-2">
            {orders.slice(0, 3).map((order) => (
              <Link
                key={order._id}
                to={`/pedidos/${order._id}`}
                className="flex justify-between items-center gap-3 border border-line hover:border-ink px-4 py-3 text-sm transition-colors"
              >
                <span>
                  <span className="block text-ink">Pedido #{shortOrderId(order._id)}</span>
                  <span className="block text-ink text-xs uppercase tracking-wide">
                    {customerOrderLabel(order)}
                  </span>
                </span>
                <span className="text-ink/80">{formatCurrency(order.total)}</span>
              </Link>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-ghost w-full"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}