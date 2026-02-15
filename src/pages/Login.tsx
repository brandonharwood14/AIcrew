import { useState } from "react";
import { login, register } from "../lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [status, setStatus] = useState("");

  async function onSubmit() {
    setStatus("");
    try {
      if (mode === "register") await register(email, password);
      await login(email, password);
      setStatus("Logged in. Go to Sessions.");
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h1>{mode === "login" ? "Login" : "Create account"}</h1>

      <label>
        Email
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </label>

      <label style={{ display: "block", marginTop: 12 }}>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </label>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={() => void onSubmit()} style={{ padding: 10 }}>
          {mode === "login" ? "Login" : "Register + login"}
        </button>

        <button
          onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          style={{ padding: 10 }}
        >
          Switch to {mode === "login" ? "Register" : "Login"}
        </button>
      </div>

      {status && <div style={{ marginTop: 12 }}>{status}</div>}
    </div>
  );
}
