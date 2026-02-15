import { NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Sessions from "./pages/Sessions";
import Scenarios from "./pages/Scenarios";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

export default function App() {
  return (
    <div style={shell}>
      <aside style={sidebar}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>AIcrew</div>

        <nav style={{ display: "grid", gap: 8 }}>
          <SideLink to="/">Home</SideLink>
          <SideLink to="/sessions">Start a session</SideLink>
          <SideLink to="/scenarios">Scenarios</SideLink>
          <SideLink to="/progress">Progress</SideLink>
          <SideLink to="/settings">Settings</SideLink>
          <SideLink to="/login">Login</SideLink>
        </nav>

        <div style={{ marginTop: "auto", opacity: 0.65, fontSize: 12 }}>
          Local dev • Vite + React
        </div>
      </aside>

      <main style={main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}

function SideLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      style={({ isActive }) => ({
        padding: "10px 12px",
        borderRadius: 12,
        textDecoration: "none",
        color: "inherit",
        border: "1px solid rgba(255,255,255,0.12)",
        background: isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
      })}
    >
      {children}
    </NavLink>
  );
}

const shell: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  minHeight: "100vh",
  fontFamily: "system-ui",
};

const sidebar: React.CSSProperties = {
  padding: 16,
  borderRight: "1px solid rgba(255,255,255,0.12)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const main: React.CSSProperties = {
  padding: 24,
  maxWidth: 1100,
};
