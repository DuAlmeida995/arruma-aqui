// Compara o ranking com a busca simples nos cenários de docs/cenarios.json (Atividade 4).
// Roda offline sobre a base fictícia (db/seed/data.js). Uso: npm run eval
const path = require("path");
const { buildSeed, bairros } = require("../db/seed/data");
const { rank, simpleSort, bayesianRating } = require("../services/ranking");
const { haversineKm } = require("../services/geo");
const cfg = require("../config/ranking.json");
const scenarios = require(path.join(__dirname, "..", "..", "docs", "cenarios.json"));

function candidatesFrom(data) {
  return data.providers.map((p) => {
    const reviews = data.reviews.filter((r) => r.provider_id === p.user_id);
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : null;
    return {
      id: p.user_id,
      lat: p.lat,
      lng: p.lng,
      active: p.active,
      radiusKm: p.radius_km,
      categories: data.providerCategories.filter((pc) => pc.provider_id === p.user_id).map((pc) => pc.category_id),
      availableWeekdays: [...new Set(data.availability.filter((a) => a.provider_id === p.user_id).map((a) => a.weekday))],
      ratingAvg: avg,
      ratingCount: reviews.length,
      contactsCount: data.contacts.filter((c) => c.provider_id === p.user_id).length,
      servicesDone: data.services.filter((s) => s.provider_id === p.user_id).length,
      avgResponseMinutes: p.avg_response_minutes,
    };
  });
}

function withDistance(cands, sc) {
  const [lat, lng] = bairros[sc.bairro];
  return cands.map((c) => ({ ...c, distanceKm: haversineKm(lat, lng, c.lat, c.lng) }));
}

// Busca simples: categoria + distância (linha de base do doc)
function simpleSearch(cands, sc) {
  return simpleSort(withDistance(cands, sc).filter((c) => c.categories.includes(sc.categoria) && c.distanceKm <= sc.raioKm));
}

// Recomendação: filtro duro (categoria, área, ativo, disponibilidade) + score
function recommend(cands, sc) {
  const eligible = withDistance(cands, sc).filter(
    (c) =>
      c.active &&
      c.categories.includes(sc.categoria) &&
      c.distanceKm <= sc.raioKm &&
      c.distanceKm <= c.radiusKm &&
      c.availableWeekdays.includes(sc.diaSemana)
  );
  return rank(eligible, { weekday: sc.diaSemana, radiusKm: sc.raioKm });
}

function adequate(c, sc, minNota) {
  return (
    c.active &&
    c.categories.includes(sc.categoria) &&
    c.distanceKm <= sc.raioKm &&
    c.distanceKm <= c.radiusKm &&
    c.availableWeekdays.includes(sc.diaSemana) &&
    bayesianRating(c.ratingAvg, c.ratingCount, cfg.priors) >= minNota
  );
}

function evaluate(data = buildSeed(), spec = scenarios) {
  const cands = candidatesFrom(data);
  const rows = spec.cenarios.map((sc) => {
    // Adequado = os primeiros k resultados são adequados, onde k = min(topN, nº de adequados existentes).
    // Se não há nenhum prestador adequado na região, o cenário é inviável e não entra na conta.
    const achievable = withDistance(cands, sc).filter((c) => adequate(c, sc, spec.minNota)).length;
    const k = Math.min(spec.topN, achievable);
    const judge = (list) => k > 0 && list.slice(0, k).every((c) => adequate(c, sc, spec.minNota));
    const t0 = process.hrtime.bigint();
    const rec = recommend(cands, sc);
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    return { id: sc.id, viavel: k > 0, adequados: achievable, simples: judge(simpleSearch(cands, sc)), ranking: judge(rec), candidatos: rec.length, ms };
  });
  const viable = rows.filter((r) => r.viavel);
  const pct = (key) => Math.round((100 * viable.filter((r) => r[key]).length) / viable.length);
  return { rows, simples: pct("simples"), ranking: pct("ranking"), pesos: cfg.version };
}

module.exports = { evaluate, candidatesFrom, simpleSearch, recommend };

if (require.main === module) {
  const out = evaluate();
  console.table(out.rows.map((r) => ({ cenario: r.id, simples: r.simples ? "ok" : "—", ranking: r.ranking ? "ok" : "—", adequados: r.adequados, candidatos: r.candidatos, ms: r.ms.toFixed(2) })));
  console.log(`Pesos v${out.pesos} — adequados: busca simples ${out.simples}% | ranking ${out.ranking}% (meta ≥ 80%)`);
  process.exitCode = out.ranking >= 80 ? 0 : 1;
}
