// Formatação de datas/textos no padrão que o front já espera
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function shortDate(d) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")} ${MESES[dt.getMonth()]}`;
}

// "09:41" hoje, "Ontem", dia da semana nesta semana, senão "18 set"
function chatTime(d, now = new Date()) {
  const dt = new Date(d);
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(dt)) / 86400000);
  if (days <= 0) return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  if (days === 1) return "Ontem";
  if (days < 7) return DIAS[dt.getDay()];
  return shortDate(dt);
}

function experience(years) {
  if (years == null) return "Experiência não informada";
  return `${years} ${years === 1 ? "ano" : "anos"} de experiência`;
}

module.exports = { shortDate, chatTime, experience };
