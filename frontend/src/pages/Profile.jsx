import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { initials, avatarColor } from "../components/avatar.js";
import { api } from "../api.js";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pro, setPro] = useState(null);

  useEffect(() => {
    api.getProfessional(id).then(setPro);
  }, [id]);

  if (!pro) {
    return <div className="flex-1 flex items-center justify-center text-inksoft text-sm">Carregando perfil...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="bg-primary px-5 pt-[18px] pb-7 rounded-b-[26px] text-white">
        <div
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center cursor-pointer mb-3.5"
          onClick={() => navigate(-1)}
        >
          <Icon name="chevronLeft" size={19} color="#fff" />
        </div>
        <div className="flex items-center gap-3.5">
          <div
            className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center font-extrabold text-2xl border-2 border-white/35"
            style={{ background: avatarColor(pro.id) }}
          >
            {initials(pro.name)}
          </div>
          <div>
            <div className="text-[19px] font-extrabold">{pro.name}</div>
            <div className="text-[13.5px] font-bold text-amber-200 mt-0.5">{pro.role}</div>
            <div className="flex items-center gap-1 text-[12.5px] text-white/75 mt-1">
              <Icon name="mappin" size={12} color="rgba(255,255,255,.75)" /> {pro.bairro} · {pro.dist}
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <Stat>
            <span className="flex items-center gap-1">
              <Icon name="star" size={14} color="#F6C453" /> {pro.rating}
            </span>
            <span>{pro.reviews} avaliações</span>
          </Stat>
          <Stat>
            <span>{pro.exp.split(" ")[0]}</span>
            <span>anos de exp.</span>
          </Stat>
        </div>
      </div>

      <div className="flex gap-2.5 items-start mx-5 mt-3.5 p-3.5 bg-[#FDF6E9] border border-[#F0DBAF] rounded-xl">
        <Icon name="check" size={16} color="#C8862A" />
        <p className="m-0 text-xs text-[#8A5E14] leading-relaxed">
          Você combina preço, prazo e condições diretamente com o profissional pelo chat.
        </p>
      </div>

      <Block title="Sobre">
        <p className="m-0 text-[13.5px] text-inksoft leading-relaxed">{pro.desc}</p>
      </Block>

      <Block title="Serviços oferecidos">
        <div>
          {pro.services.map((s, i) => (
            <span key={i} className="inline-block bg-[#EFF3FA] text-primary-dark text-xs font-bold px-2.5 py-1.5 rounded-[9px] mr-1.5 mb-1.5">
              {s}
            </span>
          ))}
        </div>
      </Block>

      <Block title="Avaliações de clientes">
        {pro.reviewsList.map((r, i) => (
          <div key={i} className={`py-2.5 ${i < pro.reviewsList.length - 1 ? "border-b border-line" : ""}`}>
            <div className="flex justify-between text-[13px] font-bold">
              <span>{r.name}</span>
              <span className="flex items-center gap-1 text-[#E7A33E]">
                <Icon name="star" size={12} color="#E7A33E" />
                {r.stars}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-inksoft">{r.text}</p>
          </div>
        ))}
      </Block>

      <button
        className="sticky bottom-3.5 mx-5 mt-4 bg-accent text-white border-none w-[calc(100%-40px)] py-4 rounded-2xl font-extrabold text-[15px] shadow-lg"
        onClick={() => navigate("/chat")}
      >
        Entrar em contato
      </button>
    </div>
  );
}

function Stat({ children }) {
  const [a, b] = children;
  return (
    <div>
      <b className="text-[15px] block">{a}</b>
      <span className="text-[11px] text-white/70">{b}</span>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div className="bg-white border border-line rounded-2xl p-4 mx-5 mt-3.5">
      <h4 className="m-0 mb-2 text-[13.5px] font-extrabold text-primary-dark">{title}</h4>
      {children}
    </div>
  );
}
