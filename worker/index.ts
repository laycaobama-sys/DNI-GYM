// DNI GYM · Cloudflare Worker
// Sirve la web estática (out/) y la API (/api/*) con base de datos D1, sesiones y DNI AI Coach.
import type { Env } from "./env";
import { HttpError, isDay, isId, json, readJson } from "./http";
import { audit, ensureSchema, rateLimit } from "./db";
import {
  adminEmails,
  clearCookie,
  createSession,
  currentUser,
  requireAdmin,
  requireUser,
  sessionCookie,
  sha256Hex,
  toProfile,
  verifyGoogleIdToken,
  type GoogleIdentity,
  type UserRow,
} from "./auth";
import { DEFAULT_MODEL, createGeminiService, type ChatTurn } from "./gemini";
import { ADMIN_SYSTEM, COACH_SYSTEM, WORKOUT_SCHEMA, catalogText, userContext, validateWorkout } from "./coach";
import { getCookie } from "./http";
import { SESSION_COOKIE } from "./auth";

/** Campos del perfil que el propio usuario puede modificar. */
const PROFILE_KEYS = new Set([
  "name", "sex", "birthYear", "heightCm", "activity", "goal", "targetWeight", "weeklyWorkoutsGoal", "calorieGoal", "proteinGoal",
  "carbsGoal", "fatGoal", "waterGoal", "onboarded", "level", "place", "focusAreas", "planSlug", "challenges", "diet", "sessionMinutes",
  "trainTime", "trainDays",
]);
const EVENT_TYPES = new Set(["signup", "login", "logout", "auth_error", "client_error", "visit", "workout_completed", "account_deleted"]);

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : null);
const today = () => new Date().toISOString().slice(0, 10);

