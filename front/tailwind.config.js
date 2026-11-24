/** @type {import('tailwindcss').Config} */

// Canais RGB em variáveis CSS (ver index.css): permitem modificadores de
// opacidade (bg-forest-900/50) e que o painel admin redefina a paleta
// inteira com a classe .theme-admin, sem reescrever cada componente.
const ch = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],

  theme: {
    extend: {
      colors: {
        // ---- Paleta da loja ("atelier em prata") ----
        paper: "#FAF8F5", // fundo principal (marfim)
        sand: "#F2EFEA", // seção alternada
        line: "#E5E1DA", // linhas finas
        ink: "#1B1B1A", // texto
        stone: "#6B6862", // texto suave
        accent: "#3A3F42", // grafite da logo (botões, detalhes)
        brass: "#A8885A", // ouro 18k, uso pontual

        // ---- Tokens legados (usados pelo admin) ----
        // Na loja valem o grafite original; em .theme-admin viram claros.
        forest: {
          950: ch("forest-950"),
          900: ch("forest-900"),
          800: ch("forest-800"),
          700: ch("forest-700"),
          600: ch("forest-600"),
          500: ch("forest-500"),
        },
        gold: {
          300: ch("gold-300"),
          400: ch("gold-400"),
          500: ch("gold-500"),
          600: ch("gold-600"),
        },
        cream: ch("cream"),
      },

      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        body: ["'Jost'", "sans-serif"],
      },

      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        mobileMenu: {
          from: { opacity: "0", transform: "translateY(-16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },

      animation: {
        marquee: "marquee 40s linear infinite",
        mobileMenu: "mobileMenu 200ms ease-out",
        fadeUp: "fadeUp 900ms ease-out both",
        fadeIn: "fadeIn 600ms ease-out both",
      },
    },
  },

  plugins: [],
};
