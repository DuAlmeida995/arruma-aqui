// Converte linhas do banco no formato que o front usa e aplica o ranking.
const { rank, formatKm } = require("./ranking");
const { experience } = require("./format");

const num = (v) => (v == null ? null : Number(v));

function toCandidate(row) {
  return {
    row,
    id: Number(row.id),
    distanceKm: num(row.distance_km),
    ratingAvg: num(row.rating_count) > 0 ? num(row.rating_avg) : null,
    ratingCount: num(row.rating_count) || 0,
    contactsCount: num(row.contacts_count) || 0,
    servicesDone: num(row.services_done) || 0,
    avgResponseMinutes: num(row.avg_response_minutes),
    availableWeekdays: (row.weekdays || []).map(Number),
  };
}

// LGPD: só bairro e distância arredondada; nada de coordenadas
function toView(c) {
  const r = c.row;
  return {
    id: c.id,
    name: r.name,
    role: r.role_title,
    cat: (r.categories || [])[0] || null,
    categories: r.categories || [],
    bairro: r.bairro,
    city: r.city,
    rating: c.ratingAvg == null ? 0 : Math.round(c.ratingAvg * 10) / 10,
    reviews: c.ratingCount,
    dist: c.distanceKm == null ? "" : formatKm(c.distanceKm),
    desc: r.description,
    exp: experience(r.experience_years),
    services: r.services || [],
    ...(c.score != null ? { score: c.score, reasons: c.reasons } : {}),
  };
}

// sort: "relevance" (ranking, padrão) | "rating" | "dist"
function sortAndView(rows, { sort = "relevance", weekday, radiusKm } = {}) {
  let list = rows.map(toCandidate);
  if (sort === "rating") {
    list.sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) || b.ratingCount - a.ratingCount || a.id - b.id);
  } else if (sort === "dist") {
    list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || a.id - b.id);
  } else {
    list = rank(list, { weekday, radiusKm });
  }
  return list.map(toView);
}

module.exports = { toCandidate, toView, sortAndView };