async function logEvent(env: Env, e: { type: string; userId?: string | null; email?: string | null; name?: string | null; code?: string | null; message?: string | null; path?: string | null; ua?: string | null; ref?: string | null }) {
  await env.DB.prepare("INSERT INTO events (type, ts, user_id, email, name, code, message, path, ua, ref) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(e.type, Date.now(), e.userId ?? null, e.email ?? null, e.name ?? null, e.code ?? null, e.message ?? null, e.path ?? null, e.ua ?? null, e.ref ?? null)
    .run();
}

// ───────────────────────── autenticación ─────────────────────────

async function loginWithIdentity(env: Env, req: Request, id: GoogleIdentity) {
  const now = Date.now();
  const admins = adminEmails(env);
  const existing = await env.DB.prepare("SELECT * FROM users WHERE id = ? OR email = ?").bind(id.uid, id.email).first<UserRow>();
  let isNew = false;
  if (!existing) {
    isNew = true;
    await env.DB.prepare(
      `INSERT INTO users (id, email, name, photo_url, provider, role, blocked, profile, created_at, last_login_at, last_active_at, login_count)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 1)`,
    )
      .bind(id.uid, id.email, id.name, id.picture, id.provider, admins.includes(id.email) ? "admin" : "user", JSON.stringify({ onboarded: false, weeklyWorkoutsGoal: 3 }), now, now, now)
      .run();
  } else {
    await env.DB.prepare(
      `UPDATE users SET name = COALESCE(name, ?), photo_url = ?, last_login_at = ?, last_active_at = ?, login_count = login_count + 1,
       role = CASE WHEN ? THEN 'admin' ELSE role END WHERE id = ?`,
    )
      .bind(id.name, id.picture, now, now, admins.includes(id.email) ? 1 : 0, existing.id)
      .run();
  }
  const user = (await env.DB.prepare("SELECT * FROM users WHERE id = ? OR email = ?").bind(id.uid, id.email).first<UserRow>())!;
  if (user.blocked) {
    await logEvent(env, { type: "auth_error", userId: user.id, email: user.email, code: "account/blocked", message: "Intento de acceso de una cuenta suspendida", path: "/login" });
    throw new HttpError(403, "Tu cuenta está suspendida. Escríbenos para revisarlo.");
  }
  const token = await createSession(env, user.id, req.headers.get("user-agent"));
  await logEvent(env, { type: isNew ? "signup" : "login", userId: user.id, email: user.email, name: user.name, path: "/login", ua: req.headers.get("user-agent")?.slice(0, 300) });
  return json({ profile: toProfile(user), isAdmin: user.role === "admin", isNew }, 200, { "set-cookie": sessionCookie(token, req) });
}

// ───────────────────────── IA ─────────────────────────

async function checkAiQuota(env: Env, u: UserRow) {
  const limit = Number(env.AI_DAILY_LIMIT || 30) * (u.role === "admin" ? 4 : 1);
  const row = await env.DB.prepare("SELECT requests FROM ai_usage WHERE user_id = ? AND day = ?").bind(u.id, today()).first<{ requests: number }>();
  if ((row?.requests ?? 0) >= limit) throw new HttpError(429, `Has llegado al límite de ${limit} consultas a la IA por hoy. Vuelve mañana.`);
  return limit - (row?.requests ?? 0);
}

async function addAiUsage(env: Env, userId: string, tokens: number) {
  await env.DB.prepare(
    `INSERT INTO ai_usage (user_id, day, requests, tokens) VALUES (?, ?, 1, ?)
     ON CONFLICT(user_id, day) DO UPDATE SET requests = requests + 1, tokens = tokens + excluded.tokens`,
  )
    .bind(userId, today(), tokens)
    .run();
}

function gemini(env: Env) {
  const g = createGeminiService(env.GEMINI_API_KEY, env.GEMINI_MODEL || DEFAULT_MODEL);
  if (!g) throw new HttpError(503, "La IA no está configurada todavía (falta el secreto GEMINI_API_KEY en Cloudflare).");
  return g;
}

/** Respuesta en streaming (Server-Sent Events) a partir de un generador de texto. */
function sse(gen: AsyncGenerator<string>, onDone: (full: string) => Promise<void>) {
  const enc = new TextEncoder();
  let full = "";
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of gen) {
          full += chunk;
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ t: chunk })}\n\n`));
        }
        await onDone(full);
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (e) {
        const msg = e instanceof HttpError ? e.message : "La IA no ha podido responder. Inténtalo de nuevo.";
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}

async function platformContext(env: Env) {
  const d = (n: number) => Date.now() - n * 864e5;
  const [users, act1, act7, new7, blocked, onboard, ev, errs, wk] = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) c FROM users"),
    env.DB.prepare("SELECT COUNT(*) c FROM users WHERE last_active_at >= ?").bind(d(1)),
    env.DB.prepare("SELECT COUNT(*) c FROM users WHERE last_active_at >= ?").bind(d(7)),
    env.DB.prepare("SELECT COUNT(*) c FROM users WHERE created_at >= ?").bind(d(7)),
    env.DB.prepare("SELECT COUNT(*) c FROM users WHERE blocked = 1"),
    env.DB.prepare("SELECT COUNT(*) c FROM users WHERE json_extract(profile, '$.onboarded') = 1"),
    env.DB.prepare("SELECT type, COUNT(*) c FROM events WHERE ts >= ? GROUP BY type").bind(d(30)),
    env.DB.prepare("SELECT code, COUNT(*) c FROM events WHERE type IN ('auth_error','client_error') AND ts >= ? GROUP BY code ORDER BY c DESC LIMIT 10").bind(d(30)),
    env.DB.prepare("SELECT COUNT(*) c, COUNT(DISTINCT user_id) u FROM workouts WHERE date >= ?").bind(d(30)),
  ]);
  const c = (r: D1Result) => (r.results[0] as { c: number })?.c ?? 0;
  const days = await env.DB.prepare(
    "SELECT date(ts/1000, 'unixepoch') d, SUM(type='visit') v, SUM(type='signup') s, SUM(type='login') l FROM events WHERE ts >= ? GROUP BY d ORDER BY d",
  )
    .bind(d(14))
    .all();
  return `CONTEXTO DE LA PLATAFORMA (datos reales a ${today()}):
