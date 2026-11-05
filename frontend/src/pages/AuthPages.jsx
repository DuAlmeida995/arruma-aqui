import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex-1 flex flex-col pb-10">
      <header className="relative bg-ink hero-grain text-white rounded-b-[34px] px-6 pt-10 pb-9 overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-[14px] bg-primary shadow-glow flex items-center justify-center">
            <Icon name="wrench" size={21} color="#fff" strokeWidth={2.4} />
          </div>
          <div className="font-display font-extrabold text-[21px] leading-none tracking-tight">Arruma Aqui</div>
        </div>
        <h1 className="font-display text-[30px] leading-[1.1] font-bold tracking-tight mt-8">{title}</h1>
        <p className="text-white/65 text-[14px] font-medium mt-2 leading-relaxed">{subtitle}</p>
      </header>
      <div className="px-5 -mt-5">{children}</div>
    </div>
  );
}

function Field({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-extrabold text-inksoft mb-1.5 px-1">{label}</span>
      <input
        className="w-full bg-bg rounded-[14px] px-4 py-3.5 text-[15px] font-medium outline-none border border-transparent focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition placeholder:text-inksoft/70"
        {...props}
      />
      {error && <span className="block text-danger text-[12.5px] font-semibold mt-1 px-1">{error}</span>}
    </label>
  );
}

function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="bg-danger-soft text-danger rounded-[14px] px-4 py-3 text-[13.5px] font-semibold">
      {children}
    </div>
  );
}

function SubmitButton({ busy, children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="pressable w-full py-4 rounded-[16px] bg-primary text-white font-extrabold text-[15px] shadow-glow disabled:opacity-60 disabled:active:scale-100"
    >
      {busy ? "Aguarde…" : children}
    </button>
  );
}

export function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(location.state?.expired ? "Sua sessão expirou. Entre novamente." : "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") navigate(location.state?.from || "/", { replace: true });
  }, [status, navigate, location.state]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Que bom te ver de novo" subtitle="Entre para encontrar profissionais perto de você e conversar direto com eles.">
      <form onSubmit={submit} className="bg-white rounded-card shadow-card p-5 space-y-4" noValidate>
        <ErrorBox>{error}</ErrorBox>
        <Field label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" required />
        <Field label="Senha" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" required />
        <SubmitButton busy={busy}>Entrar</SubmitButton>
      </form>

      <p className="text-center text-[14px] font-semibold text-inksoft mt-6">
        Ainda não tem conta?{" "}
        <Link to="/criar-conta" className="text-primary-dark font-extrabold">
          Criar conta
        </Link>
      </p>

      <div className="mt-6 bg-accent-soft text-accent-dark rounded-[16px] px-4 py-3 text-[12.5px] font-semibold leading-relaxed">
        <strong className="font-extrabold">Conta de demonstração:</strong> cliente@exemplo.com · senha demo1234
        <br />
        Todos os dados do app são fictícios.
      </div>
    </AuthLayout>
  );
}

export function Register() {
  const { register, status, user } = useAuth();
  const navigate = useNavigate();
  const [bairros, setBairros] = useState([]);
  const [form, setForm] = useState({ role: "client", name: "", email: "", password: "", bairro: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    api
      .getBairros()
      .then(setBairros)
      .catch(() => setError("Não foi possível carregar a lista de bairros. Recarregue a página."));
  }, []);

  useEffect(() => {
    if (status === "authenticated") navigate(user?.role === "provider" ? "/prestador/perfil" : "/", { replace: true });
  }, [status, user, navigate]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (!form.bairro) return setError("Escolha seu bairro.");
    setBusy(true);
    try {
      await register(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const roles = [
    { id: "client", title: "Preciso de um serviço", sub: "Encontrar profissionais", icon: "search" },
    { id: "provider", title: "Ofereço serviços", sub: "Receber novos clientes", icon: "wrench" },
  ];

  return (
    <AuthLayout title="Crie sua conta" subtitle="Grátis para clientes e profissionais. Sem cobrança por contato.">
      <form onSubmit={submit} className="bg-white rounded-card shadow-card p-5 space-y-4" noValidate>
        <div role="radiogroup" aria-label="Tipo de conta" className="grid grid-cols-2 gap-2.5">
          {roles.map((r) => {
            const on = form.role === r.id;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={on}
                key={r.id}
                onClick={() => setForm((f) => ({ ...f, role: r.id }))}
                className={`pressable text-left rounded-[16px] p-3.5 border-2 transition-colors ${
                  on ? "border-primary bg-primary-soft" : "border-line bg-white"
                }`}
              >
                <Icon name={r.icon} size={19} color={on ? "#E04E22" : "#6B7080"} />
                <div className="font-extrabold text-[13.5px] mt-2 leading-tight">{r.title}</div>
                <div className="text-[11.5px] text-inksoft font-semibold mt-0.5">{r.sub}</div>
              </button>
            );
          })}
        </div>

        <ErrorBox>{error}</ErrorBox>
        <Field label="Nome" autoComplete="name" value={form.name} onChange={set("name")} placeholder="Seu nome" required />
        <Field label="E-mail" type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="voce@exemplo.com" required />
        <Field label="Senha" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} placeholder="Mínimo de 8 caracteres" required />

        <label className="block">
          <span className="block text-[12.5px] font-extrabold text-inksoft mb-1.5 px-1">Bairro</span>
          <select
            value={form.bairro}
            onChange={set("bairro")}
            className="w-full bg-bg rounded-[14px] px-4 py-3.5 text-[15px] font-medium outline-none border border-transparent focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition"
          >
            <option value="">Escolha seu bairro</option>
            {bairros.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <span className="block text-[11.5px] text-inksoft font-semibold mt-1.5 px-1">
            Usamos só o bairro para calcular distâncias. Seu endereço nunca é pedido nem exibido.
          </span>
        </label>

        <SubmitButton busy={busy}>Criar conta</SubmitButton>
      </form>

      <p className="text-center text-[14px] font-semibold text-inksoft mt-6">
        Já tem conta?{" "}
        <Link to="/entrar" className="text-primary-dark font-extrabold">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
