import { useEffect, useState } from "react";
import Icon from "../components/Icon.jsx";
import { api } from "../api.js";

export default function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.getUser().then(setUser);
  }, []);

  if (!user) {
    return <div className="flex-1 flex items-center justify-center text-inksoft text-sm">Carregando perfil...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="flex items-center gap-3.5 px-5 pt-[26px] pb-[22px]">
        <div className="w-[66px] h-[66px] rounded-full bg-accent flex items-center justify-center font-extrabold text-xl text-white">
          {user.name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div>
          <div className="font-extrabold text-lg">{user.name}</div>
          <div className="flex items-center gap-1 text-[12.5px] text-inksoft mt-0.5">
            <Icon name="mappin" size={12} color="#6B7280" /> {user.bairro}, {user.city}
          </div>
        </div>
      </div>

      <div className="px-5 pt-1 pb-2.5 text-[15px] font-extrabold text-primary-dark">Serviços solicitados</div>
      <div className="px-5 flex flex-col gap-2.5">
        {user.requests.map((r, i) => (
          <div key={i} className="flex gap-2.5 items-center p-3 bg-white border border-line rounded-2xl">
            <div className="w-[42px] h-[42px] rounded-[11px] bg-[#EAF6EE] text-green flex items-center justify-center flex-none">
              <Icon name="wrench" size={18} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-[13.5px]">{r.pro}</div>
              <div className="text-xs text-inksoft">{r.date}</div>
            </div>
            <span
              className={`text-[10.5px] font-extrabold px-2.5 py-1 rounded-lg ${
                r.status === "Em andamento" ? "bg-[#FDF6E9] text-primary-dark" : "bg-[#EAF6EE] text-green"
              }`}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>

      <div className="px-5 pt-[22px] pb-2.5 text-[15px] font-extrabold text-primary-dark">Avaliações realizadas</div>
      <div className="px-5 flex flex-col gap-2.5">
        {user.myReviews.map((r, i) => (
          <div key={i} className="flex gap-2.5 items-center p-3 bg-white border border-line rounded-2xl">
            <div className="w-[42px] h-[42px] rounded-[11px] bg-[#FDF6E9] text-primary-dark flex items-center justify-center flex-none">
              <Icon name="star" size={17} color="#C8862A" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-[13.5px]">{r.pro}</div>
              <div className="text-xs text-inksoft">"{r.text}"</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
