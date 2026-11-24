import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, User, ShieldCheck } from "lucide-react";

import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

import { announcementApi } from "../api/announcementApi";

// Mensagens da barra superior (só o que a loja oferece de fato).
const NOTICES = [
  "Joias autorais em Prata 950 e Ouro 18k",
  "6x sem juros no cartão de crédito",
  "5% de desconto no Pix",
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notice, setNotice] = useState(0);

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
      setScrolled(window.scrollY > 8);
    }

    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Rotação da barra de avisos */
  useEffect(() => {
    const timer = setInterval(() => setNotice((n) => (n + 1) % NOTICES.length), 4500);
    return () => clearInterval(timer);
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

  const iconBtn =
    "relative flex items-center justify-center w-10 h-10 text-ink hover:text-stone transition-colors duration-300";

  /* =========================
     RENDER
  ========================= */

  return (
    <>
      <header className="sticky top-0 z-40">
        {/* BARRA DE AVISOS */}
        <div className="bg-accent text-paper h-8 flex items-center justify-center overflow-hidden">
          <p
            key={notice}
            className="animate-fadeIn text-[10.5px] uppercase tracking-[0.3em] px-4 text-center truncate"
          >
            {NOTICES[notice]}
          </p>
        </div>

        <div
          className={`bg-paper/95 backdrop-blur transition-[border-color,box-shadow] duration-300 border-b ${
            scrolled ? "border-line" : "border-transparent"
          }`}
        >
          <div className="max-w-6xl mx-auto px-5 md:px-6 h-[68px] md:h-[84px] grid grid-cols-[1fr_auto_1fr] items-center">
            {/* ESQUERDA: menu (mobile) / navegação (desktop) */}
            <div className="flex items-center">
              <button
                className={`md:hidden -ml-2 ${iconBtn}`}
                onClick={() => setOpen(true)}
                aria-label="Abrir menu"
              >
                <Menu size={22} strokeWidth={1.25} />
              </button>

              <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.24em] text-ink">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.to}
                    onClick={(e) => handleNav(e, link.to)}
                    className="relative cursor-pointer py-1.5 text-ink/55 hover:text-ink transition-colors duration-300 after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-brass after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* CENTRO: logo */}
            <Link
              to="/"
              onClick={(e) => handleNav(e, "/")}
              className="flex flex-col items-center leading-none"
              aria-label="JW Joalheria Autoral, página inicial"
            >
              <img
                src="/jw-logo.png"
                alt=""
                className="h-9 md:h-11 w-auto object-contain mix-blend-multiply"
              />
              <span className="hidden sm:block mt-1 text-[9px] uppercase tracking-[0.42em] text-stone">
                Joalheria Autoral
              </span>
            </Link>

            {/* DIREITA: ações */}
            <div className="flex items-center justify-end gap-1 md:gap-2">
              {role === "admin" && (
                <Link
                  to="/admin"
                  aria-label="Painel administrativo"
                  title="Painel administrativo"
                  className={`hidden md:flex ${iconBtn}`}
                >
                  <ShieldCheck size={19} strokeWidth={1.25} />
                </Link>
              )}

              {user ? (
                <Link
                  to="/perfil"
                  aria-label="Meu perfil"
                  title="Meu perfil"
                  className={`hidden md:flex ${iconBtn}`}
                >
                  <User size={19} strokeWidth={1.25} />
                </Link>
              ) : (
                <div className="hidden md:flex items-center gap-5 mr-2 text-[11px] uppercase tracking-[0.24em]">
                  <Link to="/login" className="hover:text-stone transition-colors duration-300">
                    Entrar
                  </Link>
                  <Link to="/cadastro" className="link-line">
                    Cadastrar
                  </Link>
                </div>
              )}

              <button
                onClick={() => setCartOpen(true)}
                aria-label="Abrir carrinho"
                className={`${iconBtn} -mr-2 md:mr-0`}
              >
                <ShoppingBag size={20} strokeWidth={1.25} />

                {totalItems > 0 && (
                  <span className="absolute top-1 right-0.5 bg-accent text-paper text-[9px] font-normal w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* =================================
          MENU MOBILE (tela cheia)
      ================================= */}

      <div
        role="dialog"
        aria-label="Menu"
        aria-hidden={!open}
        className={`md:hidden fixed inset-0 z-50 bg-paper flex flex-col transition-all duration-500 ease-out ${
          open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-[68px] border-b border-line">
          <img src="/jw-logo.png" alt="JW" className="h-9 w-auto mix-blend-multiply" />
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className={`${iconBtn} -mr-2`}
          >
            <X size={22} strokeWidth={1.25} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-8 py-10 flex flex-col">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.to}
              onClick={(e) => handleNav(e, link.to)}
              className="font-display text-4xl text-ink/70 py-3 border-b border-line/70 hover:text-ink hover:pl-3 hover:border-brass transition-all duration-300"
            >
              {link.label}
            </a>
          ))}

          {role === "admin" && (
            <button
              onClick={() => handleMobileNavigate("/admin")}
              className="mt-8 flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-stone self-start"
            >
              <ShieldCheck size={18} strokeWidth={1.25} />
              Painel administrativo
            </button>
          )}
        </nav>

        <div className="px-8 py-6 border-t border-line">
          {user ? (
            <button onClick={() => handleMobileNavigate("/perfil")} className="btn w-full">
              <User size={15} strokeWidth={1.5} />
              Meu perfil
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <button onClick={() => handleMobileNavigate("/cadastro")} className="btn w-full">
                Cadastrar
              </button>
              <button onClick={() => handleMobileNavigate("/login")} className="btn-ghost w-full">
                Entrar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
