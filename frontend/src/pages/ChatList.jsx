import { LoadError, EmptyMessage } from "../components/LoadState.tsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function ChatList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [convs, setConvs] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    api.getConversations().then((data) => active && setConvs(data)).catch((e) => active && setError(e.message));
    return () => { active = false; };
  }, [retry]);

  return (
    <div className="flex-1 pb-32">
      <PageHeader title="Conversas" subtitle={convs ? `${convs.length} conversas ativas` : " "} />

      {error && <LoadError message={error} onRetry={() => setRetry((n) => n + 1)} />}
      {convs?.length === 0 && <div className="mx-5"><EmptyMessage message={user?.role === "provider" ? "Você ainda não recebeu mensagens. Complete seu perfil para aparecer nas buscas." : "Você ainda não tem conversas. Encontre um profissional para começar."} /></div>}
      <div className="mx-5 mt-1 bg-white rounded-card shadow-card overflow-hidden">
        {!convs && !error &&
          [0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 items-center px-4 py-4 animate-pulse">
              <div className="w-[52px] h-[52px] rounded-[17px] bg-line" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/2 bg-line rounded-full" />
                <div className="h-3 w-3/4 bg-line rounded-full" />
              </div>
            </div>
          ))}
        {convs?.map((c, i) => (
          <button
            key={c.id}
            className={`w-full text-left flex gap-3.5 items-center px-4 py-4 hover:bg-bg/60 transition-colors ${
              i < convs.length - 1 ? "border-b border-line" : ""
            }`}
            onClick={() => navigate(`/chat/${c.id}`)}
          >
            <Avatar id={c.otherId ?? c.proId} name={c.name} size={52} radius={17} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[15px] truncate">{c.name}</span>
                <span className="text-[11.5px] font-bold flex-none text-inksoft">{c.time}</span>
              </div>
              <div className="text-[12px] font-bold text-primary-dark mt-0.5">{c.role}</div>
              <div className="text-[13px] text-inksoft truncate mt-0.5">{c.last}</div>
            </div>
          </button>
        ))}
      </div>

      {user?.role === "client" && (
        <button
          className="pressable mx-5 mt-4 w-[calc(100%-40px)] flex items-center justify-center gap-2 py-4 rounded-[18px] border-2 border-dashed border-line text-inksoft font-bold text-[14px]"
          onClick={() => navigate("/buscar")}
        >
          <Icon name="search" size={17} /> Encontrar novo profissional
        </button>
      )}
    </div>
  );
}