Usuarios totales: ${c(users)}. Activos 24 h: ${c(act1)}. Activos 7 días: ${c(act7)}. Nuevos 7 días: ${c(new7)}. Bloqueados: ${c(blocked)}. Con cuestionario completado: ${c(onboard)}.
Eventos 30 días por tipo: ${(ev.results as { type: string; c: number }[]).map((r) => `${r.type}=${r.c}`).join(", ") || "ninguno"}.
Errores 30 días por código: ${(errs.results as { code: string; c: number }[]).map((r) => `${r.code ?? "sin código"}=${r.c}`).join(", ") || "ninguno"}.
Entrenos guardados 30 días: ${(wk.results[0] as { c: number; u: number }).c} de ${(wk.results[0] as { c: number; u: number }).u} usuarios.
Últimos 14 días (fecha: visitas/registros/inicios): ${(days.results as { d: string; v: number; s: number; l: number }[]).map((r) => `${r.d}: ${r.v}/${r.s}/${r.l}`).join("; ") || "sin datos"}.`;
}

// ───────────────────────── router ─────────────────────────

async function handleApi(req: Request, env: Env, url: URL): Promise<Response> {
  await ensureSchema(env);
  const path = url.pathname.replace(/\/+$/, "");
  const m = req.method;
  const seg = path.split("/").slice(2); // ["auth","session"]

  // Protección CSRF básica: las peticiones que modifican datos deben venir del mismo origen.
  if (m !== "GET" && m !== "HEAD") {
    const origin = req.headers.get("origin");
    if (origin && origin !== url.origin) throw new HttpError(403, "Origen no permitido");
  }

  // ── públicas ──
  if (path === "/api/health") return json({ ok: true, time: Date.now() });
  if (path === "/api/config")
    return json({ backend: "cloudflare", ai: Boolean(env.GEMINI_API_KEY), model: env.GEMINI_MODEL || DEFAULT_MODEL, devAuth: env.DEV_AUTH === "1" });

  if (path === "/api/auth/session" && m === "POST") {
    const ip = req.headers.get("cf-connecting-ip") || "local";
    if (!(await rateLimit(env, `login:${ip}`, 20, 600))) throw new HttpError(429, "Demasiados intentos. Espera unos minutos.");
    const { idToken } = await readJson<{ idToken?: string }>(req, 10_000);
    if (!idToken) throw new HttpError(400, "Falta el token de Google");
    try {
      const identity = await verifyGoogleIdToken(idToken, env.FIREBASE_PROJECT_ID);
      return await loginWithIdentity(env, req, identity);
    } catch (e) {
      if (e instanceof HttpError && e.status !== 403) await logEvent(env, { type: "auth_error", code: "session/invalid-token", message: e.message, path: "/login", ua: req.headers.get("user-agent")?.slice(0, 300) });
      throw e;
    }
  }

  // Solo para desarrollo local: DEV_AUTH=1 en .dev.vars (nunca en producción).
  if (path === "/api/auth/dev" && m === "POST") {
    if (env.DEV_AUTH !== "1") throw new HttpError(404, "No encontrado");
    const { email, name } = await readJson<{ email?: string; name?: string }>(req);
    const e = String(email || "dev@dnigym.local").toLowerCase();
    return loginWithIdentity(env, req, { uid: `dev-${(await sha256Hex(e)).slice(0, 20)}`, email: e, name: name || "Usuario de pruebas", picture: null, provider: "dev" });
  }

  if (path === "/api/auth/logout" && m === "POST") {
    const token = getCookie(req, SESSION_COOKIE);
    const u = await currentUser(env, req);
    if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
    if (u) await logEvent(env, { type: "logout", userId: u.id, email: u.email });
    return json({ ok: true }, 200, { "set-cookie": clearCookie(req) });
  }

  if (path === "/api/events" && m === "POST") {
    const ip = req.headers.get("cf-connecting-ip") || "local";
    if (!(await rateLimit(env, `ev:${ip}`, 60, 300))) return json({ ok: false }, 429);
    const b = await readJson<Record<string, unknown>>(req, 4_000);
    if (!EVENT_TYPES.has(String(b.type)) || ["signup", "login", "logout"].includes(String(b.type))) throw new HttpError(400, "Tipo de evento no válido");
    const u = await currentUser(env, req);
    await logEvent(env, {
      type: String(b.type),
      userId: u?.id,
      email: u?.email ?? null,
      name: u?.name ?? null,
      code: str(b.code, 80),
      message: str(b.message, 500),
      path: str(b.path, 200),
      ua: req.headers.get("user-agent")?.slice(0, 300),
      ref: str(b.ref, 120),
    });
    return json({ ok: true });
  }

  // ── usuario ──
  if (path === "/api/me" && m === "GET") {
    const u = await currentUser(env, req);
    if (!u) return json({ profile: null, isAdmin: false }, 200);
    return json({ profile: toProfile(u), isAdmin: u.role === "admin" });
  }

  const user = await requireUser(env, req);

  if (path === "/api/profile" && m === "PATCH") {
    const patch = await readJson<Record<string, unknown>>(req, 20_000);
    const current = JSON.parse(user.profile || "{}") as Record<string, unknown>;
    for (const [k, v] of Object.entries(patch)) if (PROFILE_KEYS.has(k) && k !== "name") current[k] = v;
    const name = typeof patch.name === "string" && patch.name.trim() ? patch.name.trim().slice(0, 80) : user.name;
    await env.DB.prepare("UPDATE users SET profile = ?, name = ? WHERE id = ?").bind(JSON.stringify(current), name, user.id).run();
    return json({ profile: toProfile({ ...user, profile: JSON.stringify(current), name }) });
  }

  // entrenos
  if (seg[0] === "workouts") {
    if (m === "GET" && seg.length === 1) {
      const r = await env.DB.prepare("SELECT data FROM workouts WHERE user_id = ? ORDER BY date DESC LIMIT 2000").bind(user.id).all<{ data: string }>();
      return json(r.results.map((x) => JSON.parse(x.data)));
    }
    const id = seg[1];
    if (!isId(id)) throw new HttpError(400, "Identificador no válido");
    if (m === "PUT") {
      const w = await readJson<Record<string, unknown>>(req, 200_000);
      if (typeof w.date !== "number" || !Array.isArray(w.exercises)) throw new HttpError(400, "Entreno no válido");
      w.id = id;
      await env.DB.prepare(
        "INSERT INTO workouts (id, user_id, date, data, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, id) DO UPDATE SET date = excluded.date, data = excluded.data, updated_at = excluded.updated_at",
      )
        .bind(id, user.id, w.date, JSON.stringify(w), Date.now())
        .run();
      await env.DB.prepare("UPDATE users SET workouts_count = (SELECT COUNT(*) FROM workouts WHERE user_id = ?) WHERE id = ?").bind(user.id, user.id).run();
      return json(w);
    }
    if (m === "DELETE") {
      await env.DB.prepare("DELETE FROM workouts WHERE user_id = ? AND id = ?").bind(user.id, id).run();
      await env.DB.prepare("UPDATE users SET workouts_count = (SELECT COUNT(*) FROM workouts WHERE user_id = ?) WHERE id = ?").bind(user.id, user.id).run();
      return json({ ok: true });
    }
  }

  // peso y medidas
  if (seg[0] === "body") {
    if (m === "GET" && seg.length === 1) {
      const r = await env.DB.prepare("SELECT data FROM body_logs WHERE user_id = ? ORDER BY date ASC").bind(user.id).all<{ data: string }>();
      return json(r.results.map((x) => JSON.parse(x.data)));
    }
    const date = seg[1];
    if (!isDay(date)) throw new HttpError(400, "Fecha no válida");
    if (m === "PUT") {
      const b = await readJson<Record<string, unknown>>(req, 5_000);
      const clean: Record<string, unknown> = { id: date, date };
      for (const k of ["weight", "bodyFat", "waist", "chest", "arm", "hip", "thigh"]) if (typeof b[k] === "number" && Number.isFinite(b[k])) clean[k] = b[k];
      await env.DB.prepare("INSERT INTO body_logs (user_id, date, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, date) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
        .bind(user.id, date, JSON.stringify(clean), Date.now())
        .run();
      return json(clean);
    }
    if (m === "DELETE") {
      await env.DB.prepare("DELETE FROM body_logs WHERE user_id = ? AND date = ?").bind(user.id, date).run();
      return json({ ok: true });
    }
  }

  // nutrición
  if (seg[0] === "nutrition") {
    if (m === "GET" && seg.length === 1) {
      const from = url.searchParams.get("from") || "0000-00-00";
      const r = await env.DB.prepare("SELECT data FROM nutrition_days WHERE user_id = ? AND date >= ? ORDER BY date ASC").bind(user.id, from).all<{ data: string }>();
      return json(r.results.map((x) => JSON.parse(x.data)));
    }
    const date = seg[1];
    if (!isDay(date)) throw new HttpError(400, "Fecha no válida");
    if (m === "GET") {
      const r = await env.DB.prepare("SELECT data FROM nutrition_days WHERE user_id = ? AND date = ?").bind(user.id, date).first<{ data: string }>();
      return json(r ? JSON.parse(r.data) : { id: date, date, entries: [], waterMl: 0 });
    }
    if (m === "PUT") {
      const d = await readJson<{ entries?: unknown[]; waterMl?: number }>(req, 100_000);
      if (!Array.isArray(d.entries)) throw new HttpError(400, "Diario no válido");
      const clean = { id: date, date, entries: d.entries.slice(0, 200), waterMl: Math.max(0, Math.min(20000, Number(d.waterMl) || 0)) };
      await env.DB.prepare("INSERT INTO nutrition_days (user_id, date, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, date) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
        .bind(user.id, date, JSON.stringify(clean), Date.now())
        .run();
      return json(clean);
    }
  }

  // importación única desde la base de datos anterior (Firestore): no sobrescribe nada existente
  if (path === "/api/import" && m === "POST") {
    const b = await readJson<{ profile?: Record<string, unknown>; workouts?: Record<string, unknown>[]; body?: Record<string, unknown>[]; nutrition?: Record<string, unknown>[] }>(req, 5_000_000);
    const now = Date.now();
    const stmts: D1PreparedStatement[] = [];
    for (const w of (b.workouts ?? []).slice(0, 3000))
      if (isId(w.id) && typeof w.date === "number") stmts.push(env.DB.prepare("INSERT OR IGNORE INTO workouts (id, user_id, date, data, updated_at) VALUES (?, ?, ?, ?, ?)").bind(w.id, user.id, w.date, JSON.stringify(w), now));
    for (const x of (b.body ?? []).slice(0, 3000))
      if (isDay(x.date)) stmts.push(env.DB.prepare("INSERT OR IGNORE INTO body_logs (user_id, date, data, updated_at) VALUES (?, ?, ?, ?)").bind(user.id, x.date, JSON.stringify(x), now));
    for (const x of (b.nutrition ?? []).slice(0, 3000))
      if (isDay(x.date)) stmts.push(env.DB.prepare("INSERT OR IGNORE INTO nutrition_days (user_id, date, data, updated_at) VALUES (?, ?, ?, ?)").bind(user.id, x.date, JSON.stringify(x), now));
    for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50));
    // perfil: solo completa los campos que aún no existen
    if (b.profile) {
      const current = JSON.parse(user.profile || "{}") as Record<string, unknown>;
      for (const [k, v] of Object.entries(b.profile)) if (PROFILE_KEYS.has(k) && k !== "name" && (current[k] === undefined || (k === "onboarded" && !current[k]))) current[k] = v;
      await env.DB.prepare("UPDATE users SET profile = ? WHERE id = ?").bind(JSON.stringify(current), user.id).run();
    }
    await env.DB.prepare("UPDATE users SET workouts_count = (SELECT COUNT(*) FROM workouts WHERE user_id = ?) WHERE id = ?").bind(user.id, user.id).run();
    const fresh = (await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first<UserRow>())!;
    return json({ imported: stmts.length, profile: toProfile(fresh) });
  }

  if (path === "/api/export" && m === "GET") {
    const [w, bo, n] = await env.DB.batch([
      env.DB.prepare("SELECT data FROM workouts WHERE user_id = ? ORDER BY date DESC").bind(user.id),
      env.DB.prepare("SELECT data FROM body_logs WHERE user_id = ? ORDER BY date").bind(user.id),
      env.DB.prepare("SELECT data FROM nutrition_days WHERE user_id = ? ORDER BY date").bind(user.id),
    ]);
    const parse = (r: D1Result) => (r.results as { data: string }[]).map((x) => JSON.parse(x.data));
    return json({ exportedAt: new Date().toISOString(), profile: toProfile(user), workouts: parse(w), body: parse(bo), nutrition: parse(n) });
  }

  if (path === "/api/account" && m === "DELETE") {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM workouts WHERE user_id = ?").bind(user.id),
      env.DB.prepare("DELETE FROM body_logs WHERE user_id = ?").bind(user.id),
      env.DB.prepare("DELETE FROM nutrition_days WHERE user_id = ?").bind(user.id),
      env.DB.prepare("DELETE FROM ai_messages WHERE user_id = ?").bind(user.id),
      env.DB.prepare("DELETE FROM ai_usage WHERE user_id = ?").bind(user.id),
      env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id),
      env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
    ]);
    await logEvent(env, { type: "account_deleted", email: user.email });
    return json({ ok: true }, 200, { "set-cookie": clearCookie(req) });
  }

  // ── DNI AI Coach ──
  if (seg[0] === "ai") {
    if (path === "/api/ai/history" && m === "GET") {
      const r = await env.DB.prepare("SELECT role, content, ts FROM ai_messages WHERE user_id = ? ORDER BY id DESC LIMIT 40").bind(user.id).all();
      return json({ messages: r.results.reverse(), ai: Boolean(env.GEMINI_API_KEY) });
    }
    if (path === "/api/ai/history" && m === "DELETE") {
      await env.DB.prepare("DELETE FROM ai_messages WHERE user_id = ?").bind(user.id).run();
      return json({ ok: true });
    }
    if (path === "/api/ai/chat" && m === "POST") {
      const { message } = await readJson<{ message?: string }>(req, 8_000);
      const text = String(message || "").trim().slice(0, 2000);
      if (!text) throw new HttpError(400, "Escribe tu pregunta");
      await checkAiQuota(env, user);
      const g = gemini(env);
      const hist = await env.DB.prepare("SELECT role, content FROM ai_messages WHERE user_id = ? ORDER BY id DESC LIMIT 12").bind(user.id).all<{ role: string; content: string }>();
      const history: ChatTurn[] = hist.results.reverse().map((h) => ({ role: h.role === "user" ? "user" : "model", text: h.content }));
      const system = `${COACH_SYSTEM}\n\nCATÁLOGO DNI GYM (nombre [slug]):\n${catalogText()}\n\n${await userContext(env, user)}`;
      const usage = { tokens: 0 };
      await env.DB.prepare("INSERT INTO ai_messages (user_id, role, content, ts) VALUES (?, 'user', ?, ?)").bind(user.id, text, Date.now()).run();
      return sse(g.streamChat(history, text, { system, temperature: 0.6, maxOutputTokens: 1400 }, usage), async (full) => {
        await env.DB.prepare("INSERT INTO ai_messages (user_id, role, content, ts) VALUES (?, 'model', ?, ?)").bind(user.id, full.slice(0, 20000), Date.now()).run();
        await addAiUsage(env, user.id, usage.tokens);
      });
    }
    if (path === "/api/ai/workout" && m === "POST") {
      const b = await readJson<{ minutes?: number; place?: string; focus?: string; notes?: string }>(req, 4_000);
      await checkAiQuota(env, user);
      const g = gemini(env);
      const prompt = `${await userContext(env, user)}

