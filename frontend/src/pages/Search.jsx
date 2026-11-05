import { LoadError } from "../components/LoadState.tsx";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import ProCard from "../components/ProCard.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { CardSkeleton } from "./Home.jsx";
import { api } from "../api.js";

export default function Search() {
  const location = useLocation();
  const [query, setQuery] = useState(location.state?.query || "");
  const debouncedQuery = useDebounced(query, 300);
  const [sort, setSort] = useState("relevance");
  const [today, setToday] = useState(false);
  const [maxDist, setMaxDist] = useState(null);
  const [pros, setPros] = useState([]);
  const [total, setTotal] = useState(0);
  const [searchInfo, setSearchInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .getProfessionals({ q: debouncedQuery, sort, maxDist, weekday: today ? new Date().getDay() : null })
      .then((data) => {
        if (cancelled) return;
        setPros(data.results);
        setTotal(data.total);
        setSearchInfo(data.search || null);
        setLoadedOnce(true);
      })
      .catch((e) => { if (!cancelled) { setError(e.message); setPros([]); setSearchInfo(null); } })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, sort, maxDist, today, retry]);

  const stale = loading || query !== debouncedQuery;

  return (
    <div className="flex-1 pb-32">
      <PageHeader title="Buscar" subtitle="Profissionais na sua região" />

      <div className="px-5 pt-1">
        <div className="flex items-center gap-2.5 bg-white rounded-[18px] shadow-card px-4 py-3.5 focus-within:ring-2 focus-within:ring-primary/40 transition">
          <Icon name="search" size={19} color="#6B7080" />
          <input
            className="border-none outline-none flex-1 min-w-0 bg-transparent text-[15px] font-medium placeholder:text-inksoft"
            placeholder="Qual serviço você precisa?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="text-inksoft text-[13px] font-bold" onClick={() => setQuery("")}>
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 px-5 pt-3.5 pb-1 overflow-x-auto">
        <Chip active={sort === "relevance"} onClick={() => setSort("relevance")} icon="sparkle">
          Recomendados
        </Chip>
        <Chip active={sort === "rating"} onClick={() => setSort("rating")} icon="star">
          Melhor avaliação
        </Chip>
        <Chip active={sort === "dist"} onClick={() => setSort("dist")} icon="mappin">
          Mais próximo
        </Chip>
        <Chip active={maxDist === 3} onClick={() => setMaxDist(maxDist === 3 ? null : 3)} icon="compass">
          Até 3 km
        </Chip>
        <Chip active={today} onClick={() => setToday((t) => !t)} icon="calendar">
          Disponível hoje
        </Chip>
      </div>

      <div className="px-5 pt-4 pb-3 text-[13px] text-inksoft font-semibold">
        {error ? "Busca indisponível" : stale ? "Buscando…" : loadedOnce ? (
          <>
            <span className="text-ink font-extrabold">{total}</span> profissionais encontrados
          </>
        ) : (
          "Buscando…"
        )}
      </div>

      {loadedOnce && searchInfo?.expanded && (
        <div role="status" className="mx-5 mb-3 flex gap-2.5 items-start bg-accent-soft text-accent-dark rounded-[16px] px-4 py-3 text-[13px] font-semibold leading-relaxed">
          <Icon name="compass" size={17} color="#0B6D63" className="flex-none mt-0.5" />
          <span>
            Poucos profissionais perto de você, então ampliamos a busca para {searchInfo.radiusKm} km.
            {searchInfo.outsideServiceArea && " Alguns atendem normalmente outra região: confirme no chat se eles vão até você."}
          </span>
        </div>
      )}

      {error && <LoadError message={error} onRetry={() => setRetry((n) => n + 1)} />}
      {!loadedOnce && loading && <CardSkeleton />}
      <div className={`transition-opacity duration-200 ${stale && loadedOnce ? "opacity-50" : ""}`}>
        {pros.map((p, i) => (
          <ProCard key={p.id} pro={p} index={i} animate={false} />
        ))}
      </div>
      {loadedOnce && !error && !stale && pros.length === 0 && (
        <div className="mx-5 py-12 px-6 text-center bg-white rounded-card shadow-card">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-soft flex items-center justify-center mb-3">
            <Icon name="search" size={24} color="#E04E22" />
          </div>
          <div className="font-display font-bold text-[17px]">Nada por aqui</div>
          <div className="text-inksoft text-[13px] mt-1">Tente outro termo ou remova os filtros.</div>
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children, icon }) {
  return (
    <button
      onClick={onClick}
      className={`pressable flex-none flex items-center gap-1.5 text-[13px] font-bold px-4 py-2.5 rounded-full whitespace-nowrap transition-colors ${
        active ? "bg-ink text-white" : "bg-white text-inksoft shadow-card"
      }`}
    >
      {icon && <Icon name={icon} size={14} color={active ? "#FF6A3D" : "#6B7080"} />}
      {children}
    </button>
  );
}

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
