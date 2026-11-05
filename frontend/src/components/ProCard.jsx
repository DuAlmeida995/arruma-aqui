import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import Avatar from "./Avatar.jsx";

export default function ProCard({ pro, index = 0, animate = true }) {
  const navigate = useNavigate();
  const open = () => navigate(`/profissional/${pro.id}`);

  return (
    <article
      className={`pressable ${animate ? "animate-rise" : ""} bg-white rounded-card shadow-card p-4 mx-5 mb-3 cursor-pointer`}
      style={animate ? { animationDelay: `${index * 50}ms` } : undefined}
      onClick={open}
    >
      <div className="flex gap-3.5">
        <Avatar id={pro.id} name={pro.name} size={60} radius={18} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[15.5px] text-ink truncate">{pro.name}</span>
            {pro.rating >= 4.8 && <Icon name="verified" size={16} color="#0F8A7E" />}
          </div>
          <div className="text-[13px] text-inksoft font-semibold mt-0.5">{pro.role}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex items-center gap-1 bg-[#FFF6E4] text-[#9A6410] font-bold text-[12px] px-2 py-[3px] rounded-full">
              {pro.reviews === 0 ? (
                "Novo"
              ) : (
                <>
                  <Icon name="star" size={12} color="#F5B12E" /> {pro.rating.toFixed(1)}
                  <span className="font-semibold text-[#9A6410]/70">({pro.reviews})</span>
                </>
              )}
            </span>
            <span className="flex items-center gap-1 text-[12px] text-inksoft font-semibold">
              <Icon name="mappin" size={12} /> {pro.dist}
            </span>
          </div>
        </div>
      </div>

      {pro.reasons?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Por que recomendamos">
          {pro.reasons.slice(0, 3).map((r) => (
            <span
              key={r}
              className="flex items-center gap-1 bg-accent-soft text-accent-dark text-[11.5px] font-bold px-2.5 py-1 rounded-full"
            >
              <Icon name="check" size={12} color="#0B6D63" strokeWidth={2.6} /> {r}
            </span>
          ))}
        </div>
      )}

      {pro.desc && <p className="text-[13px] text-inksoft mt-3 leading-relaxed line-clamp-2">{pro.desc}</p>}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
        <span className="text-[12px] font-semibold text-inksoft">
          {pro.bairro}
          {pro.outsideServiceArea && (
            <span className="ml-2 bg-[#FFF6E4] text-[#9A6410] font-bold text-[11px] px-2 py-[2px] rounded-full">
              Fora da área habitual · confirme no chat
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 text-[13px] font-bold text-primary-dark">
          Ver perfil <Icon name="arrowRight" size={15} />
        </span>
      </div>
    </article>
  );
}
