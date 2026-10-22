import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { initials, avatarColor } from "./avatar.js";

export default function ProCard({ pro }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white border border-line rounded-card p-3.5 mx-5 mb-3.5 flex gap-3 cursor-pointer"
      onClick={() => navigate(`/profissional/${pro.id}`)}
    >
      <div
        className="w-16 h-16 rounded-2xl flex-none flex items-center justify-center font-extrabold text-xl text-white"
        style={{ background: avatarColor(pro.id) }}
      >
        {initials(pro.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[15px] text-ink">{pro.name}</div>
        <div className="text-[13px] text-primary-dark font-bold mt-0.5">{pro.role}</div>
        <div className="flex items-center gap-1 text-[12.5px] text-inksoft mt-1 flex-wrap">
          <Icon name="mappin" size={12} color="#6B7280" /> {pro.bairro}
          <span className="w-[3px] h-[3px] rounded-full bg-inksoft inline-block mx-0.5" />
          {pro.dist}
        </div>
        <div className="flex items-center gap-1.5 text-[12.5px] mt-0.5">
          <span className="flex items-center gap-1 font-bold text-ink">
            <Icon name="star" size={13} color="#E7A33E" /> {pro.rating}
          </span>
          <span className="text-inksoft">({pro.reviews} avaliações)</span>
        </div>
        {pro.desc && <div className="text-[12.5px] text-inksoft mt-1.5 leading-snug">"{pro.desc}"</div>}
        <div className="flex justify-end mt-2.5">
          <button
            className="bg-primary text-white font-bold text-[12.5px] px-3.5 py-2 rounded-[10px]"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profissional/${pro.id}`);
            }}
          >
            Ver perfil
          </button>
        </div>
      </div>
    </div>
  );
}
