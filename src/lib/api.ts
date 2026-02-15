const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

type ApiErrorShape = { error?: string };

async function readError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as ApiErrorShape;
    return json.error ?? text;
  } catch {
    return text;
  }
}
//#region topic management
// API function allowing DB driven topic management
// src/lib/api.ts

export type TopicRow = {
  id: string;
  aircraft: string;
  title: string;
  category: string | null;
  createdAt: string;
};

export async function listTopics(aircraft: string): Promise<TopicRow[]> {
  const a = aircraft.trim();
  if (!a) return [];

  const res = await fetch(`${BASE}/topics?aircraft=${encodeURIComponent(a)}`, 
  {
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await readError(res);
    throw new Error(`GET /topics failed: ${res.status} ${msg}`);
  }

  return (await res.json()) as TopicRow[];
}

//#endregion end topic management

export async function createSession(input: { aircraft: string; topic: string }) {
  const res = await fetch(`${BASE}/sessions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listSessions() {
  const res = await fetch(`${BASE}/sessions`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteSession(id: string) {
  const res = await fetch(`${BASE}/sessions/${id}`, 
    { method: "DELETE", 
      credentials: "include" });
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
}

export async function getActiveSession() {
  const res = await fetch(`${BASE}/sessions/active`, {
    credentials: "include"
  });

  if (!res.ok) {
    const msg = await readError(res);
    throw new Error(`GET /sessions/active failed: ${res.status} ${msg}`);
  }

  return res.json();
}

export async function endSession(id: string) {
  const res = await fetch(`${BASE}/sessions/${id}/end`, 
    { method: "POST", credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
