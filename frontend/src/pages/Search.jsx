import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import ProCard from "../components/ProCard.jsx";
import { api } from "../api.js";

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState(location.state?.query || "");
  const [sort, setSort] = useState("rating");
  const [maxDist, setMaxDist] = useState(null);
  const [pros, setPros] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getProfessionals({ q: query, sort, maxDist })
      .then((data) => {
        setPros(data.results);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [query, sort, maxDist]);

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="flex items-center gap-3 px-5 pt-[18px] pb-1">
        <div
          className="w-9 h-9 rounded-full bg-white border-[1.5px] border-line flex items-center justify-center cursor-pointer flex-none"
          onClick={() => navigate(-1)}
        >
          <Icon name="chevronLeft" size={19} />
        </div>
        <div className="text-lg font-extrabold text-primary-dark">Profissionais em sua região</div>
      </div>

      <div className="px-5 pt-3 pb-1">
        <div className="flex items-center gap-2.5 bg-white border-[1.5px] border-line rounded-2xl px-4 py-3.5">
          <Icon name="search" size={17} color="#6B7280" />
          <input
            className="border-none outline-none flex-1 bg-transparent text-[15px] placeholder:text-inksoft"
            placeholder="Qual serviço você precisa?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 px-5 pt-2.5 pb-1 overflow-x-auto">
        <Chip active={sort === "rating"} onClick={() => setSort("rating")} icon="star">
          Melhor avaliação
        </Chip>
        <Chip active={sort === "dist"} onClick={() => setSort("dist")} icon="mappin">
          Mais próximo
        </Chip>
        <Chip active={maxDist === 3} onClick={() => setMaxDist(maxDist === 3 ? null : 3)}>
          Até 3 km
        </Chip>
      </div>

      <div className="px-5 pt-3 pb-1 text-[13px] text-inksoft">
        {loading ? "Buscando..." : `${total} profissionais encontrados perto de você`}
      </div>

      <div className="pt-1.5">
        {!loading && pros.map((p) => <ProCard key={p.id} pro={p} />)}
        {!loading && pros.length === 0 && (
          <div className="px-5 py-8 text-inksoft text-sm text-center">
            Nenhum profissional encontrado. Tente outra busca.
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children, icon }) {
  return (
    <div
      onClick={onClick}
      className={`flex-none flex items-center gap-1.5 text-[12.5px] font-bold px-3.5 py-2 rounded-full border-[1.5px] cursor-pointer whitespace-nowrap ${
        active ? "bg-primary border-primary text-white" : "bg-white border-line text-inksoft"
      }`}
    >
      {icon && <Icon name={icon} size={13} color={active ? "#fff" : "#6B7280"} />}
      {children}
    </div>
  );
}
