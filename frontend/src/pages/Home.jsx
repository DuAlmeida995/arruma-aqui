import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import ProCard from "../components/ProCard.jsx";
import { api } from "../api.js";

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getProfessionals({ cat: activeCat, sort: "rating" })
      .then((data) => setPros(data.results.slice(0, 5)))
      .finally(() => setLoading(false));
  }, [activeCat]);

  const goSearch = () => navigate("/buscar", { state: { query } });

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="flex items-center justify-between px-5 pt-[18px] pb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-[34px] h-[34px] rounded-[10px] bg-primary flex items-center justify-center">
            <Icon name="wrench" size={17} color="#fff" />
          </div>
          <div className="font-extrabold text-lg tracking-tight text-primary-dark">Arruma Aqui</div>
        </div>
        <div
          className="w-[38px] h-[38px] rounded-full bg-white border-[1.5px] border-line flex items-center justify-center cursor-pointer"
          onClick={() => navigate("/perfil")}
        >
          <Icon name="user" size={18} color="#F0854C" />
        </div>
      </div>

      <div className="px-5 pt-3 pb-1">
        <div className="flex items-center gap-2.5 bg-white border-[1.5px] border-line rounded-2xl px-4 py-3.5 shadow-sm">
          <Icon name="search" size={17} color="#6B7280" />
          <input
            className="border-none outline-none flex-1 bg-transparent text-[15px] placeholder:text-inksoft"
            placeholder="Qual serviço você precisa?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goSearch()}
          />
        </div>
      </div>

      <div className="px-5 pt-[22px] pb-2.5 text-[15px] font-extrabold text-primary-dark">Categorias</div>
      <div className="flex gap-2.5 px-5 pb-1.5 overflow-x-auto">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex-none flex flex-col items-center gap-1.5 cursor-pointer"
            onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
          >
            <div
              className={`w-[58px] h-[58px] rounded-2xl border-[1.5px] flex items-center justify-center transition-colors ${
                activeCat === c.id ? "bg-primary border-primary" : "bg-white border-line"
              }`}
            >
              <Icon name={c.icon} size={22} color={activeCat === c.id ? "#fff" : "#F0854C"} />
            </div>
            <div className={`text-[11.5px] font-semibold max-w-[64px] text-center ${activeCat === c.id ? "text-primary-dark" : "text-inksoft"}`}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center px-5 pt-[22px] pb-0.5">
        <span className="text-[15px] font-extrabold text-primary-dark">Profissionais recomendados</span>
        <span className="text-[12.5px] font-bold text-primary cursor-pointer" onClick={() => navigate("/buscar")}>
          Ver todos
        </span>
      </div>
      <div className="px-5 pb-1 text-[13px] text-inksoft">Selecionados pela proximidade e avaliação</div>

      <div className="pt-2">
        {loading && <div className="px-5 py-6 text-inksoft text-sm">Carregando profissionais...</div>}
        {!loading && pros.map((p) => <ProCard key={p.id} pro={p} />)}
        {!loading && pros.length === 0 && (
          <div className="px-5 py-5 text-inksoft text-sm">Nenhum profissional nessa categoria por enquanto.</div>
        )}
      </div>
    </div>
  );
}
