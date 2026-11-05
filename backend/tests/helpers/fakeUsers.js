// Repositório de usuários em memória para testes (mesma interface de repositories/users.js)
export function fakeUsers() {
  const rows = [];
  let id = 1;
  return {
    rows,
    async findByEmail(email) {
      return rows.find((u) => u.email === email.toLowerCase()) || null;
    },
    async findById(uid) {
      return rows.find((u) => u.id === uid) || null;
    },
    async create({ name, email, passwordHash, role, phone, bairro, city, lat, lng }) {
      const u = { id: id++, name, email: email.toLowerCase(), password_hash: passwordHash, role, phone, bairro, city, lat, lng };
      rows.push(u);
      return u;
    },
  };
}
