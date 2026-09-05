import React from "react";
import { Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { CartProvider } from "./contexts/CartContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppFab from "./components/WhatsAppFab";
import CartDrawer from "./components/cart/CartDrawer";
import RequireAdmin from "./components/RequireAdmin";
import ScrollManager from "./components/ScrollManager";

import Home from "./pages/Home";
import Joias from "./pages/Joias";
import JoiaDetalhe from "./pages/JoiaDetalhe";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import { AuthProvider } from "./contexts/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

import AuthPromptModal from "./components/auth/AuthPromptModal";
import { useCart } from "./contexts/CartContext";

function SiteLayout({ children }) {
  const { authPromptOpen, setAuthPromptOpen } = useCart();

  return (
    <>
      <Header />
      {children}
      <Footer />
      <WhatsAppFab />
      <CartDrawer />
      <AuthPromptModal
        open={authPromptOpen}
        onClose={() => setAuthPromptOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollManager />
        <Routes>
          <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
          <Route path="/joias" element={<SiteLayout><Joias /></SiteLayout>} />
          <Route path="/joias/:slug" element={<SiteLayout><JoiaDetalhe /></SiteLayout>} />

          <Route path="/login" element={<SiteLayout><Login /></SiteLayout>} />
          <Route path="/cadastro" element={<SiteLayout><Register /></SiteLayout>} />
          <Route path="/perfil" element={<SiteLayout><Profile /></SiteLayout>} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
