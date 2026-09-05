import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingBag,
  Menu,
  X,
  User,
  LogIn,
  UserPlus,
  ShieldCheck,
} from "lucide-react";

import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

import { announcementApi } from "../api/announcementApi"

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const { totalItems, setOpen: setCartOpen } = useCart();
  const { user, role } = useAuth();

  const [hasAnnouncements, setHasAnnouncements] = useState(false);

  /* =========================
     SCROLL
  ========================= */

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }

    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* =========================
     MOBILE MENU SCROLL LOCK
  ========================= */

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* =========================
     NAVIGATION
  ========================= */

  useEffect(() => {
    async function checkAnnouncements() {
      try {
        const announcements = await announcementApi.listPublic();

        setHasAnnouncements(
          Array.isArray(announcements) && announcements.length > 0
        );
      } catch (error) {
        console.error("Erro ao verificar anúncios:", error);
        setHasAnnouncements(false);
      }
    }

    checkAnnouncements();
  }, []);

  const links = [
    { to: "/", label: "Início" },
    { to: "/joias", label: "Peças" },
    { to: "/#sobre", label: "Sobre" },
    ...(hasAnnouncements
      ? [{ to: "/#anuncios", label: "Anúncios" }]
      : []),
    { to: "/#contato", label: "Contato" },
  ];

  function handleNav(e, to) {
    e.preventDefault();
    setOpen(false);

    if (to === "/") {
      if (location.pathname === "/") {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        navigate("/");
      }

      return;
    }

    if (to.startsWith("/#")) {
      const id = to.replace("/#", "");

      if (location.pathname === "/") {
        const el = document.getElementById(id);

        if (el) {
          el.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      } else {
        navigate(to);
      }

      return;
    }

    navigate(to);
  }

  function handleMobileNavigate(path) {
    setOpen(false);
    navigate(path);
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <>
      {/* =================================
          HEADER
      ================================= */}

      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
          ? "bg-forest-950/95 backdrop-blur border-b border-gold-500/20"
          : "bg-cream/95 backdrop-blur border-b border-transparent"
          }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-8">

          {/* =========================
              LOGO
          ========================= */}

          <Link
            to="/"
            onClick={(e) => handleNav(e, "/")}
            className="flex items-center gap-3 group shrink-0"
          >
            <span
              className={`flex items-center justify-center w-11 h-11 rounded-full overflow-hidden border transition-all duration-300 ${scrolled
                ? "bg-cream/95 border-gold-500/30"
                : "bg-cream border-gold-500/20"
                }`}
            >
              <img
                src="/jw-logo.png"
                alt="Logo JW"
                className="w-8 h-8 object-contain"
              />
            </span>

            <span className="flex flex-col leading-tight">
              <span
                className={`font-display text-xl tracking-wide transition-colors duration-300 ${scrolled ? "text-cream" : "text-forest-950"
                  }`}
              >
                Janayna Waite
              </span>

              <span
                className={`text-[11px] uppercase tracking-[0.25em] transition-colors duration-300 ${scrolled ? "text-gold-400" : "text-gold-600"
                  }`}
              >
                Joalheria Autoral
              </span>
            </span>
          </Link>

          {/* =========================
              DESKTOP NAVIGATION
          ========================= */}

          <nav
            className={`hidden md:flex items-center justify-center gap-8 flex-1 font-body text-sm uppercase tracking-wider transition-colors duration-300 ${scrolled
              ? "text-cream/75"
              : "text-forest-950/70"
              }`}
          >
            {links.map((link) => (
              <a
                key={link.label}
                href={link.to}
                onClick={(e) => handleNav(e, link.to)}
                className={`cursor-pointer transition-colors duration-0 ${scrolled
                  ? "hover:text-white"
                  : "hover:text-forest-950"
                  }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* =========================
              RIGHT ACTIONS
          ========================= */}

          <div className="flex items-center gap-3 shrink-0">

            {/* CART */}

            <button
              onClick={() => setCartOpen(true)}
              aria-label="Abrir carrinho"
              className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${scrolled
                ? "text-cream/90 hover:text-white hover:bg-white/10"
                : "text-forest-950/80 hover:text-forest-950 hover:bg-forest-950/10"
                }`}
            >
              <ShoppingBag size={21} />

              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gold-500 text-forest-950 text-[10px] font-medium w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* =========================
                ADMIN - DESKTOP
            ========================= */}

            {role === "admin" && (
              <Link
                to="/admin"
                className={`hidden md:flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider border transition-all duration-200 ${scrolled
                    ? "border-gold-500/30 text-gold-400 hover:text-gold-300 hover:border-gold-300 hover:bg-white/10"
                    : "border-forest-950/20 text-forest-950/80 hover:text-forest-950 hover:border-forest-950/40 hover:bg-forest-950/10"
                  }`}
              >
                <ShieldCheck size={16} />
                Painel
              </Link>
            )}

            {/* =========================
                AUTH - DESKTOP
            ========================= */}

            {user ? (
              /* LOGGED USER */

              <Link
                to="/perfil"
                aria-label="Meu perfil"
                title="Meu perfil"
                className={`hidden md:flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 ${scrolled
                  ? "border-gold-500/30 text-cream/90 hover:text-white hover:border-gold-300 hover:bg-white/10"
                  : "border-forest-950/20 text-forest-950/80 hover:text-forest-950 hover:border-forest-950/40 hover:bg-forest-950/10"
                  }`}
              >
                <User size={18} />
              </Link>
            ) : (
              /* GUEST */

              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider border transition-all duration-200 ${scrolled
                    ? "border-gold-500/30 text-cream/90 hover:text-white hover:border-gold-300 hover:bg-white/10"
                    : "border-forest-950/20 text-forest-950/80 hover:text-forest-950 hover:border-forest-950/40 hover:bg-forest-950/10"
                    }`}
                >
                  Entrar
                </Link>

                <Link
                  to="/cadastro"
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider bg-gold-500 text-forest-950 transition-all duration-200 ${scrolled
                    ? "hover:bg-gold-300"
                    : "hover:bg-gold-600"
                    }`}
                >
                  Cadastrar
                </Link>
              </div>
            )}

            {/* =========================
                MOBILE MENU BUTTON
            ========================= */}

            <button
              className={`md:hidden flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${scrolled
                ? "text-cream/90 hover:text-white hover:bg-white/10"
                : "text-forest-950/80 hover:text-forest-950 hover:bg-forest-950/10"
                }`}
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* =================================
          MOBILE OVERLAY
      ================================= */}

      <div
        onClick={() => setOpen(false)}
        aria-hidden={!open}
        className={`md:hidden fixed inset-0 bg-forest-950/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
          }`}
      />

      {/* =================================
          MOBILE DRAWER
      ================================= */}

      <aside
        role="dialog"
        aria-label="Menu"
        aria-hidden={!open}
        className={`md:hidden fixed top-0 right-0 h-full w-[78%] max-w-xs bg-forest-950 border-l border-gold-500/20 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${open
          ? "translate-x-0"
          : "translate-x-full"
          }`}
      >

        {/* DRAWER HEADER */}

        {/* DRAWER HEADER */}

        <div className="flex items-center justify-between px-6 py-6 border-b border-gold-500/15">
          <span className="font-display text-4xl text-cream">
            Menu
          </span>

          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="text-cream/60 hover:text-white transition-colors duration-200 pt-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center justify-between">
          <div className="w-full max-w-sm flex flex-col">
            {links.map((link, index) => (
              <a
                key={link.label}
                href={link.to}
                onClick={(e) => handleNav(e, link.to)}
                className={`
                  group relative flex items-center justify-center
                  py-6
                  text-xl md:text-2xl
                  uppercase tracking-[0.2em]
                  text-cream/70
                  transition-all duration-300
                  hover:text-white
                  ${index !== links.length - 1 ? "border-b border-cream/10" : ""}
                `}
              >
                <span className="relative">
                  {link.label}

                  <span
                    className="
                      absolute -bottom-2 left-1/2
                      w-0 h-px
                      bg-gold-400
                      -translate-x-1/2
                      transition-all duration-300
                      group-hover:w-full
                    "
                  />
                </span>
              </a>
            ))}

            {role === "admin" && (
              <button
                onClick={() => handleMobileNavigate("/admin")}
                className="
                  group flex items-center justify-center gap-3
                  mt-8 pt-8
                  border-t border-cream/10
                  py-6
                  text-lg md:text-xl
                  uppercase tracking-[0.15em]
                  text-gold-400
                  cursor-pointer
                  transition-colors duration-300
                  hover:text-gold-300
                "
              >
                <ShieldCheck
                  size={22}
                  strokeWidth={1.5}
                  className="transition-transform duration-300 group-hover:scale-110"
                />

                <span>Painel administrativo</span>
              </button>
            )}
          </div>
        </nav>

        {/* =================================
            MOBILE AUTH ACTIONS
        ================================= */}

        <div className="px-6 py-6 border-t border-gold-500/15">

          {user ? (
            <button
              onClick={() => handleMobileNavigate("/perfil")}
              className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-300 text-forest-950 font-medium py-3 rounded-full transition-colors duration-200"
            >
              <User size={16} />
              Meu perfil
            </button>
          ) : (
            <div className="flex flex-col gap-3">

              <button
                onClick={() => handleMobileNavigate("/cadastro")}
                className="w-full flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-300 text-forest-950 font-medium py-3 rounded-full transition-colors duration-200"
              >
                <UserPlus size={16} />
                Cadastrar
              </button>

              <button
                onClick={() => handleMobileNavigate("/login")}
                className="w-full flex items-center justify-center gap-2 border border-gold-500/30 text-cream/90 hover:text-white hover:border-gold-300 hover:bg-white/10 py-3 rounded-full transition-colors duration-200"
              >
                <LogIn size={16} />
                Entrar
              </button>

            </div>
          )}
        </div>
      </aside >
    </>
  );
}