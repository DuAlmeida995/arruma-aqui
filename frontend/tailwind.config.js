/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["'Bricolage Grotesque'", "Manrope", "sans-serif"],
      },
      colors: {
        primary: { DEFAULT: "#FF6A3D", dark: "#E04E22", soft: "#FFF0EA" },
        accent: { DEFAULT: "#0F8A7E", dark: "#0B6D63", soft: "#E3F3F1" },
        bg: "#F6F4EF",
        ink: { DEFAULT: "#14171F", 2: "#262B36" },
        inksoft: "#6B7080",
        line: "#ECE8E0",
        star: "#F5B12E",
        green: { DEFAULT: "#1F9D63", soft: "#E6F6EE" },
        danger: { DEFAULT: "#D6453D", soft: "#FCEBEA" },
      },
      borderRadius: {
        card: "22px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,23,31,.04), 0 8px 24px -12px rgba(20,23,31,.12)",
        float: "0 12px 32px -8px rgba(20,23,31,.35)",
        glow: "0 10px 24px -8px rgba(255,106,61,.55)",
      },
    },
  },
  plugins: [],
};
