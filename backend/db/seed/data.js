// Gerador determinístico da base fictícia (Atividade 2 do doc FAPESP).
// Nenhum dado pessoal real: nomes combinados aleatoriamente, e-mails @exemplo.com.
// Coordenadas = centro aproximado do bairro + ruído de ~300 m (nunca endereço).
//
// Casos-limite incluídos de propósito:
//  - prestadores sem nenhuma avaliação (novatos)
//  - região com poucos profissionais (Parelheiros, extremo sul)
//  - notas empatadas (mesma média e mesmo nº de avaliações)
//  - prestador com raio pequeno, fora da área da maioria dos clientes
//  - prestador inativo (não deve aparecer na busca)
//  - prestador sem disponibilidade cadastrada

const DEMO_PASSWORD = "demo1234"; // senha de todas as contas fictícias (só para demo/teste)

const categories = [
  { id: "eletrica", label: "Elétrica", icon: "bolt", roles: { m: "Eletricista", f: "Eletricista" }, services: ["Instalação elétrica", "Troca de disjuntores", "Chuveiro elétrico", "Tomadas e interruptores", "Quadro de força"] },
  { id: "hidraulica", label: "Hidráulica", icon: "droplet", roles: { m: "Encanador", f: "Encanadora" }, services: ["Reparo de vazamentos", "Desentupimento", "Troca de registros", "Instalação de metais", "Caixa d'água"] },
  { id: "limpeza", label: "Limpeza", icon: "sparkle", roles: { m: "Diarista", f: "Diarista" }, services: ["Limpeza geral", "Limpeza pós-obra", "Organização de ambientes"] },
  { id: "pintura", label: "Pintura", icon: "brush", roles: { m: "Pintor", f: "Pintora" }, services: ["Pintura interna", "Pintura de fachada", "Textura e grafiato", "Massa corrida"] },
  { id: "jardinagem", label: "Jardinagem", icon: "sprout", roles: { m: "Jardineiro", f: "Jardineira" }, services: ["Poda", "Manutenção de grama", "Plantio", "Paisagismo básico"] },
  { id: "montagem", label: "Montagem", icon: "wrench", roles: { m: "Montador de Móveis", f: "Montadora de Móveis" }, services: ["Montagem de armários", "Montagem de camas", "Fixação de prateleiras", "Desmontagem para mudança"] },
  { id: "reparos", label: "Reparos", icon: "box", roles: { m: "Técnico de Manutenção", f: "Técnica de Manutenção" }, services: ["Troca de fechaduras", "Reparo em portas", "Fixação de itens", "Pequenos reparos"] },
  { id: "costura", label: "Costura", icon: "scissors", roles: { m: "Alfaiate", f: "Costureira" }, services: ["Ajuste de roupas", "Reparo de estofados", "Cortinas sob medida"] },
];

// Centro aproximado de bairros de São Paulo [lat, lng]
const bairros = {
  "Vila Mariana": [-23.5891, -46.6346],
  "Saúde": [-23.6178, -46.6390],
  "Ipiranga": [-23.5893, -46.6062],
  "Moema": [-23.6006, -46.6656],
  "Perdizes": [-23.5365, -46.6763],
  "Pinheiros": [-23.5667, -46.6919],
  "Tatuapé": [-23.5403, -46.5763],
  "Santana": [-23.5025, -46.6253],
  "Butantã": [-23.5717, -46.7086],
  "Mooca": [-23.5596, -46.5996],
  "Lapa": [-23.5233, -46.7036],
  "Jabaquara": [-23.6454, -46.6420],
  "Parelheiros": [-23.8278, -46.7286], // região com poucos profissionais
};

const firstNames = ["Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Fábio", "Gabriela", "Hugo", "Isabela", "João", "Karina", "Lucas", "Mariana", "Nelson", "Olívia", "Pedro", "Quésia", "Rafael", "Sílvia", "Tiago", "Úrsula", "Vitor", "Wesley", "Yara", "Zeca", "Patrícia", "Rogério", "Luana", "Márcio", "Tânia"];
const lastNames = ["Silva", "Souza", "Oliveira", "Santos", "Lima", "Pereira", "Costa", "Ferreira", "Almeida", "Ribeiro", "Carvalho", "Gomes", "Martins", "Rocha", "Barbosa", "Araújo", "Teixeira", "Moreira", "Cardoso", "Nunes"];

