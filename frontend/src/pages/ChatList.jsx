import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { initials, avatarColor } from "../components/avatar.js";
import { api } from "../api.js";

export default function ChatList() {
  const navigate = useNavigate();
  const [convs, setConvs] = useState([]);

  useEffect(() => {
    api.getConversations().then(setConvs);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="px-5 pt-[18px] pb-3.5 text-xl font-extrabold text-primary-dark">Conversas</div>
      {convs.map((c) => (
        <div
          key={c.id}
          className="flex gap-3 items-center px-5 py-3.5 border-b border-line cursor-pointer"
          onClick={() => navigate(`/chat/${c.id}`)}
        >
          <div
            className="w-[52px] h-[52px] rounded-2xl flex-none flex items-center justify-center font-extrabold text-white"
            style={{ background: avatarColor(c.proId) }}
          >
            {initials(c.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[14.5px]">
              {c.name} — {c.role}
            </div>
            <div className="text-[13px] text-inksoft mt-0.5 truncate">"{c.last}"</div>
          </div>
          <div className="text-[11px] text-inksoft flex-none">{c.time}</div>
        </div>
      ))}
    </div>
  );
}