CATÁLOGO DNI GYM (nombre [slug]):
${catalogText()}

Crea el entreno de HOY para este usuario.
Condiciones de hoy: ${Number(b.minutes) || "su tiempo habitual"} minutos; lugar: ${b.place === "casa" ? "casa sin material (solo ejercicios de peso corporal)" : b.place === "gimnasio" ? "gimnasio" : "su lugar habitual"}; enfoque: ${String(b.focus || "el que mejor encaje con su historial y su programa").slice(0, 120)}; notas: ${String(b.notes || "ninguna").slice(0, 300)}.
Equilibra con lo que ha entrenado en los últimos días (no repitas el mismo grupo muscular si lo trabajó ayer). Usa SOLO slugs del catálogo. Para ejercicios por tiempo usa "seconds" en lugar de "reps".`;
      const { data, usage } = await g.generateJson<{ title?: string; summary?: string; items?: { slug: string; sets: number; reps?: number; seconds?: number; rest: number }[] }>(prompt, WORKOUT_SCHEMA, {
        system: COACH_SYSTEM,
        temperature: 0.5,
        maxOutputTokens: 1500,
      });
      await addAiUsage(env, user.id, usage.tokens);
      const valid = validateWorkout(data ?? {});
      if (!valid) throw new HttpError(502, "La IA no ha generado un entreno válido. Inténtalo de nuevo.");
      return json(valid);
    }
  }

  // ── administración ──
  if (seg[0] === "admin") {
    const admin = await requireAdmin(env, req);
    if (path === "/api/admin/users" && m === "GET") {
      const r = await env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC LIMIT 5000").all<UserRow>();
      return json(r.results.map(toProfile));
    }
    if (path === "/api/admin/events" && m === "GET") {
      const since = Number(url.searchParams.get("since") || Date.now() - 30 * 864e5);
      const r = await env.DB.prepare("SELECT * FROM events WHERE ts >= ? ORDER BY ts DESC LIMIT 5000").bind(since).all<Record<string, unknown>>();
      return json(r.results.map((e) => ({ ...e, id: String(e.id), uid: e.user_id ?? undefined })));
    }
    if (seg[1] === "events" && seg[2] && m === "DELETE") {
      await env.DB.prepare("DELETE FROM events WHERE id = ?").bind(Number(seg[2])).run();
      await audit(env, admin, "event.delete", seg[2]);
      return json({ ok: true });
    }
    if (seg[1] === "users" && seg[2] && seg[3] === "workouts" && m === "GET") {
      const r = await env.DB.prepare("SELECT data FROM workouts WHERE user_id = ? ORDER BY date DESC LIMIT 50").bind(seg[2]).all<{ data: string }>();
      return json(r.results.map((x) => JSON.parse(x.data)));
    }
    if (seg[1] === "users" && seg[2] && m === "PATCH") {
      const b = await readJson<{ blocked?: boolean; role?: string }>(req);
      const target = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(seg[2]).first<UserRow>();
      if (!target) throw new HttpError(404, "Usuario no encontrado");
      if (target.id === admin.id && (b.blocked || (b.role && b.role !== "admin"))) throw new HttpError(400, "No puedes bloquearte ni quitarte el rol de administrador a ti mismo");
      if (typeof b.blocked === "boolean") {
        await env.DB.prepare("UPDATE users SET blocked = ? WHERE id = ?").bind(b.blocked ? 1 : 0, target.id).run();
        if (b.blocked) await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(target.id).run();
        await audit(env, admin, b.blocked ? "user.block" : "user.unblock", target.email);
      }
      if (b.role === "admin" || b.role === "user") {
        await env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(b.role, target.id).run();
        await audit(env, admin, "user.role", target.email, { role: b.role });
      }
      const fresh = (await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(target.id).first<UserRow>())!;
      return json(toProfile(fresh));
    }
    if (path === "/api/admin/audit" && m === "GET") {
      const r = await env.DB.prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT 300").all();
      return json(r.results);
    }
    if (path === "/api/admin/system" && m === "GET") {
      const [ai, sess] = await env.DB.batch([
        env.DB.prepare("SELECT COALESCE(SUM(requests),0) r, COALESCE(SUM(tokens),0) t FROM ai_usage WHERE day >= ?").bind(new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)),
        env.DB.prepare("SELECT COUNT(*) c FROM sessions WHERE expires_at > ?").bind(Date.now()),
      ]);
      const a = ai.results[0] as { r: number; t: number };
      return json({
        backend: "Cloudflare Workers + D1",
        ai: Boolean(env.GEMINI_API_KEY),
        model: env.GEMINI_MODEL || DEFAULT_MODEL,
        aiDailyLimit: Number(env.AI_DAILY_LIMIT || 30),
        aiRequests30d: a.r,
        aiTokens30d: a.t,
        activeSessions: (sess.results[0] as { c: number }).c,
        adminEmails: adminEmails(env),
      });
    }
    if (path === "/api/admin/ai" && m === "POST") {
      const { message } = await readJson<{ message?: string }>(req, 8_000);
      const text = String(message || "").trim().slice(0, 2000);
      if (!text) throw new HttpError(400, "Escribe tu pregunta");
      await checkAiQuota(env, admin);
      const g = gemini(env);
      const usage = { tokens: 0 };
      const system = `${ADMIN_SYSTEM}\n\n${await platformContext(env)}`;
      return sse(g.streamChat([], text, { system, temperature: 0.4, maxOutputTokens: 1400 }, usage), async () => {
        await addAiUsage(env, admin.id, usage.tokens);
        await audit(env, admin, "admin.ai", undefined, { q: text.slice(0, 200) });
      });
    }
  }

  throw new HttpError(404, "Ruta no encontrada");
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(req);
    try {
      return await handleApi(req, env, url);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error("API error", url.pathname, e);
      return json({ error: "Error interno. Inténtalo de nuevo." }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
