// server/index.ts
import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import argon2 from "argon2";

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL; // e.g. file:./dev.db
if (!url) throw new Error("DATABASE_URL is missing. Check your .env file.");

const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const app = express();

// IMPORTANT: allow cookies from Vite
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const COOKIE_NAME = "aicrew_session";

// 30 days
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function newToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

type AuthedRequest = Request & {
  user?: { id: string; email: string; tier: string };
  sessionId?: string;
};

async function authMiddleware(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) return next();

  const tokenHash = sha256(token);

  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return next();

  // Expired? delete it and move on
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.authSession.delete({ where: { id: session.id } }).catch(() => {});
    return next();
  }

  req.user = { id: session.user.id, email: session.user.email, tier: session.user.tier };
  return next();
}

function requireAuth(req: AuthedRequest, res: Response): req is AuthedRequest & { user: NonNullable<AuthedRequest["user"]> } {
  if (!req.user) {
    res.status(401).json({ error: "Not logged in" });
    return false;
  }
  return true;
}

app.use(authMiddleware);

// Health
app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

// ---------- AUTH ----------
app.post("/auth/register", async (req: Request, res: Response) => {
  const { email, password } = (req.body ?? {}) as { email?: unknown; password?: unknown };

  if (typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const normalized = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const user = await prisma.user.create({
    data: { email: normalized, passwordHash, tier: "STANDARD" },
    select: { id: true, email: true, tier: true },
  });

  return res.status(201).json(user);
});

app.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = (req.body ?? {}) as { email?: unknown; password?: unknown };

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email + password required" });
  }

  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Avoid leaking “email exists”
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = newToken();
  const tokenHash = sha256(token);

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.authSession.create({
    data: { tokenHash, userId: user.id, expiresAt },
  });

  // httpOnly cookie so JS can’t read it
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // localhost only; set true when behind HTTPS
    expires: expiresAt,
  });

  return res.json({ id: user.id, email: user.email, tier: user.tier });
});

app.post("/auth/logout", async (req: Request, res: Response) => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (token) {
    const tokenHash = sha256(token);
    await prisma.authSession.delete({ where: { tokenHash } }).catch(() => {});
  }
  res.clearCookie(COOKIE_NAME);
  return res.json({ ok: true });
});

app.get("/auth/me", async (req: AuthedRequest, res: Response) => {
  if (!req.user) return res.json(null);
  return res.json(req.user);
});

// ---------- TOPICS ----------
app.get("/topics", async (req: Request, res: Response) => {
  const aircraft = typeof req.query.aircraft === "string" ? req.query.aircraft.trim() : "";
  if (!aircraft) return res.status(400).json({ error: "aircraft is required" });

  const topics = await prisma.topic.findMany({
    where: { aircraft },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  res.json(topics);
});

// DEV ONLY seed
app.post("/topics/seed", async (_req: Request, res: Response) => {
  const aircraft = "F100";
  const seed = [
    { title: "Non-precision approaches", category: "Approach" },
    { title: "Engine start limitations", category: "Engines" },
    { title: "Rejected takeoff (RTO)", category: "Takeoff" },
    { title: "Hydraulic system overview", category: "Systems" },
    { title: "Electrical abnormal procedures", category: "Abnormals" },
  ];

  // Prisma 7 note: if createMany doesn't support skipDuplicates in your setup,
  // do a simple upsert loop.
  for (const t of seed) {
    await prisma.topic.upsert({
      where: { aircraft_title: { aircraft, title: t.title } },
      update: { category: t.category ?? null },
      create: { aircraft, title: t.title, category: t.category ?? null },
    });
  }

  return res.json({ ok: true, insertedOrUpdated: seed.length });
});

// ---------- SESSIONS (AUTH REQUIRED) ----------
app.get("/sessions", async (req: AuthedRequest, res: Response) => {
  if (!requireAuth(req, res)) return;

  const sessions = await prisma.session.findMany({
    where: { userId: req.user.id },
    orderBy: { startedAt: "desc" },
  });

  res.json(sessions);
});

app.get("/sessions/active", async (req: AuthedRequest, res: Response) => {
  if (!requireAuth(req, res)) return;

  const active = await prisma.session.findFirst({
    where: { userId: req.user.id, endedAt: null },
    orderBy: { startedAt: "desc" },
  });

  res.json(active);
});

app.post("/sessions", async (req: AuthedRequest, res: Response) => {
  if (!requireAuth(req, res)) return;

  const { aircraft, topic } = (req.body ?? {}) as { aircraft?: unknown; topic?: unknown };

  if (typeof aircraft !== "string" || aircraft.trim() === "") {
    return res.status(400).json({ error: "Aircraft is required" });
  }
  if (typeof topic !== "string" || topic.trim() === "") {
    return res.status(400).json({ error: "Topic is required" });
  }

  // Only one active session at a time per user
  const existingActive = await prisma.session.findFirst({
    where: { userId: req.user.id, endedAt: null },
  });
  if (existingActive) return res.status(409).json({ error: "You already have an active session" });

  const created = await prisma.session.create({
    data: { userId: req.user.id, aircraft: aircraft.trim(), topic: topic.trim() },
  });

  return res.status(201).json(created);
});

app.post("/sessions/:id/end", async (req: AuthedRequest, res: Response) => {
  if (!requireAuth(req, res)) return;

  const raw = req.params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;

  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user.id) return res.status(404).json({ error: "Session not found" });
  if (existing.endedAt) return res.status(409).json({ error: "Session already ended" });

  const updated = await prisma.session.update({
    where: { id },
    data: { endedAt: new Date() },
  });

  return res.json(updated);
});

app.delete("/sessions/:id", async (req: AuthedRequest, res: Response) => {
  if (!requireAuth(req, res)) return;

  const raw = req.params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;

  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user.id) return res.status(404).json({ error: "Session not found" });

  await prisma.session.delete({ where: { id } });
  return res.status(204).send();
});

app.listen(3001, "localhost", () => {
  console.log("API on http://localhost:3001");
});
