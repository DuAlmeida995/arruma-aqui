import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { useAuth } from "../auth.jsx";

const accountRows = (user) => [
  {
    icon: "mappin",
    title: "Localização",
    sub: user?.bairro ? `${user.bairro}, ${user.city || "São Paulo"}` : "Não informada",
    tint: ["#E4F1FF", "#2F6FD6"],
  },
  { icon: "lock", title: "Privacidade", tint: ["#EFEAFB", "#6A47C7"] },
  { icon: "shield", title: "Segurança", tint: ["#E3F3F1", "#0B7D72"] },
];

const support = [
  { icon: "help", title: "Central de ajuda", tint: ["#FFF4DC", "#D98A00"] },
  { icon: "globe", title: "Idioma", sub: "Português (Brasil)", tint: ["#FCE9F1", "#C93F7C"] },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const account = accountRows(user);

  return (
    <div className="flex-1 pb-32">
      <PageHeader title="Ajustes" />

      <Group label="Conta">
        <div onClick={() => navigate("/conta")}>
          <Row icon="user" title="Dados da conta" sub="Nome, telefone, bairro e exclusão" tint={["#E4F1FF", "#2F6FD6"]} />
        </div>
        {user?.role === "provider" && (
          <div onClick={() => navigate("/prestador/perfil")}>
            <Row icon="wrench" title="Perfil profissional" sub="Categorias, área e horários" tint={["#FFF0EA", "#E04E22"]} />
          </div>
        )}
        {account.map((r) => (
          <Row key={r.title} {...r} />
        ))}
        <Row icon="bell" title="Notificações" sub={notifications ? "Ativadas" : "Desativadas"} tint={["#FFEDE5", "#E04E22"]}>
          <Toggle on={notifications} onChange={() => setNotifications((n) => !n)} />
        </Row>
      </Group>

      <Group label="Suporte">
        {support.map((r) => (
          <Row key={r.title} {...r} />
        ))}
      </Group>

      <div className="mx-5 mt-6">
        <button
          className="pressable w-full flex items-center justify-center gap-2 py-4 bg-danger-soft text-danger rounded-[18px] font-bold text-[14.5px]"
          onClick={() => {
            logout();
            navigate("/entrar", { replace: true });
          }}
        >
          <Icon name="logout" size={18} /> Sair da conta
        </button>
      </div>

      <div className="text-center text-[12px] text-inksoft font-semibold mt-6">Arruma Aqui · versão 1.0.0</div>
    </div>
  );
}

function Group({ label, children }) {
  return (
    <section className="mx-5 mt-4">
      <div className="text-[12px] font-extrabold uppercase tracking-[.1em] text-inksoft px-1 mb-2">{label}</div>
      <div className="bg-white rounded-card shadow-card overflow-hidden divide-y divide-line">{children}</div>
    </section>
  );
}

function Row({ icon, title, sub, tint, children }) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-bg/60 transition-colors">
      <div className="w-10 h-10 rounded-[13px] flex items-center justify-center flex-none" style={{ background: tint[0] }}>
        <Icon name={icon} size={18} color={tint[1]} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[14.5px]">{title}</div>
        {sub && <div className="text-[12.5px] text-inksoft font-medium">{sub}</div>}
      </div>
      {children || <Icon name="chevronRight" size={17} color="#A3A7B3" />}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`relative w-12 h-7 rounded-full transition-colors ${on ? "bg-primary" : "bg-line"}`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`}
      />
    </button>
  );
}
