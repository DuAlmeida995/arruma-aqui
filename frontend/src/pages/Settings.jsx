import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";

const rows = [
  { icon: "mappin", title: "Localização", sub: "Vila Mariana, São Paulo" },
  { icon: "bell", title: "Notificações", sub: "Ativadas" },
  { icon: "lock", title: "Privacidade", sub: "" },
  { icon: "shield", title: "Segurança", sub: "" },
  { icon: "help", title: "Ajuda", sub: "" },
];

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="px-5 pt-[18px] pb-3.5 text-xl font-extrabold text-primary-dark">Configurações</div>

      <div className="mx-5 mb-4.5 rounded-2xl overflow-hidden border border-line">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3.5 bg-white ${i !== rows.length - 1 ? "border-b border-line" : ""}`}
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#EFF3FA] text-primary-dark flex items-center justify-center flex-none">
              <Icon name={r.icon} size={17} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">{r.title}</div>
              {r.sub && <div className="text-xs text-inksoft">{r.sub}</div>}
            </div>
            <Icon name="chevronRight" size={16} color="#6B7280" />
          </div>
        ))}
      </div>

      <div className="mx-5 rounded-2xl overflow-hidden border border-line">
        <div className="flex items-center gap-3 px-4 py-3.5 bg-white cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-9 h-9 rounded-[10px] bg-[#FBEAEA] text-[#B8563F] flex items-center justify-center flex-none">
            <Icon name="logout" size={17} />
          </div>
          <div className="font-bold text-sm text-[#B8563F]">Sair da conta</div>
        </div>
      </div>
    </div>
  );
}
