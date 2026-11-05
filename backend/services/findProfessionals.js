// Busca + recomendação usada pela listagem e pelas solicitações.
// Etapa 1 (filtros eliminatórios no banco) → ampliação gradual do raio → etapa 2 (ranking).
const repo = require("../repositories/professionals");
const { sortAndView } = require("./professionalView");
const { expandRadius } = require("./radiusExpansion");
const searchCfg = require("../config/search.json");

async function findProfessionals(me, { q, cat, maxDistKm, weekday, sort = "relevance" } = {}) {
  const base = { lat: me.lat, lng: me.lng, q, cat, weekday };
  let rows;
  let search;
  if (maxDistKm) {
    // raio escolhido pelo usuário: fixo, sem ampliação
    rows = await repo.search({ ...base, maxDistKm });
    search = { radiusKm: maxDistKm, expanded: false, outsideServiceArea: false };
  } else {
    // raio padrão com ampliação gradual (uma consulta só, até o maior raio)
    const maxKm = Math.max(...searchCfg.expansionStepsKm);
    const all = await repo.search({ ...base, maxDistKm: maxKm, withinServiceArea: false });
    const out = expandRadius(all);
    rows = out.rows;
    search = { radiusKm: out.radiusKm, expanded: out.expanded, outsideServiceArea: out.outsideServiceArea };
  }
  const results = sortAndView(rows, { sort, weekday, radiusKm: search.radiusKm });
  return { total: results.length, results, search };
}

module.exports = { findProfessionals };
