import { NavLink, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";
import { useAuth } from "../auth.jsx";

const items = [
  { to: "/", label: "Início", icon: "home" },
  { to: "/buscar", label: "Buscar", icon: "search" },
  { to: "/chat", label: "Chat", icon: "chat" },
  { to: "/perfil", label: "Perfil", icon: "user" },
  { to: "/configuracoes", label: "Ajustes", icon: "settings" },
];

// Telas com barra de ação própria (e as de login) escondem a navegação.
const hiddenOn = [/^\/chat\/.+/, /^\/profissional\/.+/, /^\/entrar/, /^\/criar-conta/, /^\/prestador\/perfil/];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { status } = useAuth();
  if (status !== "authenticated" || hiddenOn.some((re) => re.test(pathname))) return null;

  return (
    <nav className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[430px] z-50 bg-white/90 backdrop-blur-xl border-t border-line shadow-[0_-8px_24px_-16px_rgba(20,23,31,.18)] flex justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === "/"}
          className={({ isActive }) =>
            `pressable relative flex-1 flex flex-col items-center gap-1 pt-1 transition-colors ${
              isActive ? "text-primary-dark" : "text-inksoft hover:text-ink"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`absolute -top-2 h-[3px] rounded-b-full bg-primary transition-all duration-300 ${
                  isActive ? "w-8 opacity-100" : "w-0 opacity-0"
                }`}
              />
              <span
                className={`w-14 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isActive ? "bg-primary-soft" : ""
                }`}
              >
                <Icon name={it.icon} size={21} strokeWidth={isActive ? 2.3 : 1.9} />
              </span>
              <span className={`text-[11px] ${isActive ? "font-extrabold" : "font-semibold"}`}>{it.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
