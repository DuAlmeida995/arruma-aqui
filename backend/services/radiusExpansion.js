// Ampliação gradual do raio (Atividade 3 do doc FAPESP).
// Recebe todos os candidatos até o maior raio, cada um com distance_km e in_area
// (o cliente está dentro do raio de atendimento do prestador), e devolve o menor
// conjunto que atinge o mínimo de resultados.
//
// 1. Tenta cada raio de expansionStepsKm, só com prestadores que atendem o cliente.
// 2. Se nem no maior raio houver o mínimo e allowOutsideServiceArea, inclui também quem
//    está perto mas fora da área habitual (marcado como outsideServiceArea).
const defaults = require("../config/search.json");

function expandRadius(rows, cfg = defaults) {
  const steps = [...cfg.expansionStepsKm].sort((a, b) => a - b);
  const within = (r, km) => Number(r.distance_km) <= km;

  for (const km of steps) {
    const found = rows.filter((r) => r.in_area && within(r, km));
    if (found.length >= cfg.minResults) {
      return { rows: found, radiusKm: km, expanded: km > steps[0], outsideServiceArea: false };
    }
  }

  const maxKm = steps[steps.length - 1];
  const inArea = rows.filter((r) => r.in_area && within(r, maxKm));
  if (!cfg.allowOutsideServiceArea) {
    return { rows: inArea, radiusKm: maxKm, expanded: true, outsideServiceArea: false };
  }
  const extra = rows
    .filter((r) => !r.in_area && within(r, maxKm))
    .sort((a, b) => Number(a.distance_km) - Number(b.distance_km))
    .slice(0, Math.max(0, cfg.minResults - inArea.length))
    .map((r) => ({ ...r, outside_service_area: true }));
  return { rows: [...inArea, ...extra], radiusKm: maxKm, expanded: true, outsideServiceArea: extra.length > 0 };
}

module.exports = { expandRadius };
