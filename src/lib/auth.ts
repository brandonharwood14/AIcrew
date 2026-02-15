const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export type Me = { id: string; email: string; tier: string } | null;

async function readText(res: Response) {
  const t = await res.text();
  return t || `${res.status}`;
}

export async function register(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readText(res));
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readText(res));
  return res.json();
}

export async function logout() {
  const res = await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readText(res));
  return res.json();
}

export async function me(): Promise<Me> {
  const res = await fetch(`${BASE}/auth/me`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readText(res));
  return res.json();
}
