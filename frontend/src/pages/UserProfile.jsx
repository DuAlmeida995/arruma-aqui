import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Avatar from "../components/Avatar.jsx";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import ProviderDashboard from "./ProviderDashboard.jsx";

export default function UserProfile() {
  const { user: authUser } = useAuth();
  return authUser?.role === "provider" ? <ProviderDashboard /> : <ClientProfile />;
}

function ClientProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.getUser().then(setUser);
  }, []);

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-line border-t-primary animate-spin" />
      </div>
    );
  }

  const done = user.requests.filter((r) => r.status === "Concluído").length;

  return (
    <div className="flex-1 pb-32">
      <header className="relative bg-ink hero-grain text-white rounded-b-[34px] px-5 pt-6 pb-20">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[26px] font-bold tracking-tight">Meu perfil</h1>
          <button
            className="pressable w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center"
            onClick={() => navigate("/configuracoes")}
            aria-label="Configurações"
          >
            <Icon name="settings" size={19} color="#fff" />
          </button>
        </div>
        <div className="flex items-center gap-4 mt-6">
          <Avatar id={2} name={user.name} size={72} radius={24} className="ring-4 ring-white/15" />
          <div>
            <div className="font-display font-bold text-[22px] leading-tight">{user.name}</div>
            <div className="flex items-center gap-1 text-[13px] text-white/65 font-semibold mt-1">
              <Icon name="mappin" size={13} /> {user.bairro}, {user.city}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2.5 px-5 -mt-12 relative">
        <Stat value={user.requests.length} label="Pedidos" />
        <Stat value={done} label="Concluídos" />
        <Stat value={user.myReviews.length} label="Avaliações" />
      </div>

      <section className="px-5 pt-7">
        <h2 className="section-title mb-3">Serviços solicitados</h2>
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          {user.requests.map((r, i) => {
            const [name, role] = r.pro.split(/\s[-—]\s/);
            const ongoing = r.status === "Em andamento";
            return (
              <button
                key={i}
                className={`w-full text-left flex gap-3 items-center px-4 py-3.5 ${i < user.requests.length - 1 ? "border-b border-line" : ""}`}
                onClick={() => navigate(`/profissional/${r.proId}`)}
              >
                <Avatar id={r.proId} name={name} size={44} radius={14} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14.5px] truncate">{name}</div>
                  <div className="text-[12px] text-inksoft font-semibold mt-0.5 truncate">{role}</div>
                </div>
                <div className="flex-none flex flex-col items-end gap-1">
                  <span
                    className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      ongoing ? "bg-primary-soft text-primary-dark" : "bg-green-soft text-green"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${ongoing ? "bg-primary animate-pulse" : "bg-green"}`} />
                    {r.status}
                  </span>
                  <span className="text-[11.5px] text-inksoft font-semibold pr-1">{r.date}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-5 pt-7">
        <h2 className="section-title mb-3">Minhas avaliações</h2>
        <div className="flex flex-col gap-2.5">
          {user.myReviews.map((r, i) => {
            const [name, role] = r.pro.split(/\s[-—]\s/);
            return (
              <div key={i} className="bg-white rounded-card shadow-card p-4">
                <div className="flex items-center gap-3">
                  <Avatar id={r.proId} name={name} size={40} radius={13} />
                  <div className="flex-1">
                    <div className="font-bold text-[14px]">{name}</div>
                    <div className="text-[12px] text-inksoft font-semibold">{role}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Icon key={s} name="star" size={13} color={s < r.stars ? "#F5B12E" : "#DDD8CE"} />
                    ))}
                  </div>
                </div>
                <p className="mt-3 mb-0 text-[13.5px] text-ink/80 leading-relaxed bg-bg rounded-xl px-3.5 py-2.5">
                  “{r.text}”
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="bg-white rounded-[18px] shadow-card py-4 text-center">
      <div className="font-display font-bold text-[24px] leading-none">{value}</div>
      <div className="text-[11.5px] text-inksoft font-semibold mt-1.5">{label}</div>
    </div>
  );
}
