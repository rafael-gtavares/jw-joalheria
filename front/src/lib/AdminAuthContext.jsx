import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("jw_admin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getProducts({}) // no-op warmup not needed; just validate token below
      .catch(() => {});
    setLoading(false);
    const stored = localStorage.getItem("jw_admin_info");
    if (stored) setAdmin(JSON.parse(stored));
  }, []);

  async function login(email, password) {
    const { token, admin } = await api.login({ email, password });
    localStorage.setItem("jw_admin_token", token);
    localStorage.setItem("jw_admin_info", JSON.stringify(admin));
    setAdmin(admin);
  }

  function logout() {
    localStorage.removeItem("jw_admin_token");
    localStorage.removeItem("jw_admin_info");
    setAdmin(null);
  }

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
