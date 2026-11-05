import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";

const inputCls =
  "w-full bg-bg rounded-[14px] px-4 py-3.5 text-[15px] font-medium outline-none border border-transparent focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition placeholder:text-inksoft/70";

function Label({ children }) {
  return <span className="block text-[12.5px] font-extrabold text-inksoft mb-1.5 px-1">{children}</span>;
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, updateUser, deleteAccount } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", bairro: user?.bairro || "" });
  const [bairros, setBairros] = useState([]);
  const [msg, setMsg] = useState(null); // { type: "ok" | "error", text }
  const [busy, setBusy] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [delError, setDelError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.getBairros().then(setBairros).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await updateUser(form);
      setMsg({ type: "ok", text: "Dados atualizados." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function remove(e) {
    e.preventDefault();
    setDelError("");
    setDeleting(true);
    try {
      await deleteAccount(password);
      navigate("/entrar", { replace: true });
    } catch (err) {
      setDelError(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="flex-1 pb-32">
      <PageHeader title="Dados da conta" subtitle={user?.email} back />

      <form onSubmit={save} className="mx-5 mt-2 bg-white rounded-card shadow-card p-5 space-y-4" noValidate>
        <label className="block">
          <Label>Nome</Label>
          <input className={inputCls} value={form.name} onChange={set("name")} autoComplete="name" />
        </label>
        <label className="block">
          <Label>Telefone (opcional)</Label>
          <input className={inputCls} value={form.phone} onChange={set("phone")} inputMode="tel" placeholder="11 91234-5678" />
        </label>
        <label className="block">
          <Label>Bairro</Label>
          <select className={inputCls} value={form.bairro} onChange={set("bairro")}>
            <option value="">Escolha seu bairro</option>
            {bairros.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        {msg && (
          <div
            role={msg.type === "error" ? "alert" : "status"}
            className={`rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold flex items-center gap-1.5 ${
              msg.type === "error" ? "bg-danger-soft text-danger" : "bg-green-soft text-green"
            }`}
          >
            {msg.type === "ok" && <Icon name="check" size={15} />} {msg.text}
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="pressable w-full py-3.5 rounded-[16px] bg-primary text-white font-extrabold text-[15px] shadow-glow disabled:opacity-60"
        >
          {busy ? "Salvando…" : "Salvar"}
        </button>
      </form>

      <section className="mx-5 mt-6 bg-white rounded-card shadow-card p-5">
        <h2 className="font-display text-[17px] font-bold tracking-tight text-danger">Excluir conta</h2>
        <p className="text-[13px] text-inksoft font-medium mt-1.5 leading-relaxed">
          Apagamos seu nome, e-mail, telefone, localização, mensagens enviadas e, se você for prestador, seu perfil profissional.
          Avaliações que você escreveu continuam visíveis, mas sem o seu nome. Essa ação não pode ser desfeita.
        </p>
        {!confirming ? (
          <button
            type="button"
            className="pressable mt-4 w-full py-3.5 rounded-[16px] bg-danger-soft text-danger font-extrabold text-[14.5px]"
            onClick={() => setConfirming(true)}
          >
            Quero excluir minha conta
          </button>
        ) : (
          <form onSubmit={remove} className="mt-4 space-y-3" noValidate>
            <label className="block">
              <Label>Digite sua senha para confirmar</Label>
              <input
                type="password"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
              />
            </label>
            {delError && (
              <div role="alert" className="bg-danger-soft text-danger rounded-[12px] px-3.5 py-2.5 text-[13px] font-semibold">
                {delError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                className="pressable py-3.5 rounded-[16px] bg-bg text-ink font-extrabold text-[14px]"
                onClick={() => {
                  setConfirming(false);
                  setPassword("");
                  setDelError("");
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={deleting || !password}
                className="pressable py-3.5 rounded-[16px] bg-danger text-white font-extrabold text-[14px] disabled:opacity-50"
              >
                {deleting ? "Excluindo…" : "Excluir conta"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
