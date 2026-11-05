import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Avatar from "../components/Avatar.jsx";
import { api } from "../api.js";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pro, setPro] = useState(null);
  const [convId, setConvId] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getProfessional(id).then(setPro);
    api.getConversations().then((convs) => {
      const match = convs.find((c) => String(c.proId) === String(id));
      setConvId(match?.id ?? null);
    });
  }, [id]);

  if (!pro) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-line border-t-primary animate-spin" />
      </div>
    );
  }

  const yearsMatch = pro.exp.match(/^(\d+)/);
  const yearsLabel = yearsMatch ? `${yearsMatch[1]} ${yearsMatch[1] === "1" ? "ano" : "anos"}` : "—";
  const isNew = pro.reviews === 0;

  return (
    <div className="flex-1 pb-36">
      {/* Capa */}
      <div className="relative h-[190px] bg-ink hero-grain rounded-b-[34px] px-5 pt-5">
        <div className="flex justify-between">
          <RoundButton onClick={() => navigate(-1)} label="Voltar">
            <Icon name="chevronLeft" size={20} color="#fff" />
          </RoundButton>
          <RoundButton onClick={() => setSaved((s) => !s)} label="Salvar">
            <svg width="19" height="19" viewBox="0 0 24 24" fill={saved ? "#FF6A3D" : "none"} stroke={saved ? "#FF6A3D" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z" />
            </svg>
          </RoundButton>
        </div>
      </div>

      {/* Identidade */}
      <div className="px-5 -mt-[52px] relative">
        <Avatar id={pro.id} name={pro.name} size={104} radius={30} ring className="shadow-card" />
        <div className="mt-3.5 flex items-center gap-1.5">
          <h1 className="font-display text-[28px] font-bold tracking-tight leading-tight">{pro.name}</h1>
          {pro.rating >= 4.8 && <Icon name="verified" size={22} color="#0F8A7E" />}
        </div>
        <div className="flex items-center gap-2 mt-1 text-[14px] font-semibold text-inksoft">
          <span className="text-primary-dark font-bold">{pro.role}</span>
          <span className="w-1 h-1 rounded-full bg-inksoft/50" />
          <span className="flex items-center gap-1">
            <Icon name="mappin" size={13} /> {pro.bairro} · {pro.dist}
          </span>
        </div>
      </div>

      {/* Números */}
      <div className="grid grid-cols-3 gap-2.5 px-5 mt-5">
        <Stat value={isNew ? "Novo" : pro.rating.toFixed(1)} label="Nota média" icon={isNew ? null : <Icon name="star" size={15} color="#F5B12E" />} />
        <Stat value={pro.reviews} label="Avaliações" />
        <Stat value={yearsLabel} label="Experiência" />
      </div>

      <div className="flex gap-3 items-start mx-5 mt-4 p-4 bg-accent-soft rounded-[18px]">
        <div className="w-8 h-8 rounded-[10px] bg-accent flex items-center justify-center flex-none">
          <Icon name="shield" size={16} color="#fff" />
        </div>
        <p className="m-0 text-[13px] text-accent-dark font-semibold leading-relaxed">
          Você combina preço, prazo e condições diretamente com o profissional pelo chat.
        </p>
      </div>

      <Block title="Sobre">
        <p className="m-0 text-[14px] text-inksoft leading-relaxed">{pro.desc}</p>
      </Block>

      <Block title="Serviços oferecidos">
        <div className="flex flex-wrap gap-2">
          {pro.services.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 bg-bg text-ink text-[13px] font-semibold px-3 py-2 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {s}
            </span>
          ))}
        </div>
      </Block>

      <Block
        title="Avaliações"
        right={
          <span className="flex items-center gap-1 text-[13px] font-bold">
            {isNew ? (
              <span className="text-inksoft font-semibold">Ainda sem avaliações</span>
            ) : (
              <>
                <Icon name="star" size={14} color="#F5B12E" /> {pro.rating.toFixed(1)}
                <span className="text-inksoft font-semibold">· {pro.reviews}</span>
              </>
            )}
          </span>
        }
      >
        <div className="flex flex-col gap-3">
          {pro.reviewsList.map((r, i) => (
            <div key={i} className="bg-bg rounded-2xl p-3.5">
              <div className="flex items-center gap-2.5">
                <Avatar id={i + 2} name={r.name} size={34} radius={12} />
                <div className="flex-1">
                  <div className="text-[13.5px] font-bold">{r.name}</div>
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Icon key={s} name="star" size={11} color={s < r.stars ? "#F5B12E" : "#DDD8CE"} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-2.5 mb-0 text-[13.5px] text-ink/80 leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </Block>

      {/* CTA fixo */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-bg via-bg to-bg/0">
        <div className="flex gap-2.5">
          <button
            className="pressable w-14 h-14 rounded-[18px] bg-white shadow-card flex items-center justify-center flex-none"
            aria-label="Ligar"
          >
            <Icon name="phone" size={21} color="#14171F" />
          </button>
          <button
            className="pressable flex-1 h-14 rounded-[18px] bg-primary text-white font-extrabold text-[15.5px] shadow-glow flex items-center justify-center gap-2"
            onClick={() => navigate(convId ? `/chat/${convId}` : "/chat")}
          >
            <Icon name="chat" size={19} color="#fff" />
            Conversar com {pro.name.split(" ")[0]}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoundButton({ children, onClick, label }) {
  return (
    <button
      className="pressable w-11 h-11 rounded-full bg-white/10 border border-white/15 backdrop-blur flex items-center justify-center"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function Stat({ value, label, icon }) {
  return (
    <div className="bg-white rounded-[18px] shadow-card px-3 py-3.5 text-center">
      <div className="flex items-center justify-center gap-1 font-display font-bold text-[20px] leading-none">
        {icon}
        {value}
      </div>
      <div className="text-[11.5px] text-inksoft font-semibold mt-1.5">{label}</div>
    </div>
  );
}

function Block({ title, right, children }) {
  return (
    <section className="bg-white rounded-card shadow-card p-5 mx-5 mt-3.5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="m-0 font-display text-[17px] font-bold tracking-tight">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
