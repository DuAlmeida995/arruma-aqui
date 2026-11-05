import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";

const pct = (v) => (v == null ? "—" : `${Math.round(v * 100)}%`);
const dec = (v, d = 1) => (v == null ? "—" : v.toFixed(d).replace(".", ","));
function mins(v) {
  if (v == null) return "—";
  if (v < 60) return `${Math.round(v)} min`;
  return `${dec(v / 60)} h`;
}

function Metric({ label, value, hint }) {
  return (
    <div className="bg-white rounded-[18px] shadow-card p-4">
      <div className="text-[12px] font-extrabold text-inksoft uppercase tracking-[.06em]">{label}</div>
      <div className="font-display font-bold text-[26px] leading-tight mt-1">{value}</div>
      {hint && <div className="text-[11.5px] text-inksoft font-semibold mt-1 leading-snug">{hint}</div>}
    </div>
  );
}

const inputCls = "w-full bg-white rounded-[12px] px-3 py-2.5 text-[14px] font-medium shadow-card outline-none focus:ring-2 focus:ring-primary/30";

export default function AdminMetrics() {
  const { user } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [m, setM] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    setError("");
    api
      .getMetrics({ from, to })
      .then(setM)
      .catch((e) => setError(e.message));
  }, [from, to, user?.role]);

  if (user?.role !== "admin") {
    return (
      <div className="flex-1 pb-32">
        <PageHeader title="Métricas" back />
        <div className="mx-5 bg-danger-soft text-danger rounded-[14px] px-4 py-3 font-semibold">Área restrita à administração.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-32">
      <PageHeader title="Métricas da pesquisa" subtitle="Calculadas a partir dos eventos registrados" />

      <div className="grid grid-cols-2 gap-2.5 px-5">
        <label className="block">
          <span className="block text-[12px] font-extrabold text-inksoft mb-1 px-1">De</span>
          <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-[12px] font-extrabold text-inksoft mb-1 px-1">Até (exclusivo)</span>
          <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      {error && <div className="mx-5 mt-4 bg-danger-soft text-danger rounded-[14px] px-4 py-3 font-semibold text-[14px]">{error}</div>}

      {m && (
        <>
          <div className="grid grid-cols-2 gap-2.5 px-5 mt-4">
            <Metric label="Tempo até o contato" value={mins(m.timeToContactMinutes.median)} hint={`mediana · ${m.timeToContactMinutes.n} contatos`} />
            <Metric label="Taxa de contato" value={pct(m.contactRate)} hint="usuários que contataram ÷ que viram lista" />
            <Metric label="Conversão do pedido" value={pct(m.requestConversion)} hint="pedidos que viraram contato" />
            <Metric label="Avaliação do serviço" value={m.satisfactionMean == null ? "—" : `${dec(m.satisfactionMean)} ★`} hint={`${m.totals.reviews} avaliações`} />
            <Metric label="Satisfação com o app" value={m.appSatisfaction.mean == null ? "—" : `${dec(m.appSatisfaction.mean)} / 5`} hint={`${m.appSatisfaction.n} respostas ao questionário`} />
            <Metric label="Resposta do prestador" value={pct(m.providerResponseRate)} hint={`mediana ${mins(m.providerResponseMinutesMedian)}`} />
            <Metric
              label="Escolhido no top 3"
              value={pct(m.contactedPosition.top3Share)}
              hint={`posição média ${dec(m.contactedPosition.mean)} · ${m.contactedPosition.n} contatos`}
            />
          </div>

          <section className="mx-5 mt-5 bg-white rounded-card shadow-card p-4">
            <h2 className="font-display font-bold text-[16px] mb-2">Eventos no período</h2>
            <dl className="grid grid-cols-2 gap-y-1.5 text-[13.5px]">
              {[
                ["Pedidos criados", m.totals.requestsCreated],
                ["Listas exibidas", m.totals.listsShown],
                ["Perfis abertos", m.totals.profilesOpened],
                ["Contatos iniciados", m.totals.contactsStarted],
                ["Respostas de prestadores", m.totals.providerReplies],
                ["Avaliações", m.totals.reviews],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-inksoft font-semibold">{k}</dt>
                  <dd className="text-right font-extrabold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="mx-5 mt-4 text-[12px] text-inksoft font-semibold leading-relaxed">
            Fórmulas em <code>docs/metricas.md</code>. Antes do piloto, apague os eventos gerados durante o desenvolvimento.
          </p>
        </>
      )}
    </div>
  );
}
