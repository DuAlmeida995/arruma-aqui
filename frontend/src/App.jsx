import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav.jsx";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import Profile from "./pages/Profile.jsx";
import ChatList from "./pages/ChatList.jsx";
import ChatThread from "./pages/ChatThread.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import Settings from "./pages/Settings.jsx";
import { Login, Register } from "./pages/AuthPages.jsx";
import ProviderProfileForm from "./pages/ProviderProfileForm.jsx";
import AccountSettings from "./pages/AccountSettings.jsx";
import { NewRequest, RequestDetail } from "./pages/Requests.jsx";
import { AuthProvider, RequireAuth } from "./auth.jsx";

const protectedRoutes = [
  ["/", Home],
  ["/buscar", Search],
  ["/profissional/:id", Profile],
  ["/chat", ChatList],
  ["/chat/:id", ChatThread],
  ["/perfil", UserProfile],
  ["/configuracoes", Settings],
  ["/prestador/perfil", ProviderProfileForm],
  ["/conta", AccountSettings],
  ["/pedido/novo", NewRequest],
  ["/pedido/:id", RequestDetail],
];

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <AuthProvider>
      <div className="max-w-[430px] mx-auto bg-bg min-h-screen flex flex-col relative sm:shadow-[0_0_80px_-20px_rgba(20,23,31,.25)]">
        <Routes>
          <Route path="/entrar" element={<Login />} />
          <Route path="/criar-conta" element={<Register />} />
          {protectedRoutes.map(([path, Page]) => (
            <Route
              key={path}
              path={path}
              element={
                <RequireAuth>
                  <Page />
                </RequireAuth>
              }
            />
          ))}
        </Routes>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
