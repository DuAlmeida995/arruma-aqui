import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";

export default function PageHeader({ title, subtitle, back = false, right = null }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30 bg-bg/85 backdrop-blur-xl px-5 pt-5 pb-3">
      <div className="flex items-center gap-3">
        {back && (
          <button
            className="pressable w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center flex-none"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
          >
            <Icon name="chevronLeft" size={20} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-[26px] leading-tight font-bold tracking-tight truncate">{title}</h1>
          {subtitle && <div className="text-[13px] text-inksoft font-medium">{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}
