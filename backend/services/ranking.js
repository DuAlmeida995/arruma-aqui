// Motor de recomendação (Atividade 4 do doc FAPESP).
// Score = soma ponderada de fatores normalizados em [0, 1]; pesos em config/ranking.json.
// Cada candidato recebe também uma explicação legível ("por que recomendado").
const defaultConfig = require("../config/ranking.json");

const clamp01 = (x) => Math.max(0, Math.min(1, x));

// Nota bayesiana: novatos começam numa média neutra em vez de 0 (não somem da lista)
function bayesianRating(avg, count, { ratingMean, ratingStrength }) {
  const n = count || 0;
  return (ratingMean * ratingStrength + (avg || 0) * n) / (ratingStrength + n);
}

function factors(c, ctx, cfg) {
  const radius = ctx.radiusKm || 10;
  const bayes = bayesianRating(c.ratingAvg, c.ratingCount, cfg.priors);
  const contacts = c.contactsCount || 0;
  const done = c.servicesDone || 0;
  const { successRate: sPrior, successStrength: sK } = cfg.priors;

  let availability;
  if (ctx.weekday != null) availability = (c.availableWeekdays || []).includes(ctx.weekday) ? 1 : 0;
  else availability = (c.availableWeekdays || []).length / 7;

  return {
    distance: clamp01(1 - (c.distanceKm ?? radius) / radius),
    rating: clamp01((bayes - 1) / 4),
    reviewCount: (c.ratingCount || 0) / ((c.ratingCount || 0) + cfg.reviewCountHalfSaturation),
    availability,
    responseTime:
      c.avgResponseMinutes == null ? 0.5 : cfg.responseTimeHalfMinutes / (cfg.responseTimeHalfMinutes + c.avgResponseMinutes),
    successRate: clamp01((done + sPrior * sK) / (contacts + sK)),
    _bayes: bayes,
  };
}

function explain(c, f, ctx) {
  const reasons = [];
  if (c.distanceKm != null && c.distanceKm <= 3) reasons.push(`Perto de você (${formatKm(c.distanceKm)})`);
  if ((c.ratingCount || 0) >= 5 && c.ratingAvg >= 4.5) reasons.push(`Muito bem avaliado (${c.ratingAvg.toFixed(1)} em ${c.ratingCount} avaliações)`);
  if (!c.ratingCount) reasons.push("Novo na plataforma");
  if (ctx.weekday != null && f.availability === 1) reasons.push("Disponível no dia pedido");
  if (c.avgResponseMinutes != null && c.avgResponseMinutes <= 30) reasons.push("Costuma responder rápido");
  if ((c.servicesDone || 0) >= 5 && f.successRate >= 0.8) reasons.push(`${c.servicesDone} serviços concluídos`);
  return reasons;
}

function formatKm(km) {
  // distância arredondada (LGPD): nunca a exata
  if (km < 1) return "menos de 1 km";
  return `${Math.round(km)} km`;
}

function rank(candidates, ctx = {}, cfg = defaultConfig) {
  const w = cfg.weights;
  return candidates
    .map((c) => {
      const f = factors(c, ctx, cfg);
      const score = Object.keys(w).reduce((s, k) => s + w[k] * f[k], 0);
      const { _bayes, ...shown } = f;
      return { ...c, score: Number(score.toFixed(4)), factors: shown, reasons: explain(c, f, ctx) };
    })
    .sort((a, b) => b.score - a.score || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || a.id - b.id);
}

// Busca simples (linha de base para comparação na avaliação): só distância
function simpleSort(candidates) {
  return [...candidates].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || a.id - b.id);
}

module.exports = { rank, simpleSort, bayesianRating, formatKm, factors };
