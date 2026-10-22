import { NavLink } from "react-router-dom";
import Icon from "./Icon.jsx";

const items = [
  { to: "/", label: "Início", icon: "home" },
  { to: "/buscar", label: "Buscar", icon: "compass" },
  { to: "/chat", label: "Chat", icon: "chat" },
  { to: "/perfil", label: "Perfil", icon: "user" },
  { to: "/configuracoes", label: "Config.", icon: "settings" },
];

export default function BottomNav() {
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[430px] bg-white/95 backdrop-blur border-t border-line flex justify-around px-1.5 pt-2.5 pb-[calc(0.6rem+env(safe-area-inset-bottom))] z-50">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 flex-1 ${isActive ? "text-primary" : "text-inksoft"}`
          }
        >
          <Icon name={it.icon} size={22} />
          <span className="text-[10.5px] font-bold">{it.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
