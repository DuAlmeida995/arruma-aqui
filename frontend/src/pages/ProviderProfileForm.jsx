import { LoadError, LoadingMessage } from "../components/LoadState.tsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { categoryColor } from "../components/categoryColors.js";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";

const WEEKDAYS = [
  { n: 1, label: "Seg" },
  { n: 2, label: "Ter" },
  { n: 3, label: "Qua" },
  { n: 4, label: "Qui" },
  { n: 5, label: "Sex" },
  { n: 6, label: "Sáb" },
  { n: 0, label: "Dom" },
];

const empty = {
  roleTitle: "",
  description: "",
  experienceYears: "",
  bairro: "",
  radiusKm: 10,
  whatsapp: "",
  active: true,
  categories: [],
  services: "",
  days: [1, 2, 3, 4, 5],
  start: "08:00",
  end: "18:00",
};

// O formulário usa um horário único para os dias marcados; a API guarda por dia.
function fromProfile(p, user) {
  if (!p) return { ...empty, bairro: user?.bairro || "" };
  const first = p.availability[0];
  return {
    roleTitle: p.roleTitle,
    description: p.description || "",
    experienceYears: p.experienceYears ?? "",
    bairro: p.bairro,
    radiusKm: p.radiusKm,
    whatsapp: p.whatsapp || "",
    active: p.active,
    categories: p.categories.map((c) => c.id),
    services: [...new Set(p.categories.flatMap((c) => c.services))].join(", "),
    days: [...new Set(p.availability.map((a) => a.weekday))],
    start: first?.start || "08:00",
    end: first?.end || "18:00",
  };
}

function toPayload(f) {
  const services = f.services
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    roleTitle: f.roleTitle,
    description: f.description,
    experienceYears: f.experienceYears === "" ? null : Number(f.experienceYears),
    bairro: f.bairro,
    radiusKm: Number(f.radiusKm),
    whatsapp: f.whatsapp,
    active: f.active,
    categories: f.categories.map((id) => ({ id, services })),
    availability: f.days.map((weekday) => ({ weekday, start: f.start, end: f.end })),
  };
}

const inputCls =
  "w-full bg-bg rounded-[14px] px-4 py-3.5 text-[15px] font-medium outline-none border border-transparent focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition placeholder:text-inksoft/70";

function Label({ children, hint }) {
  return (
    <span className="block mb-1.5 px-1">
      <span className="text-[12.5px] font-extrabold text-inksoft">{children}</span>
      {hint && <span className="block text-[11.5px] text-inksoft/80 font-semibold">{hint}</span>}
    </span>
  );
}

function Card({ title, children }) {
  return (
    <section className="mx-5 mt-4 bg-white rounded-card shadow-card p-5 space-y-4">
      {title && <h2 className="font-display text-[17px] font-bold tracking-tight">{title}</h2>}
      {children}
    </section>
  );
}

