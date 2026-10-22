import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { initials, avatarColor } from "../components/avatar.js";
import { api } from "../api.js";

export default function ChatThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conv, setConv] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.getConversation(id).then(setConv);
  }, [id]);

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
    return <div className="flex-1 flex items-center justify-center text-inksoft text-sm">Carregando conversa...</div>;
  }

  return (
    <div className="flex-1 flex flex-col pb-0">
      <div className="flex items-center gap-3 px-5 pt-[18px] pb-3.5 border-b border-line">
        <div
          className="w-9 h-9 rounded-full bg-white border-[1.5px] border-line flex items-center justify-center cursor-pointer flex-none"
          onClick={() => navigate("/chat")}
        >
          <Icon name="chevronLeft" size={19} />
        </div>
        <div
          className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center font-bold text-[13px] text-white flex-none"
          style={{ background: avatarColor(conv.proId) }}
        >
          {initials(conv.name)}
        </div>
        <div>
          <div className="font-bold text-[14.5px]">{conv.name}</div>
          <div className="text-xs text-inksoft">{conv.role}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2 flex flex-col gap-2.5">
        {conv.messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-snug ${
              m.from === "me"
                ? "bg-primary text-white self-end rounded-br-md"
                : "bg-white border border-line self-start rounded-bl-md"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2.5 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-line bg-bg sticky bottom-0">
        <input
          className="flex-1 border-[1.5px] border-line rounded-full px-4 py-2.5 text-sm outline-none"
          placeholder="Digite uma mensagem..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          className="w-[42px] h-[42px] rounded-full bg-primary flex items-center justify-center flex-none"
          onClick={send}
        >
          <Icon name="send" size={17} color="#fff" />
        </button>
      </div>
    </div>
  );
}
