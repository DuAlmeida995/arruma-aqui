import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { api, setUnauthorizedHandler, tokenStore } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => tokenStore.get());
  const [user, setUser] = useState(null);
  // "checking" enquanto valida um token salvo de uma visita anterior
  const [status, setStatus] = useState(() => (tokenStore.get() ? "checking" : "anonymous"));

  const saveSession = useCallback((data) => {
    tokenStore.set(data.token);
    setToken(data.token);
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate("/entrar", { replace: true, state: { expired: true } });
    });
  }, [logout, navigate]);

  useEffect(() => {
    if (!token || status !== "checking") return;
    api
      .me()
      .then(({ user }) => {
        setUser(user);
        setStatus("authenticated");
      })
      .catch(logout);
  }, [token, status, logout]);

  const value = useMemo(
    () => ({
      user,
      status,
      login: async (email, password) => saveSession(await api.login(email, password)),
      register: async (data) => saveSession(await api.register(data)),
      logout,
    }),
    [user, status, saveSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// Envolve telas que exigem login
export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "checking") {
    return <div className="flex-1 flex items-center justify-center text-inksoft font-semibold">Carregando…</div>;
  }
  if (status !== "authenticated") return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  return children;
}
