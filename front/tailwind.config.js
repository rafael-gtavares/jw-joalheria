/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          950: "#081D16",
          900: "#0B2E22",
          800: "#0F3D2C",
          700: "#154F39",
          600: "#1D6B4C",
        },
        gold: {
          300: "#E3CB8C",
          400: "#D4B366",
          500: "#C9A24B",
          600: "#A9843A",
        },
        cream: "#F7F3EC",
        ink: "#181613",
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        body: ["'Jost'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
