import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import ProCard from "../components/ProCard.jsx";
import { categoryColor } from "../components/categoryColors.js";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  // Cards só animam na primeira carga; trocar de filtro não deve piscar.
  const [animateCards, setAnimateCards] = useState(true);

  useEffect(() => {
    api.getCategories().then(setCategories);
    api.getUser().then(setUser);
  }, []);

  useEffect(() => {
    setLoading(true);
    if (activeCat !== null) setAnimateCards(false);
    api
      .getProfessionals({ cat: activeCat, sort: "relevance" })
      .then((data) => setPros(data.results.slice(0, 5)))
      .finally(() => setLoading(false));
  }, [activeCat]);

  const goSearch = () => navigate("/buscar", { state: { query } });
  const firstName = user?.name.split(" ")[0];

  return (
    <div className="flex-1 pb-32">
      {/* Hero */}
      <header className="relative bg-ink hero-grain text-white rounded-b-[34px] px-5 pt-6 pb-8 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[13px] bg-primary shadow-glow flex items-center justify-center">
              <Icon name="wrench" size={19} color="#fff" strokeWidth={2.4} />
            </div>
            <div>
              <div className="font-display font-extrabold text-[19px] leading-none tracking-tight">Arruma Aqui</div>
              {user?.bairro && (
                <div className="flex items-center gap-1 text-[12px] text-white/60 font-semibold mt-1">
                  <Icon name="mappin" size={11} /> {user.bairro}, SP
                </div>
              )}
            </div>
          </div>
          <button
            className="pressable relative w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center"
            onClick={() => navigate("/chat")}
            aria-label="Notificações"
          >
            <Icon name="bell" size={19} color="#fff" />
            <span className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-primary ring-2 ring-ink" />
          </button>
        </div>

        <div className="mt-7">
          <div className="text-[14px] text-white/60 font-semibold">Olá{firstName ? `, ${firstName}` : ""} 👋</div>
          <h1 className="font-display text-[34px] leading-[1.05] font-bold tracking-tight mt-1">
            O que vamos <span className="text-primary">arrumar</span> hoje?
          </h1>
        </div>

        <div className="mt-6 flex items-center gap-2 bg-white rounded-[20px] p-1.5 pl-4 shadow-float">
          <Icon name="search" size={19} color="#6B7080" />
          <input
            className="border-none outline-none flex-1 min-w-0 bg-transparent text-[15px] text-ink placeholder:text-inksoft font-medium py-2.5"
            placeholder="Eletricista, pintor, diarista…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goSearch()}
          />
          <button
            className="pressable h-11 px-4 rounded-[15px] bg-primary text-white font-bold text-[14px] shadow-glow"
            onClick={goSearch}
          >
            Buscar
          </button>
        </div>
      </header>

      {/* Pedido (clientes) */}
      {authUser?.role === "client" && (
        <section className="px-5 pt-6">
          <button
            className="pressable w-full text-left flex items-center gap-3.5 bg-white rounded-card shadow-card p-4"
            onClick={() => navigate("/pedido/novo", { state: { categoryId: activeCat } })}
          >
            <span className="w-11 h-11 rounded-[14px] bg-primary flex items-center justify-center flex-none shadow-glow">
              <Icon name="sparkle" size={20} color="#fff" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-extrabold text-[14.5px]">Descreva o que você precisa</span>
              <span className="block text-[12.5px] text-inksoft font-medium">Mostramos quem atende perto de você no dia certo</span>
            </span>
            <Icon name="chevronRight" size={18} color="#A3A7B3" />
          </button>
        </section>
      )}

      {/* Categorias */}
      <section className="px-5 pt-7">
        <div className="flex items-baseline justify-between mb-3.5">
          <h2 className="section-title">Categorias</h2>
          {activeCat && (
            <button className="text-[13px] font-bold text-primary-dark" onClick={() => setActiveCat(null)}>
              Limpar filtro
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-x-2 gap-y-4">
          {categories.map((c) => {
            const active = activeCat === c.id;
            const [soft, strong] = categoryColor(c.id);
            return (
              <button
                key={c.id}
                className="pressable flex flex-col items-center gap-2"
                onClick={() => setActiveCat(active ? null : c.id)}
              >
                <div
                  className={`w-[62px] h-[62px] rounded-[20px] flex items-center justify-center transition-all duration-200 ${
                    active ? "shadow-glow scale-105" : ""
                  }`}
                  style={{ background: active ? "#FF6A3D" : soft }}
                >
                  <Icon name={c.icon} size={24} color={active ? "#fff" : strong} strokeWidth={2.1} />
                </div>
                <span className={`text-[12px] font-bold ${active ? "text-ink" : "text-inksoft"}`}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Atalho do prestador */}
      {authUser?.role === "provider" && (
        <section className="px-5 pt-7">
          <button
            className="pressable w-full text-left flex items-center gap-3.5 bg-white rounded-card shadow-card p-4 border-2 border-primary/30"
            onClick={() => navigate("/prestador/perfil")}
          >
            <span className="w-11 h-11 rounded-[14px] bg-primary-soft flex items-center justify-center flex-none">
              <Icon name="wrench" size={20} color="#E04E22" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-extrabold text-[14.5px]">Seu perfil profissional</span>
              <span className="block text-[12.5px] text-inksoft font-medium">Categorias, área de atendimento e horários</span>
            </span>
            <Icon name="chevronRight" size={18} color="#A3A7B3" />
          </button>
        </section>
      )}

      {/* Banner */}
      <section className="px-5 pt-7">
        <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-accent to-accent-dark text-white p-5">
          <div className="absolute -right-6 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute right-8 -bottom-10 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <div className="flex-1">
              <div className="text-[11px] font-extrabold uppercase tracking-[.12em] text-white/70">Sem intermediário</div>
              <div className="font-display text-[19px] font-bold leading-snug mt-1">
                Combine preço e prazo direto com o profissional
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-none">
              <Icon name="shield" size={26} color="#fff" />
            </div>
          </div>
        </div>
      </section>

      {/* Recomendados */}
      <section className="pt-8">
        <div className="flex items-end justify-between px-5 mb-3.5">
          <div>
            <h2 className="section-title">Recomendados para você</h2>
            <div className="text-[13px] text-inksoft font-medium mt-0.5">Pela distância, avaliações e disponibilidade</div>
          </div>
          <button
            className="pressable flex-none text-[13px] font-bold text-primary-dark flex items-center gap-0.5"
            onClick={() => navigate("/buscar")}
          >
            Ver todos <Icon name="chevronRight" size={15} />
          </button>
        </div>

        {loading && pros.length === 0 && <CardSkeleton />}
        <div className={`transition-opacity duration-200 ${loading && pros.length > 0 ? "opacity-50" : ""}`}>
          {pros.map((p, i) => (
            <ProCard key={p.id} pro={p} index={i} animate={animateCards} />
          ))}
        </div>
        {!loading && pros.length === 0 && (
          <div className="mx-5 py-10 text-center text-inksoft text-sm bg-white rounded-card shadow-card">
            Nenhum profissional nessa categoria por enquanto.
          </div>
        )}
      </section>
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="bg-white rounded-card shadow-card p-4 mx-5 mb-3 animate-pulse">
      <div className="flex gap-3.5">
        <div className="w-[60px] h-[60px] rounded-[18px] bg-line" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-2/3 bg-line rounded-full" />
          <div className="h-3 w-1/3 bg-line rounded-full" />
          <div className="h-5 w-1/2 bg-line rounded-full" />
        </div>
      </div>
    </div>
  ));
}
