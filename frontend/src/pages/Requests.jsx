import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ProCard from "../components/ProCard.jsx";
import { categoryColor } from "../components/categoryColors.js";
import { CardSkeleton } from "./Home.jsx";
import { api } from "../api.js";

const inputCls =
  "w-full bg-bg rounded-[14px] px-4 py-3.5 text-[15px] font-medium outline-none border border-transparent focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition placeholder:text-inksoft/70";

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function formatDate(iso) {
  if (!iso) return "Sem data definida";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

export function NewRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(location.state?.categoryId || "");
  const [description, setDescription] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategories).catch((e) => setError(e.message));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!categoryId) return setError("Escolha o tipo de serviço.");
    if (description.trim().length < 10) return setError("Descreva o serviço em pelo menos 10 caracteres.");
    setBusy(true);
    try {
      const out = await api.createRequest({ categoryId, description, desiredDate: desiredDate || null });
      navigate(`/pedido/${out.request.id}`, { replace: true, state: { fresh: out } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex-1 pb-36" noValidate>
      <PageHeader title="Novo pedido" subtitle="Conte o que precisa e mostramos quem pode ajudar" back />

      <section className="mx-5 mt-2 bg-white rounded-card shadow-card p-5 space-y-5">
        <div>
          <span className="block text-[12.5px] font-extrabold text-inksoft mb-2 px-1">Tipo de serviço</span>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((c) => {
              const on = categoryId === c.id;
              const [soft, strong] = categoryColor(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  aria-pressed={on}
                  onClick={() => setCategoryId(c.id)}
                  className={`pressable flex flex-col items-center gap-1.5 rounded-[16px] py-2.5 border-2 transition-colors ${
                    on ? "border-primary bg-primary-soft" : "border-transparent"
                  }`}
                >
                  <span className="w-10 h-10 rounded-[13px] flex items-center justify-center" style={{ background: on ? "#FF6A3D" : soft }}>
                    <Icon name={c.icon} size={19} color={on ? "#fff" : strong} />
                  </span>
                  <span className="text-[11.5px] font-bold">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="block">
          <span className="block text-[12.5px] font-extrabold text-inksoft mb-1.5 px-1">O que precisa ser feito?</span>
          <textarea
            className={`${inputCls} min-h-[110px] resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            placeholder="Ex.: o chuveiro desarma o disjuntor quando ligo no quente."
          />
        </label>

        <label className="block">
          <span className="block text-[12.5px] font-extrabold text-inksoft mb-1.5 px-1">Para quando? (opcional)</span>
          <input type="date" className={inputCls} min={localToday()} value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)} />
          <span className="block text-[11.5px] text-inksoft font-semibold mt-1.5 px-1">
            Com data, mostramos só quem atende nesse dia da semana.
          </span>
        </label>
      </section>

      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[430px] z-40 bg-white/90 backdrop-blur-xl border-t border-line px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-2">
        {error && (
          <div role="alert" className="bg-danger-soft text-danger rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="pressable w-full py-4 rounded-[16px] bg-primary text-white font-extrabold text-[15px] shadow-glow disabled:opacity-60"
        >
          {busy ? "Buscando profissionais…" : "Ver profissionais recomendados"}
        </button>
      </div>
    </form>
  );
}

export function RequestDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(location.state?.fresh || null);
  const [error, setError] = useState("");

  // Os dados da criação servem só de prévia; sempre busca a versão atual no servidor
  useEffect(() => {
    api
      .getRequest(id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  async function close() {
    await api.closeRequest(id);
    setData((d) => ({ ...d, request: { ...d.request, status: "closed" } }));
  }

  if (error) {
    return (
      <div className="flex-1 pb-32">
        <PageHeader title="Pedido" back />
        <div className="mx-5 bg-danger-soft text-danger rounded-[14px] px-4 py-3 font-semibold text-[14px]">{error}</div>
      </div>
    );
  }

  const r = data?.request;
  return (
    <div className="flex-1 pb-32">
      <PageHeader title="Seu pedido" back right={null} />

      {!r ? (
        <CardSkeleton count={1} />
      ) : (
        <section className="mx-5 bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-none" style={{ background: categoryColor(r.categoryId)[0] }}>
              <Icon name={r.categoryIcon} size={20} color={categoryColor(r.categoryId)[1]} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-[15px]">{r.categoryLabel}</div>
              <div className="text-[12.5px] text-inksoft font-semibold first-letter:uppercase">{formatDate(r.desiredDate)}</div>
            </div>
            <span
              className={`text-[11.5px] font-extrabold px-2.5 py-1 rounded-full ${
                r.status === "open" ? "bg-green-soft text-green" : "bg-bg text-inksoft"
              }`}
            >
              {r.status === "open" ? "Aberto" : "Encerrado"}
            </span>
          </div>
          <p className="text-[14px] text-ink mt-3 leading-relaxed">{r.description}</p>
          {r.status === "open" && (
            <button type="button" onClick={close} className="mt-3 text-[13px] font-bold text-inksoft underline underline-offset-2">
              Já resolvi, encerrar pedido
            </button>
          )}
        </section>
      )}

      <div className="px-5 pt-6 pb-3">
        <h2 className="section-title">Recomendados para este pedido</h2>
        <div className="text-[13px] text-inksoft font-medium mt-0.5">
          {data ? `${data.total} profissionais · converse e combine direto com eles` : "Buscando…"}
        </div>
      </div>

      {data?.search?.expanded && (
        <div role="status" className="mx-5 mb-3 flex gap-2.5 items-start bg-accent-soft text-accent-dark rounded-[16px] px-4 py-3 text-[13px] font-semibold leading-relaxed">
          <Icon name="compass" size={17} color="#0B6D63" className="flex-none mt-0.5" />
          <span>Poucos profissionais perto de você, então ampliamos a busca para {data.search.radiusKm} km.</span>
        </div>
      )}

      {data?.results.map((p, i) => (
        <ProCard key={p.id} pro={p} index={i} />
      ))}

      {data && data.total === 0 && (
        <div className="mx-5 py-10 px-6 text-center bg-white rounded-card shadow-card">
          <div className="font-display font-bold text-[17px]">Ninguém disponível nesse dia</div>
          <div className="text-inksoft text-[13px] mt-1">Tente outra data ou crie o pedido sem data.</div>
          <button className="mt-4 text-primary-dark font-extrabold text-[14px]" onClick={() => navigate("/pedido/novo", { state: { categoryId: r?.categoryId } })}>
            Fazer outro pedido
          </button>
        </div>
      )}
    </div>
  );
}
