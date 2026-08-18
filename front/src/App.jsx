import React from "react";
import { Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./lib/AdminAuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppFab from "./components/WhatsAppFab";
import RequireAdmin from "./components/RequireAdmin";
import ScrollManager from "./components/ScrollManager";

import Home from "./pages/Home";
import Joias from "./pages/Joias";
import JoiaDetalhe from "./pages/JoiaDetalhe";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function SiteLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <WhatsAppFab />
    </>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
        <Route path="/joias" element={<SiteLayout><Joias /></SiteLayout>} />
        <Route path="/joias/:slug" element={<SiteLayout><JoiaDetalhe /></SiteLayout>} />

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
    </AdminAuthProvider>
  );
}