const reviewTexts = {
  5: ["Excelente, super pontual e caprichoso.", "Resolveu rápido e deixou tudo limpo.", "Recomendo de olhos fechados.", "Explicou tudo antes de começar, muito profissional."],
  4: ["Bom serviço, preço justo.", "Chegou um pouco atrasado, mas fez um ótimo trabalho.", "Trabalho bem feito, voltaria a contratar."],
  3: ["Serviço ok, demorou mais do que o combinado.", "Resolveu, mas a comunicação podia ser melhor."],
  2: ["Precisei chamar de novo para terminar.", "Não cumpriu o horário combinado."],
  1: ["Não resolveu o problema."],
};

const femaleNames = new Set(["Ana", "Carla", "Eduarda", "Gabriela", "Isabela", "Karina", "Mariana", "Olívia", "Quésia", "Sílvia", "Úrsula", "Yara", "Patrícia", "Luana", "Tânia"]);
const isFemale = (fullName) => femaleNames.has(fullName.split(" ")[0]);

// PRNG determinístico (mulberry32) para a base ser sempre igual
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slug(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".");
}

function buildSeed({ seed = 42, providerCount = 60, clientCount = 15 } = {}) {
  const rand = rng(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const describe = (cat, bairro) => {
    const a = pick(cat.services);
    const rest = cat.services.filter((x) => x !== a);
    return `${a} e ${pick(rest).toLowerCase()}, com atendimento em ${bairro} e região.`;
  };
  const jitter = () => (rand() - 0.5) * 0.006; // ~±300 m
  const usedEmails = new Set();
  const users = [];
  let nextId = 1;

  function makeUser(role, bairro) {
    let name, email;
    do {
      name = `${pick(firstNames)} ${pick(lastNames)}`;
      email = `${slug(name)}${role === "provider" ? "" : ".cliente"}@exemplo.com`;
    } while (usedEmails.has(email));
    usedEmails.add(email);
    const [lat, lng] = bairros[bairro];
    const u = { id: nextId++, name, email, role, bairro, city: "São Paulo", lat: lat + jitter(), lng: lng + jitter(), phone: null };
    users.push(u);
    return u;
  }

  // Admin e cliente de demonstração fixos (credenciais conhecidas para a apresentação)
  users.push({ id: nextId++, name: "Admin Arruma Aqui", email: "admin@exemplo.com", role: "admin", bairro: null, city: "São Paulo", lat: null, lng: null, phone: null });
  const [dLat, dLng] = bairros["Vila Mariana"];
  users.push({ id: nextId++, name: "Mariana Costa", email: "cliente@exemplo.com", role: "client", bairro: "Vila Mariana", city: "São Paulo", lat: dLat, lng: dLng, phone: null });

  const mainBairros = Object.keys(bairros).filter((b) => b !== "Parelheiros");
  for (let i = 0; i < clientCount; i++) makeUser("client", pick(mainBairros));
  const clients = users.filter((u) => u.role === "client");

  const providers = [];
  const providerCategories = [];
  const availability = [];

  for (let i = 0; i < providerCount; i++) {
    const cat = categories[i % categories.length];
    const bairro = i < 2 ? "Parelheiros" : pick(mainBairros);
    const u = makeUser("provider", bairro);
    const p = {
      user_id: u.id,
      role_title: isFemale(u.name) ? cat.roles.f : cat.roles.m,
      description: describe(cat, bairro),
      experience_years: 1 + Math.floor(rand() * 15),
      bairro,
      city: "São Paulo",
      lat: u.lat,
      lng: u.lng,
      radius_km: pick([5, 8, 10, 12, 15]),
      active: true,
      whatsapp: `11 9${String(10000000 + Math.floor(rand() * 89999999)).slice(0, 8)}`,
      avg_response_minutes: 5 + Math.floor(rand() * 240),
      tags: [],
    };
    providers.push(p);
    const svc = cat.services.filter(() => rand() > 0.4);
    providerCategories.push({ provider_id: u.id, category_id: cat.id, services: svc.length ? svc : [cat.services[0]] });
    // ~20% atendem também uma segunda categoria
    if (rand() < 0.2) {
      const other = categories[(i + 3) % categories.length];
      providerCategories.push({ provider_id: u.id, category_id: other.id, services: [other.services[0]] });
    }
    // Disponibilidade: dias úteis, alguns também sábado
    for (let d = 1; d <= 5; d++) if (rand() > 0.2) availability.push({ provider_id: u.id, weekday: d, start_time: "08:00", end_time: "18:00" });
    if (rand() > 0.5) availability.push({ provider_id: u.id, weekday: 6, start_time: "08:00", end_time: "13:00" });
  }

  // --- Casos-limite marcados ---
  const tag = (idx, t) => providers[idx].tags.push(t);
  tag(0, "poucos_na_regiao");
  tag(1, "poucos_na_regiao");
  // novatos sem avaliação
  [10, 11, 12, 13].forEach((i) => tag(i, "sem_avaliacao"));
  // raio pequeno: atende só o próprio bairro
  providers[20].radius_km = 1;
  tag(20, "raio_pequeno");
  // inativo
  providers[21].active = false;
  tag(21, "inativo");
  // sem disponibilidade
  const noAvail = providers[22].user_id;
  for (let k = availability.length - 1; k >= 0; k--) if (availability[k].provider_id === noAvail) availability.splice(k, 1);
  tag(22, "sem_disponibilidade");
  // empatados: mesma categoria, mesmas notas
  tag(24, "empate");
  tag(32, "empate"); // 24 % 8 === 32 % 8 → mesma categoria

  // --- Contatos, mensagens, serviços e avaliações ---
  const contacts = [];
  const messages = [];
  const services = [];
  const reviews = [];
  const tieStars = [5, 4, 5, 5];

  providers.forEach((p) => {
    if (p.tags.includes("sem_avaliacao")) return;
    const isTie = p.tags.includes("empate");
    const n = isTie ? tieStars.length : Math.floor(rand() * 9) + 1;
    const quality = 3 + rand() * 2; // prestador "médio" entre 3 e 5
    for (let k = 0; k < n; k++) {
      const client = clients[(p.user_id + k) % clients.length];
      const contactId = contacts.length + 1;
      const daysAgo = 5 + Math.floor(rand() * 120);
      contacts.push({ id: contactId, client_id: client.id, provider_id: p.user_id, days_ago: daysAgo, responded_after_min: p.avg_response_minutes });
      messages.push({ contact_id: contactId, sender_id: client.id, text: "Olá! Vi seu perfil no Arruma Aqui, você atende esta semana?", days_ago: daysAgo });
      messages.push({ contact_id: contactId, sender_id: p.user_id, text: "Olá! Atendo sim, podemos combinar o melhor horário.", days_ago: daysAgo });
      const serviceId = services.length + 1;
      services.push({ id: serviceId, contact_id: contactId, client_id: client.id, provider_id: p.user_id, days_ago: daysAgo - 2 });
      const stars = isTie ? tieStars[k] : Math.max(1, Math.min(5, Math.round(quality + (rand() - 0.5) * 2)));
      reviews.push({ service_id: serviceId, client_id: client.id, provider_id: p.user_id, stars, text: pick(reviewTexts[stars]), days_ago: daysAgo - 2 });
    }
  });

  return {
    password: DEMO_PASSWORD,
    categories: categories.map(({ id, label, icon }) => ({ id, label, icon })),
    users,
    providers,
    providerCategories,
    availability,
    contacts,
    messages,
    services,
    reviews,
  };
}

module.exports = { buildSeed, DEMO_PASSWORD, bairros };
