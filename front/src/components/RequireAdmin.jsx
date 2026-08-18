import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../lib/AdminAuthContext";

export default function RequireAdmin({ children }) {
  const { admin, loading } = useAdminAuth();

  if (loading) return null;
  if (!admin) return <Navigate to="/admin/login" replace />;

  return children;
}
