import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
  onIdTokenChanged,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { userApi } from "../api/userApi";

const AuthContext = createContext(null);

// Chave usada apenas para controlar a expiração do "lembrar de mim por 30
// dias" — o Firebase Web SDK não tem um "expiresIn" configurável no client
// como existe no Admin SDK para cookies de sessão; a forma correta no client
// é escolher a persistência (local x sessão) e, para simular o teto de 30
// dias, guardar quando o login aconteceu e encerrar a sessão se esse prazo
// passar.
const REMEMBER_KEY = "jw_auth_remember_since";
const REMEMBER_DAYS = 30;

function isRememberedSessionExpired() {
  const since = Number(localStorage.getItem(REMEMBER_KEY));
  if (!since) return false;
  const elapsedDays = (Date.now() - since) / (1000 * 60 * 60 * 24);
  return elapsedDays > REMEMBER_DAYS;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isRememberedSessionExpired()) {
      localStorage.removeItem(REMEMBER_KEY);
      signOut(auth).catch(() => {});
    }

    // onIdTokenChanged (em vez de onAuthStateChanged) garante que já temos o
    // token mais recente disponível para ler a Custom Claim de role.
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setRole(null);
        setLoading(false);
        return;
      }
      try {
        const tokenResult = await firebaseUser.getIdTokenResult();
        setRole(tokenResult.claims.role === "admin" ? "admin" : "user");
      } catch {
        setRole("user");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function applyPersistence(remember) {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, String(Date.now()));
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }

  async function login(email, password, remember = false) {
    await applyPersistence(remember);
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle(remember = false) {
    await applyPersistence(remember);
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // Conta via Google nunca recebe privilégio de admin aqui — a role só
    // muda através da Custom Claim aplicada manualmente (setAdminClaim.js).
    await userApi.sync({
      name: result.user.displayName || "",
      provider: "google.com",
    });
    return result.user;
  }

  // extra: { birthDate, gender } — opcionais, usados só para estatísticas da loja.
  async function register(name, email, password, extra = {}) {
    await applyPersistence(false);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(credential.user, { displayName: name });
    }
    // Cadastro público sempre cria role "user" — o backend ignora qualquer
    // role vinda do cliente e usa a Custom Claim (inexistente = "user").
    await userApi.sync({ name, provider: "password", ...extra });
    return credential.user;
  }

  function logout() {
    localStorage.removeItem(REMEMBER_KEY);
    return signOut(auth);
  }

  async function getToken() {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }

  async function updateDisplayName(name) {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName: name });
    await userApi.updateMe({ name });
    setUser({ ...auth.currentUser });
  }

  async function changePassword(currentPassword, newPassword) {
    if (!auth.currentUser?.email) return;
    // O Firebase exige reautenticação recente para trocar a senha.
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  }

  const value = {
    user,
    admin: user, // alias mantido por compatibilidade com AdminDashboard.jsx/AdminLogin.jsx
    role,
    isAdmin: role === "admin",
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    getToken,
    updateDisplayName,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}