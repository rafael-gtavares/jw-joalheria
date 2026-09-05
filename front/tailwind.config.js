/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],

  theme: {
    extend: {
      colors: {
        // Paleta inspirada na logo JW:
        // cinza claro com fundo azulado + grafite

        forest: {
          950: "#15191C",
          900: "#353D42",
          800: "#4B555B",
          700: "#626D74",
          600: "#7D888E",
          500: "#929DA2",
        },

        gold: {
          300: "#F4F6F6",
          400: "#E7EAEB",
          500: "#D5DADC",
          600: "#B8C0C4",
        },

        cream: "#E9EEF0",
        ink: "#15191C",
      },

      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        body: ["'Jost'", "sans-serif"],
      },

      keyframes: {
        marquee: {
          from: {
            transform: "translateX(0)",
          },
          to: {
            transform: "translateX(-50%)",
          },
        },  

        mobileMenu: {
          from: {
            opacity: "0",
            transform: "translateY(-16px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },

      animation: {
        marquee: "marquee 25s linear infinite",
        mobileMenu: "mobileMenu 200ms ease-out",
      },
    },
  },

  plugins: [],
};