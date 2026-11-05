// Repositório de usuários em memória para testes (mesma interface de repositories/users.js)
export function fakeUsers() {
  const rows = [];
  let id = 1;
  return {
    rows,
    async findByEmail(email) {
      return rows.find((u) => u.email === email.toLowerCase() && !u.deleted) || null;
    },
    async findById(uid) {
      return rows.find((u) => u.id === uid && !u.deleted) || null;
    },
    async create({ name, email, passwordHash, role, phone, bairro, city, lat, lng }) {
      const u = { id: id++, name, email: email.toLowerCase(), password_hash: passwordHash, role, phone, bairro, city, lat, lng };
      rows.push(u);
      return u;
    },
    async update(uid, { name, phone, bairro, lat, lng }) {
      const u = rows.find((r) => r.id === uid && !r.deleted);
      if (!u) return null;
      Object.assign(u, { name, phone, bairro, city: "São Paulo", lat, lng });
      return u;
    },
    async anonymize(uid) {
      const u = rows.find((r) => r.id === uid);
      Object.assign(u, { name: "Usuário removido", email: `removido-${uid}@removido.invalid`, password_hash: "!", deleted: true });
    },
  };
}
