import { LoadError, LoadingMessage } from "../components/LoadState.tsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Avatar from "../components/Avatar.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";

const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

function fmtResponse(min) {
  if (min == null) return "—";
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 6) / 10;
  return `${String(h).replace(".", ",")} h`;
}

function Stars({ n, size = 13 }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, s) => (
        <Icon key={s} name="star" size={size} color={s < n ? "#F5B12E" : "#DDD8CE"} />
      ))}
    </span>
  );
}

function Stat({ value, label }) {
  return (
    <div className="bg-white rounded-[18px] shadow-card py-4 px-2 text-center">
      <div className="font-display font-bold text-[22px] leading-none">{value}</div>
      <div className="text-[11.5px] text-inksoft font-semibold mt-1.5">{label}</div>
    </div>
  );
}

function Empty({ children }) {
  return <div className="bg-white rounded-card shadow-card px-5 py-6 text-center text-inksoft text-[13.5px] font-semibold">{children}</div>;
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(undefined);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    api.getProviderDashboard().then((r) => active && setData(r.dashboard)).catch((e) => active && setError(e.message));
    return () => { active = false; };
  }, [retry]);

  return (
    <div className="flex-1 pb-32">
      <header className="relative bg-ink hero-grain text-white rounded-b-[34px] px-5 pt-6 pb-20">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[26px] font-bold tracking-tight">Meu painel</h1>
          <button
            className="pressable w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center"
            onClick={() => navigate("/configuracoes")}
            aria-label="Configurações"
          >
            <Icon name="settings" size={19} color="#fff" />
          </button>
        </div>
        <div className="flex items-center gap-4 mt-6">
          <Avatar id={user?.id} name={user?.name || ""} size={72} radius={24} className="ring-4 ring-white/15" />
          <div className="min-w-0">
            <div className="font-display font-bold text-[22px] leading-tight truncate">{user?.name}</div>
            <div className="flex items-center gap-1 text-[13px] text-white/65 font-semibold mt-1">
              <Icon name="mappin" size={13} /> {user?.bairro}, {user?.city}
            </div>
          </div>
        </div>
      </header>

      {error && <LoadError message={error} onRetry={() => setRetry((n) => n + 1)} />}
      {data === undefined && !error && <LoadingMessage message="Carregando seu painel…" />}

      {data === null && (
        <div className="mx-5 -mt-10 relative bg-white rounded-card shadow-card p-5 text-center">
          <div className="font-display font-bold text-[18px]">Seu perfil profissional ainda não existe</div>
          <p className="text-inksoft text-[13.5px] mt-1.5">Monte o perfil para aparecer nas buscas dos clientes.</p>
          <button
            className="pressable mt-4 w-full py-3.5 rounded-[16px] bg-primary text-white font-extrabold shadow-glow"
            onClick={() => navigate("/prestador/perfil")}
          >
            Montar meu perfil
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-2.5 px-5 -mt-12 relative">
            <Stat value={data.stats.ratingAvg == null ? "Novo" : data.stats.ratingAvg.toFixed(1).replace(".", ",")} label={`Nota · ${data.stats.ratingCount} avaliações`} />
            <Stat value={data.stats.servicesDone} label="Serviços realizados" />
            <Stat value={data.stats.contacts} label="Clientes que chamaram" />
            <Stat value={fmtResponse(data.stats.avgResponseMinutes)} label="Tempo médio de resposta" />
          </div>

          {!data.stats.active && (
            <button
              className="mx-5 mt-4 w-[calc(100%-40px)] text-left bg-[#FFF6E4] text-[#9A6410] rounded-[16px] px-4 py-3 text-[13px] font-bold"
              onClick={() => navigate("/prestador/perfil")}
            >
              Você está fora das buscas. Toque para reativar no perfil profissional.
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5 px-5 mt-4">
            <button
              className="pressable bg-white rounded-[16px] shadow-card py-3.5 font-extrabold text-[13.5px] flex items-center justify-center gap-2"
              onClick={() => navigate("/chat")}
            >
              <Icon name="chat" size={17} /> Conversas
            </button>
            <button
              className="pressable bg-white rounded-[16px] shadow-card py-3.5 font-extrabold text-[13.5px] flex items-center justify-center gap-2"
              onClick={() => navigate("/prestador/perfil")}
            >
              <Icon name="wrench" size={17} /> Editar perfil
            </button>
          </div>

          <section className="px-5 pt-7">
            <h2 className="section-title mb-3">Serviços realizados</h2>
            {data.services.length === 0 ? (
              <Empty>Quando um serviço for marcado como realizado no chat, ele aparece aqui.</Empty>
            ) : (
              <div className="bg-white rounded-card shadow-card overflow-hidden divide-y divide-line">
                {data.services.map((s) => (
                  <button
                    key={s.conversationId}
                    className="w-full text-left flex items-center gap-3 px-4 py-3.5"
                    onClick={() => navigate(`/chat/${s.conversationId}`)}
                  >
                    <Avatar id={s.conversationId} name={s.clientName} size={40} radius={13} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[14px] truncate">{s.clientName}</div>
                      <div className="text-[12px] text-inksoft font-semibold">{fmtDate(s.completedAt)}</div>
                    </div>
                    {s.stars ? <Stars n={s.stars} /> : <span className="text-[11.5px] font-bold text-inksoft">Sem avaliação</span>}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="px-5 pt-7">
            <h2 className="section-title mb-3">Avaliações recebidas</h2>
            {data.reviews.length === 0 ? (
              <Empty>Você ainda não recebeu avaliações.</Empty>
            ) : (
              <div className="flex flex-col gap-2.5">
                {data.reviews.map((r, i) => (
                  <div key={i} className="bg-white rounded-card shadow-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-bold text-[14px]">{r.clientName}</div>
                      <Stars n={r.stars} />
                    </div>
                    {r.text && <p className="mt-2 mb-0 text-[13.5px] text-ink/80 leading-relaxed">“{r.text}”</p>}
                    <div className="text-[11.5px] text-inksoft font-semibold mt-2">{fmtDate(r.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
