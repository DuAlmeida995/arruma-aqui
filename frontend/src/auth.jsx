import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { api, setUnauthorizedHandler, tokenStore } from "./api.js";

import { LoadError } from "./components/LoadState.tsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => tokenStore.get());
  const [user, setUser] = useState(null);
  const [sessionError, setSessionError] = useState("");
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
    let active = true;
    setSessionError("");
    api
      .me()
      .then(({ user }) => {
        if (!active) return;
        setUser(user);
        setStatus("authenticated");
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 401) logout();
        else { setSessionError(err.message); setStatus("unavailable"); }
      });
    return () => { active = false; };
  }, [token, status, logout]);

  const value = useMemo(
    () => ({
      user,
      status,
      sessionError,
      retrySession: () => setStatus("checking"),
      login: async (email, password) => saveSession(await api.login(email, password)),
      register: async (data) => saveSession(await api.register(data)),
      updateUser: async (data) => {
        const { user } = await api.updateMe(data);
        setUser(user);
        return user;
      },
      deleteAccount: async (password) => {
        await api.deleteMe(password);
        logout();
      },
      logout,
    }),
    [user, status, sessionError, saveSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// Envolve telas que exigem login
export function RequireAuth({ children }) {
  const { status, sessionError, retrySession, logout } = useAuth();
  const location = useLocation();
  if (status === "checking") {
    return <div className="flex-1 flex items-center justify-center text-inksoft font-semibold">Carregando…</div>;
  }
  if (status === "unavailable") return <div className="flex-1 pt-8"><LoadError message={sessionError} onRetry={retrySession} /><button className="mx-5 font-bold text-primary-dark" onClick={logout}>Voltar ao login</button></div>;
  if (status !== "authenticated") return <Navigate to="/entrar" replace state={{ from: location.pathname }} />;
  return children;
}
