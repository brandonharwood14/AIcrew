import { useEffect, useMemo, useRef, useState } from "react";
import {
  createSession,
  deleteSession,
  endSession,
  listSessions,
  listTopics,
  type TopicRow,
} from "../lib/api";

type SessionRow = {
  id: string;
  aircraft: string;
  topic: string;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  rating: number | null;
};

function fmt(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function elapsedMinutes(startIso: string, endIso: string | null) {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - start) / 60000));
}

export default function Sessions() {
  // Later: derive from logged-in user tier (Standard=12, Pro=20 etc)
  const CAP_MINUTES = 12;

  const [aircraft, setAircraft] = useState("");
  const [topic, setTopic] = useState("");
  const [topicSearch, setTopicSearch] = useState("");

  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const [items, setItems] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  // tick so elapsed time updates for active sessions
  const [, setTick] = useState(0);

  const active = useMemo(() => items.find((s) => !s.endedAt) ?? null, [items]);

  const canCreate = useMemo(() => {
    return aircraft.trim() !== "" && topic.trim() !== "" && !saving && !active;
  }, [aircraft, topic, saving, active]);

  async function refreshSessions() {
    setLoading(true);
    setStatus("");
    try {
      const data = (await listSessions()) as SessionRow[];
      setItems(data);
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshSessions();
  }, []);

  // tick timer (for active session UX)
  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Load topics when aircraft changes
  useEffect(() => {
    const a = aircraft.trim();
    setTopics([]);
    setTopic("");
    setTopicSearch("");

    if (!a) return;

    let cancelled = false;
    const handle = window.setTimeout(() => {
      void (async () => {
        setTopicsLoading(true);
        try {
          const data = await listTopics(a);
          if (!cancelled) setTopics(data);
        } catch (e: unknown) {
          if (!cancelled) setStatus(e instanceof Error ? e.message : "Failed to load topics");
        } finally {
          if (!cancelled) setTopicsLoading(false);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [aircraft]);

  // Auto-end if cap reached (guard against repeat fire)
  const autoEndRef = useRef(false);
  useEffect(() => {
    if (!active) {
      autoEndRef.current = false;
      return;
    }

    const used = elapsedMinutes(active.startedAt, active.endedAt);
    if (used >= CAP_MINUTES && !autoEndRef.current) {
      autoEndRef.current = true;
      void (async () => {
        try {
          await endSession(active.id);
          await refreshSessions();
          setStatus(`Session auto-ended at ${CAP_MINUTES} minutes (cap).`);
        } catch (e: unknown) {
          setStatus(e instanceof Error ? e.message : "Failed to auto-end session");
        }
      })();
    }
  }, [active, CAP_MINUTES]);

  async function onCreate() {
    setStatus("");

    if (active) {
      setStatus("You already have an active session. End it before starting a new one.");
      return;
    }
    if (aircraft.trim() === "") {
      setStatus("Aircraft is required.");
      return;
    }
    if (topic.trim() === "") {
      setStatus("Topic is required.");
      return;
    }

    setSaving(true);
    try {
      await createSession({ aircraft: aircraft.trim(), topic: topic.trim() });
      await refreshSessions();
      setStatus("Session started.");
      // keep aircraft so user can quickly start another later; reset topic
      setTopic("");
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Failed to start session");
    } finally {
      setSaving(false);
    }
  }

  async function onEnd(id: string) {
    setStatus("");
    try {
      await endSession(id);
      await refreshSessions();
      setStatus("Session ended.");
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Failed to end session");
    }
  }

  async function onDelete(id: string) {
    setStatus("");
    try {
      await deleteSession(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setStatus("Deleted.");
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Failed to delete session");
    }
  }

  const activeUsed = active ? elapsedMinutes(active.startedAt, active.endedAt) : 0;
  const remaining = Math.max(0, CAP_MINUTES - activeUsed);
  const progress = CAP_MINUTES > 0 ? Math.min(1, activeUsed / CAP_MINUTES) : 0;

const topicsByCategory = useMemo(() => {
  const q = topicSearch.trim().toLowerCase();

  const filtered = q
    ? topics.filter((t) => {
        const title = t.title.toLowerCase();
        const cat = (t.category ?? "general").toLowerCase();
        return title.includes(q) || cat.includes(q);
      })
    : topics;

  const map = new Map<string, TopicRow[]>();
  for (const t of filtered) {
    const key = (t.category ?? "General").trim() || "General";
    const list = map.get(key) ?? [];
    list.push(t);
    map.set(key, list);
  }

  const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [, list] of entries) list.sort((a, b) => a.title.localeCompare(b.title));
  return entries;
}, [topics, topicSearch]);

  return (
    <div style={{ maxWidth: 980 }}>
      <h1>Sessions</h1>

      <div style={{ display: "grid", gap: 10, maxWidth: 560 }}>
        <label>
          Aircraft
          <input
            value={aircraft}
            onChange={(e) => setAircraft(e.target.value.toUpperCase())}
            placeholder="e.g. F100"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          Search topics
          <input
            value={topicSearch}
            onChange={(e) => setTopicSearch(e.target.value)}
            placeholder="Type to filter (e.g. hydraulic, RTO, approach)"
            disabled={!aircraft.trim() || topicsLoading || topics.length === 0}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          Topic
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={!aircraft.trim() || topicsLoading || topics.length === 0}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          >
            {!aircraft.trim() ? (
              <option value="">Enter aircraft first</option>
            ) : topicsLoading ? (
              <option value="">Loading topics…</option>
            ) : topics.length === 0 ? (
              <option value="">No topics for this aircraft (seed them)</option>
            ) : (
            <>
              <option value="">
                Select a topic… ({topics.length} total)
              </option>

              {topicsByCategory.length === 0 ? (
                <option value="">No topics match your search</option>
              ) : (
                topicsByCategory.map(([cat, list]) => (
                  <optgroup key={cat} label={cat}>
                    {list.map((t) => (
                      <option key={t.id} value={t.title}>
                        {t.title}
                      </option>
                    ))}
                  </optgroup>
                ))
              )}
            </>
            )}
          </select>
        </label>

        <button
          onClick={() => void onCreate()}
          disabled={!canCreate}
          style={{
            padding: 12,
            marginTop: 4,
            cursor: canCreate ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          {saving ? "Starting..." : active ? "Session active" : "Start session"}
        </button>

        {active && (
          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ fontWeight: 700 }}>Active session</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Cap: {CAP_MINUTES} min</div>
            </div>

            <div style={{ marginTop: 8, fontWeight: 600 }}>
              {active.aircraft} — {active.topic}
            </div>

            <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
              <div>
                Started: <span style={{ fontFamily: "monospace" }}>{fmt(active.startedAt)}</span>
              </div>
              <div>
                Used: <b>{activeUsed} min</b> • Remaining: <b>{remaining} min</b>
              </div>

              <progress value={progress} max={1} style={{ width: "100%", height: 14 }} />
              {remaining <= 2 ? (
                <div style={{ fontSize: 12, color: "#b45309" }}>
                  Nearly at cap — session will auto-end when it hits {CAP_MINUTES} minutes.
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
              <button
                onClick={() => void onEnd(active.id)}
                style={{ padding: "10px 12px", fontWeight: 700 }}
              >
                End session
              </button>
            </div>
          </div>
        )}

        {status && <div style={{ marginTop: 6 }}>{status}</div>}
      </div>

      <hr style={{ margin: "24px 0" }} />

      <h2>Recent sessions</h2>
      {loading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div>No sessions yet.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: 8 }}>Started</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: 8 }}>Ended</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: 8 }}>Aircraft</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: 8 }}>Topic</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: 8 }}>Elapsed</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: 8 }} />
            </tr>
          </thead>
          <tbody>
            {items.map((s) => {
              const el = elapsedMinutes(s.startedAt, s.endedAt);
              return (
                <tr key={s.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{fmt(s.startedAt)}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{s.endedAt ? fmt(s.endedAt) : "—"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{s.aircraft}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{s.topic}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{el} min</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "right" }}>
                    {!s.endedAt ? (
                      <button onClick={() => void onEnd(s.id)} style={{ padding: "8px 10px", marginRight: 8 }}>
                        End
                      </button>
                    ) : null}
                    <button onClick={() => void onDelete(s.id)} style={{ padding: "8px 10px" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
