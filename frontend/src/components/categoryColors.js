// Cor de destaque de cada categoria: [fundo suave, ícone].
const colors = {
  eletrica: ["#FFF4DC", "#D98A00"],
  hidraulica: ["#E4F1FF", "#2F6FD6"],
  limpeza: ["#E6F6EE", "#1F9D63"],
  pintura: ["#FCE9F1", "#C93F7C"],
  jardinagem: ["#EAF5E1", "#4E9A1E"],
  montagem: ["#FFEDE5", "#E04E22"],
  reparos: ["#EFEAFB", "#6A47C7"],
  costura: ["#E3F3F1", "#0B7D72"],
};

export function categoryColor(id) {
  return colors[id] || ["#F1EFEA", "#14171F"];
}
