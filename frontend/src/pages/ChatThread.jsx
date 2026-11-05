import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Avatar from "../components/Avatar.jsx";
import { api } from "../api.js";

export default function ChatThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conv, setConv] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  // Mensagens já existentes não animam; só as enviadas nesta sessão.
  const [initialCount, setInitialCount] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    api.getConversation(id).then((c) => {
      setInitialCount(c.messages.length);
      setConv(c);
    });
  }, [id]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const isFirstPaint = conv?.messages.length === initialCount;
    el.scrollTo({ top: el.scrollHeight, behavior: isFirstPaint ? "auto" : "smooth" });
  }, [conv?.messages.length, initialCount]);

  const send = async () => {
    if (!text.trim() || sending) return;
    const value = text.trim();
    setText("");
    setSending(true);
    try {
      const msg = await api.sendMessage(id, value);
      setConv((c) => ({ ...c, messages: [...c.messages, msg] }));
    } finally {
      setSending(false);
    }
  };

  if (!conv) {
    return (
      <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] flex items-center justify-center bg-bg">
        <div className="delayed-fade w-8 h-8 rounded-full border-[3px] border-line border-t-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 flex flex-col bg-bg">
      <div className="flex-none flex items-center gap-3 px-4 pt-5 pb-3.5 bg-white/90 backdrop-blur-xl border-b border-line">
        <button
          className="pressable w-10 h-10 rounded-full bg-bg flex items-center justify-center flex-none"
          onClick={() => navigate("/chat")}
          aria-label="Voltar"
        >
          <Icon name="chevronLeft" size={20} />
        </button>
        <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => navigate(`/profissional/${conv.proId}`)}>
          <Avatar id={conv.proId} name={conv.name} size={42} radius={14} />
          <div className="min-w-0">
            <div className="font-bold text-[15px] truncate">{conv.name}</div>
            <div className="text-[12px] text-primary-dark font-bold">{conv.role} · ver perfil</div>
          </div>
        </button>
        <button className="pressable w-10 h-10 rounded-full bg-bg flex items-center justify-center flex-none" aria-label="Ligar">
          <Icon name="phone" size={18} />
        </button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 pt-5 pb-4 flex flex-col gap-2">
        <div className="self-center text-[11.5px] font-bold text-inksoft bg-white rounded-full px-3 py-1 shadow-card mb-2">
          {conv.time}
        </div>
        {conv.messages.map((m, i) => {
          const mine = m.from === "me";
          return (
            <div
              key={i}
              className={`${i >= initialCount ? "animate-rise" : ""} max-w-[78%] px-4 py-2.5 text-[14.5px] leading-snug ${
                mine
                  ? "bg-primary text-white self-end rounded-[20px] rounded-br-[6px] shadow-[0_6px_16px_-8px_rgba(255,106,61,.6)]"
                  : "bg-white text-ink self-start rounded-[20px] rounded-bl-[6px] shadow-card"
              }`}
            >
              {m.text}
            </div>
          );
        })}
      </div>

      <div className="flex-none flex items-center gap-2 px-4 pt-3 pb-[calc(0.9rem+env(safe-area-inset-bottom))] bg-bg/90 backdrop-blur-xl">
        <div className="flex-1 flex items-center bg-white rounded-full shadow-card pl-5 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-primary/40 transition">
          <input
            className="flex-1 min-w-0 bg-transparent text-[14.5px] font-medium outline-none py-2 placeholder:text-inksoft"
            placeholder="Escreva uma mensagem…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button
            className={`pressable w-10 h-10 rounded-full flex items-center justify-center flex-none transition-colors ${
              text.trim() ? "bg-primary shadow-glow" : "bg-line"
            }`}
            onClick={send}
            aria-label="Enviar"
          >
            <Icon name="send" size={17} color={text.trim() ? "#fff" : "#6B7080"} />
          </button>
        </div>
      </div>
    </div>
  );
}
