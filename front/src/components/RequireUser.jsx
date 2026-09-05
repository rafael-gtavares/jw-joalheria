import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Protege rotas que exigem qualquer usuário autenticado (comum ou admin).
// Pronto para uso futuro em telas de checkout, pedidos, pagamento, etc.
export default function RequireUser({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}