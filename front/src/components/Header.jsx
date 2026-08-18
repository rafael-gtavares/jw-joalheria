import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { to: "/", label: "Início" },
    { to: "/joias", label: "Peças" },
    { to: "/#sobre", label: "Sobre mim" },
    { to: "/#contato", label: "Contato" },
  ];

  // Navega para uma seção da home com rolagem suave.
  // Se já estiver na home, rola direto; senão navega e o ScrollManager cuida do resto.
  function handleNav(e, to) {
    e.preventDefault();
    setOpen(false);

    // Link "Início" ou logo -> topo da home
    if (to === "/") {
      if (location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        navigate("/");
      }
      return;
    }

    // Link âncora (ex.: /#sobre)
    if (to.startsWith("/#")) {
      const id = to.replace("/#", "");
      if (location.pathname === "/") {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        navigate(to);
      }
      return;
    }

    // Rotas normais (ex.: /joias)
    navigate(to);
  }

  return (
    <header className="sticky top-0 z-40 bg-forest-950/95 backdrop-blur border-b border-gold-500/20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          onClick={(e) => handleNav(e, "/")}
          className="flex items-center gap-3 group"
        >
          <span className="flex items-center justify-center w-11 h-11 rounded-full border border-gold-400 text-gold-300 font-display text-xl tracking-wide group-hover:bg-gold-500/10 transition-colors">
            JW
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-xl text-cream tracking-wide">JW Joalheria</span>
            <span className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Autoral</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-body text-sm uppercase tracking-wider text-cream/80">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.to}
              onClick={(e) => handleNav(e, l.to)}
              className="hover:text-gold-400 transition-colors cursor-pointer"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          className="md:hidden text-cream"
          onClick={() => setOpen((o) => !o)}
          aria-label="Abrir menu"
        >
          <span className="block w-6 h-px bg-cream mb-1.5" />
          <span className="block w-6 h-px bg-cream mb-1.5" />
          <span className="block w-6 h-px bg-cream" />
        </button>
      </div>

      {open && (
        <nav className="md:hidden flex flex-col gap-4 px-6 pb-6 text-cream/90 uppercase text-sm tracking-wider">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.to}
              onClick={(e) => handleNav(e, l.to)}
              className="cursor-pointer"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
