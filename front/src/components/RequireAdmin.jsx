import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RequireAdmin({ children }) {
  const { user, role, loading } = useAuth();

  if (loading) return null;

  // Não está logado → login administrativo
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Está logado, mas não é admin → login administrativo
  if (role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}