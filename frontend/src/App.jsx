import { Routes, Route } from "react-router-dom";
import BottomNav from "./components/BottomNav.jsx";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import Profile from "./pages/Profile.jsx";
import ChatList from "./pages/ChatList.jsx";
import ChatThread from "./pages/ChatThread.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <div className="max-w-[430px] mx-auto bg-bg min-h-screen flex flex-col relative">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buscar" element={<Search />} />
        <Route path="/profissional/:id" element={<Profile />} />
        <Route path="/chat" element={<ChatList />} />
        <Route path="/chat/:id" element={<ChatThread />} />
        <Route path="/perfil" element={<UserProfile />} />
        <Route path="/configuracoes" element={<Settings />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
