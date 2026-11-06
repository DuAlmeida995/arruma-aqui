// Formatação de datas/textos no padrão que o front já espera.
// Sempre no fuso de São Paulo: o servidor (Render) roda em UTC.
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const TZ = "America/Sao_Paulo";

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

// partes da data no horário de São Paulo
function parts(d) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(d)).map((x) => [x.type, x.value]));
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour, minute: +p.minute };
}

// nº do dia (calendário de São Paulo), para comparar "hoje", "ontem"...
const dayNumber = (p) => Date.UTC(p.year, p.month - 1, p.day) / 86400000;

function shortDate(d) {
  const p = parts(d);
  return `${String(p.day).padStart(2, "0")} ${MESES[p.month - 1]}`;
}

// "09:41" hoje, "Ontem", dia da semana nesta semana, senão "18 set"
function chatTime(d, now = new Date()) {
  const p = parts(d);
  const days = dayNumber(parts(now)) - dayNumber(p);
  if (days <= 0) return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
  if (days === 1) return "Ontem";
  if (days < 7) return DIAS[new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()];
  return shortDate(d);
}

function experience(years) {
  if (years == null) return "Experiência não informada";
  return `${years} ${years === 1 ? "ano" : "anos"} de experiência`;
}

module.exports = { shortDate, chatTime, experience };
