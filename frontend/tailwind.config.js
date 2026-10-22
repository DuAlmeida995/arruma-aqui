/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
      },
      colors: {
        primary: { DEFAULT: "#F0854C", dark: "#C15E2A" },
        accent: { DEFAULT: "#2E8B8B", dark: "#236E6E" },
        bg: "#F6F4EF",
        ink: "#1B1F27",
        inksoft: "#6B7280",
        line: "#E7E3DA",
        green: "#2E8B57",
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
};