export default function ProviderProfileForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [isNew, setIsNew] = useState(true);
  const [categories, setCategories] = useState([]);
  const [bairros, setBairros] = useState([]);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setError("");
    Promise.all([api.getProviderProfile(), api.getCategories(), api.getBairros()])
      .then(([{ profile }, cats, bs]) => {
        if (!active) return;
        setForm(fromProfile(profile, user));
        setIsNew(!profile);
        setCategories(cats);
        setBairros(bs);
      })
      .catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, [user, retry]);

  if (!form) {
    return (
      <div className="flex-1 pb-32">
        <PageHeader title="Perfil profissional" back />
        {error ? <LoadError message={error} onRetry={() => setRetry((n) => n + 1)} /> : <LoadingMessage />}
      </div>
    );
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (k, v) =>
    setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!form.categories.length) return setError("Escolha pelo menos uma categoria.");
    if (!form.bairro) return setError("Escolha o bairro onde você atende.");
    if (form.days.length && form.end <= form.start) return setError("O horário final precisa ser depois do inicial.");
    setBusy(true);
    try {
      const { profile } = await api.saveProviderProfile(toPayload(form));
      setForm(fromProfile(profile, user));
      setSaved(true);
      if (isNew) navigate(`/profissional/${user.id}`, { replace: true });
      setIsNew(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex-1 pb-36" noValidate>
      <PageHeader
        title={isNew ? "Monte seu perfil" : "Perfil profissional"}
        subtitle={isNew ? "É assim que os clientes vão te encontrar" : "Atualize como você aparece nas buscas"}
        back={!isNew}
      />

      <Card title="Seu trabalho">
        <label className="block">
          <Label>Profissão</Label>
          <input className={inputCls} value={form.roleTitle} onChange={set("roleTitle")} placeholder="Ex.: Eletricista" />
        </label>

        <div>
          <Label hint="Escolha uma ou mais">Categorias</Label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((c) => {
              const on = form.categories.includes(c.id);
              const [soft, strong] = categoryColor(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  aria-pressed={on}
                  onClick={() => toggle("categories", c.id)}
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
          <Label hint="Separe por vírgula">Serviços que você faz</Label>
          <input className={inputCls} value={form.services} onChange={set("services")} placeholder="Ex.: Troca de disjuntores, Chuveiro elétrico" />
        </label>

        <label className="block">
          <Label>Sobre você</Label>
          <textarea
            className={`${inputCls} min-h-[96px] resize-none`}
            value={form.description}
            onChange={set("description")}
            maxLength={600}
            placeholder="Conte sua experiência e como você trabalha."
          />
        </label>

        <label className="block">
          <Label>Anos de experiência</Label>
          <input className={inputCls} type="number" min="0" max="70" inputMode="numeric" value={form.experienceYears} onChange={set("experienceYears")} placeholder="Ex.: 5" />
        </label>
      </Card>

      <Card title="Onde você atende">
        <label className="block">
          <Label hint="Usamos só o centro do bairro; seu endereço nunca aparece">Bairro</Label>
          <select className={inputCls} value={form.bairro} onChange={set("bairro")}>
            <option value="">Escolha o bairro</option>
            {bairros.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <Label>
            Raio de atendimento: <span className="text-ink">{form.radiusKm} km</span>
          </Label>
          <input type="range" min="1" max="30" step="1" value={form.radiusKm} onChange={set("radiusKm")} className="w-full accent-primary" />
        </label>
      </Card>

      <Card title="Quando você atende">
        <div className="flex gap-1.5">
          {WEEKDAYS.map((d) => {
            const on = form.days.includes(d.n);
            return (
              <button
                type="button"
                key={d.n}
                aria-pressed={on}
                onClick={() => toggle("days", d.n)}
                className={`pressable flex-1 py-2.5 rounded-[12px] text-[12.5px] font-extrabold transition-colors ${
                  on ? "bg-primary text-white" : "bg-bg text-inksoft"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <Label>Das</Label>
            <input type="time" className={inputCls} value={form.start} onChange={set("start")} />
          </label>
          <label className="block">
            <Label>Até</Label>
            <input type="time" className={inputCls} value={form.end} onChange={set("end")} />
          </label>
        </div>
      </Card>

      <Card title="Contato">
        <label className="block">
          <Label hint="Opcional. Aparece no seu perfil para o cliente falar com você">WhatsApp</Label>
          <input className={inputCls} inputMode="tel" value={form.whatsapp} onChange={set("whatsapp")} placeholder="11 91234-5678" />
        </label>
        {!isNew && (
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span>
              <span className="block font-bold text-[14.5px]">Aparecer nas buscas</span>
              <span className="block text-[12.5px] text-inksoft font-medium">Desative quando estiver sem agenda</span>
            </span>
            <input
              type="checkbox"
              className="w-5 h-5 accent-primary"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
          </label>
        )}
      </Card>

      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[430px] z-40 bg-white/90 backdrop-blur-xl border-t border-line px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-2">
        {error && (
          <div role="alert" className="bg-danger-soft text-danger rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold">
            {error}
          </div>
        )}
        {saved && !error && (
          <div role="status" className="bg-green-soft text-green rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold flex items-center gap-1.5">
            <Icon name="check" size={15} /> Perfil salvo.
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="pressable w-full py-4 rounded-[16px] bg-primary text-white font-extrabold text-[15px] shadow-glow disabled:opacity-60"
        >
          {busy ? "Salvando…" : isNew ? "Publicar meu perfil" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
