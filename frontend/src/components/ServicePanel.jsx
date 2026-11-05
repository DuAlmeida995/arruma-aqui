import { useState } from "react";
import Icon from "./Icon.jsx";
import { api } from "../api.js";

// Faixa no topo do chat: marcar serviço como realizado → cliente avalia
export default function ServicePanel({ convId, service, otherName, onChange }) {
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const first = otherName.split(" ")[0];

  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      const out = await fn();
      onChange(out.service);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!service) return null;

  if (!service.done) {
    return (
      <div className="flex-none mx-4 mt-3 bg-white rounded-[16px] shadow-card px-4 py-3">
        {!confirming ? (
          <button className="w-full flex items-center justify-between text-left" onClick={() => setConfirming(true)}>
            <span className="text-[13px] font-semibold text-inksoft">O serviço já foi feito?</span>
            <span className="text-[13px] font-extrabold text-primary-dark flex items-center gap-1">
              Marcar como realizado <Icon name="check" size={15} />
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex-1 text-[13px] font-semibold">Confirmar que o serviço foi realizado?</span>
            <button className="text-[13px] font-bold text-inksoft px-2" onClick={() => setConfirming(false)}>
              Não
            </button>
            <button
              disabled={busy}
              className="pressable text-[13px] font-extrabold text-white bg-primary rounded-full px-4 py-2 disabled:opacity-60"
              onClick={() => run(() => api.markServiceDone(convId))}
            >
              Sim
            </button>
          </div>
        )}
        {error && <div className="text-danger text-[12.5px] font-semibold mt-2">{error}</div>}
      </div>
    );
  }

  if (service.review) {
    return (
      <div className="flex-none mx-4 mt-3 bg-green-soft text-green rounded-[16px] px-4 py-3 text-[13px] font-bold flex items-center gap-2">
        <Icon name="check" size={16} /> Serviço realizado · avaliado com {service.review.stars}{" "}
        {service.review.stars === 1 ? "estrela" : "estrelas"}
      </div>
    );
  }

  if (!service.canReview) {
    return (
      <div className="flex-none mx-4 mt-3 bg-green-soft text-green rounded-[16px] px-4 py-3 text-[13px] font-bold flex items-center gap-2">
        <Icon name="check" size={16} /> Serviço realizado · aguardando a avaliação do cliente
      </div>
    );
  }

  return (
    <form
      className="flex-none mx-4 mt-3 bg-white rounded-[16px] shadow-card px-4 py-3.5 space-y-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!stars) return setError("Escolha de 1 a 5 estrelas.");
        run(() => api.reviewService(convId, stars, text));
      }}
    >
      <div className="text-[13.5px] font-extrabold">Como foi o serviço de {first}?</div>
      <div className="flex gap-1" role="radiogroup" aria-label="Nota de 1 a 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
            onClick={() => setStars(n)}
            className="pressable p-1"
          >
            <Icon name="star" size={26} color={n <= stars ? "#F5B12E" : "#DDD8CE"} strokeWidth={2.2} />
          </button>
        ))}
      </div>
      <textarea
        className="w-full bg-bg rounded-[12px] px-3.5 py-2.5 text-[14px] font-medium outline-none resize-none min-h-[64px] focus:ring-2 focus:ring-primary/20"
        placeholder="Conte como foi (opcional)"
        maxLength={600}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {error && <div className="text-danger text-[12.5px] font-semibold">{error}</div>}
      <button
        type="submit"
        disabled={busy}
        className="pressable w-full py-3 rounded-[14px] bg-primary text-white font-extrabold text-[14px] shadow-glow disabled:opacity-60"
      >
        {busy ? "Enviando…" : "Enviar avaliação"}
      </button>
    </form>
  );
}
