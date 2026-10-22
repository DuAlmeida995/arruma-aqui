const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCategories: () => request("/categories"),
  getProfessionals: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ""))
    ).toString();
    return request(`/professionals${qs ? `?${qs}` : ""}`);
  },
  getProfessional: (id) => request(`/professionals/${id}`),
  getConversations: () => request("/conversations"),
  getConversation: (id) => request(`/conversations/${id}`),
  sendMessage: (id, text) =>
    request(`/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ text }) }),
  getUser: () => request("/user/me"),
};
