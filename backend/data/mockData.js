// Dados mockados em memória — nenhum dado pessoal real é utilizado.

const categories = [
  { id: "eletrica", label: "Elétrica", icon: "bolt" },
  { id: "hidraulica", label: "Hidráulica", icon: "droplet" },
  { id: "limpeza", label: "Limpeza", icon: "sparkle" },
  { id: "pintura", label: "Pintura", icon: "brush" },
  { id: "jardinagem", label: "Jardinagem", icon: "sprout" },
  { id: "montagem", label: "Montagem", icon: "wrench" },
  { id: "reparos", label: "Reparos", icon: "box" },
  { id: "costura", label: "Costura", icon: "scissors" },
];

const professionals = [
  { id: 1, name: "Carlos Silva", role: "Eletricista", cat: "eletrica", bairro: "Vila Mariana", city: "São Paulo", rating: 4.9, reviews: 127, dist: "2,3 km", desc: "Instalações elétricas, manutenção e pequenos reparos.", exp: "9 anos de experiência", services: ["Instalação elétrica", "Manutenção preventiva", "Troca de disjuntores", "Quadro de força"] },
  { id: 2, name: "Marcos Oliveira", role: "Eletricista", cat: "eletrica", bairro: "Saúde", city: "São Paulo", rating: 4.7, reviews: 84, dist: "3,1 km", desc: "Atendimento residencial e comercial, urgências no mesmo dia.", exp: "6 anos de experiência", services: ["Fiação", "Chuveiro elétrico", "Tomadas e interruptores"] },
  { id: 3, name: "Renata Souza", role: "Encanadora", cat: "hidraulica", bairro: "Ipiranga", city: "São Paulo", rating: 4.8, reviews: 96, dist: "1,8 km", desc: "Especialista em vazamentos, desentupimentos e reformas de banheiro.", exp: "7 anos de experiência", services: ["Reparo de vazamentos", "Desentupimento", "Troca de registros", "Instalação de metais"] },
  { id: 4, name: "Diego Fernandes", role: "Pintor", cat: "pintura", bairro: "Moema", city: "São Paulo", rating: 4.6, reviews: 58, dist: "4,0 km", desc: "Pintura residencial interna e externa com acabamento premium.", exp: "5 anos de experiência", services: ["Pintura interna", "Pintura de fachada", "Textura e grafiato"] },
  { id: 5, name: "Juliana Prado", role: "Diarista", cat: "limpeza", bairro: "Vila Mariana", city: "São Paulo", rating: 5.0, reviews: 203, dist: "0,9 km", desc: "Limpeza residencial completa, pontual e detalhada.", exp: "10 anos de experiência", services: ["Limpeza geral", "Limpeza pós-obra", "Organização de ambientes"] },
  { id: 6, name: "Paulo Ramos", role: "Jardineiro", cat: "jardinagem", bairro: "Perdizes", city: "São Paulo", rating: 4.5, reviews: 41, dist: "3,6 km", desc: "Poda, manutenção de jardins e paisagismo básico.", exp: "8 anos de experiência", services: ["Poda de árvores", "Manutenção de grama", "Plantio"] },
  { id: 7, name: "Fernanda Lima", role: "Montadora de Móveis", cat: "montagem", bairro: "Saúde", city: "São Paulo", rating: 4.9, reviews: 112, dist: "2,7 km", desc: "Montagem e desmontagem de móveis planejados e modulados.", exp: "6 anos de experiência", services: ["Montagem de armários", "Montagem de camas", "Fixação de prateleiras"] },
  { id: 8, name: "Antônio Cardoso", role: "Técnico de Manutenção", cat: "reparos", bairro: "Ipiranga", city: "São Paulo", rating: 4.4, reviews: 37, dist: "5,1 km", desc: "Pequenos reparos gerais, portas, fechaduras e afins.", exp: "12 anos de experiência", services: ["Troca de fechaduras", "Reparo em portas", "Fixação de itens"] },
  { id: 9, name: "Bruna Martins", role: "Costureira", cat: "costura", bairro: "Moema", city: "São Paulo", rating: 4.8, reviews: 63, dist: "2,0 km", desc: "Ajustes, reparos e confecção de roupas e estofados.", exp: "11 anos de experiência", services: ["Ajuste de roupas", "Reparo de estofados", "Cortinas sob medida"] },
  { id: 10, name: "Eduardo Nascimento", role: "Encanador", cat: "hidraulica", bairro: "Perdizes", city: "São Paulo", rating: 4.5, reviews: 29, dist: "4,4 km", desc: "Instalações hidráulicas para reformas e manutenção geral.", exp: "4 anos de experiência", services: ["Instalação de caixa d'água", "Troca de tubulação", "Reparo em torneiras"] },
];

const reviewsByProId = {
  1: [
    { name: "Ana Beatriz", stars: 5, text: "Muito pontual e explicou tudo antes de começar. Recomendo!" },
    { name: "Rodrigo Martins", stars: 5, text: "Resolveu um problema no quadro de força rapidinho." },
    { name: "Camila Alves", stars: 4, text: "Bom serviço, preço justo pelo trabalho feito." },
  ],
  3: [
    { name: "Felipe Nogueira", stars: 5, text: "Achou o vazamento que outros dois não acharam." },
    { name: "Bianca Tavares", stars: 5, text: "Super educada e cuidadosa com a casa." },
  ],
};

const defaultReviews = [
  { name: "Cliente Arruma Aqui", stars: 5, text: "Serviço muito bom, super recomendo." },
];

function getReviews(proId) {
  return reviewsByProId[proId] || defaultReviews;
}

const user = {
  id: "u1",
  name: "Mariana Costa",
  bairro: "Vila Mariana",
  city: "São Paulo",
  requests: [
    { proId: 1, pro: "Carlos Silva - Eletricista", date: "18 set", status: "Concluído" },
    { proId: 5, pro: "Juliana Prado - Diarista", date: "09 set", status: "Concluído" },
    { proId: 3, pro: "Renata Souza - Encanadora", date: "Em conversa", status: "Em andamento" },
  ],
  myReviews: [
    { proId: 1, pro: "Carlos Silva — Eletricista", stars: 5, text: "Muito atencioso e rápido." },
  ],
};

// conversations is mutable in memory, so POST /messages can append to it.
const conversations = [
  {
    id: 1,
    proId: 1,
    name: "Carlos Silva",
    role: "Eletricista",
    time: "09:41",
    messages: [
      { from: "them", text: "Olá! Vi seu pedido sobre a instalação do chuveiro." },
      { from: "me", text: "Oi Carlos, sim! Pode ser ainda essa semana?" },
      { from: "them", text: "Consigo realizar o serviço amanhã de manhã, pode ser?" },
    ],
  },
  {
    id: 2,
    proId: 3,
    name: "Renata Souza",
    role: "Encanadora",
    time: "Ontem",
    messages: [
      { from: "me", text: "Boa tarde! Tenho um vazamento embaixo da pia." },
      { from: "them", text: "Boa tarde, posso verificar o vazamento amanhã às 14h." },
    ],
  },
  {
    id: 3,
    proId: 5,
    name: "Juliana Prado",
    role: "Diarista",
    time: "Seg",
    messages: [
      { from: "them", text: "Consigo ir na quinta-feira de manhã." },
      { from: "me", text: "Perfeito!" },
      { from: "them", text: "Combinado! Até quinta-feira." },
    ],
  },
];

module.exports = { categories, professionals, getReviews, user, conversations };
