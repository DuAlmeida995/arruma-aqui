const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TOKEN_KEY = "arrumaaqui.token";

// O token fica no localStorage; leitura/escrita protegidas (modo privado pode bloquear).
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* sem persistência: a sessão dura só enquanto a aba estiver aberta */
    }
  },
};

// Avisado quando a API responde 401 (sessão expirada) para o app voltar ao login.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, options = {}) {
  const token = tokenStore.get();
  const controller = new AbortController();
  // Dá tempo para o backend de demonstração acordar, sem esperar indefinidamente.
  const timer = setTimeout(() => controller.abort(), 65000);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401 && token) onUnauthorized();
      const err = new Error(body.error || "Não foi possível concluir a solicitação. Tente novamente em instantes.");
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } catch (err) {
    if (controller.signal.aborted) throw new Error("O servidor demorou para responder. Confira se a ação foi concluída antes de tentar novamente.");
    if (err.status) throw err;
    throw new Error("Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.");
  } finally {
    clearTimeout(timer);
  }
}

const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body) });

export const api = {
  login: (email, password) => post("/auth/login", { email, password }),
  register: (data) => post("/auth/register", data),
  me: () => request("/auth/me"),
  updateMe: (data) => request("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
  deleteMe: (password) => request("/auth/me", { method: "DELETE", body: JSON.stringify({ password }) }),
  getBairros: () => request("/bairros"),
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
  sendMessage: (id, text) => post(`/conversations/${id}/messages`, { text }),
  markServiceDone: (id) => post(`/conversations/${id}/service`, {}),
  reviewService: (id, stars, text) => post(`/conversations/${id}/review`, { stars, text }),
  answerSatisfaction: (id, score) => post(`/conversations/${id}/satisfaction`, { score }),
  startConversation: (providerId, text, requestId) => post("/conversations", { providerId: Number(providerId), text, requestId }),
  getUser: () => request("/user/me"),
  createRequest: (data) => post("/requests", data),
  getRequests: () => request("/requests"),
  getRequest: (id) => request(`/requests/${id}`),
  closeRequest: (id) => post(`/requests/${id}/close`, {}),
  getProviderProfile: () => request("/provider/profile"),
  getProviderDashboard: () => request("/provider/dashboard"),
  getMetrics: (params = {}) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();
    return request(`/admin/metrics${qs ? `?${qs}` : ""}`);
  },
  saveProviderProfile: (data) => request("/provider/profile", { method: "PUT", body: JSON.stringify(data) }),
};
