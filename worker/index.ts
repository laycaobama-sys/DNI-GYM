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
  googleEnabled,
  hashPassword,
  normalizeEmail,
  passwordProblem,
  pkceChallenge,
  randomId,
  randomToken,
  requireAdmin,
  requireUser,
  sessionCookie,
  sha256Hex,
  tempCookie,
  toProfile,
  verifyGoogleIdToken,
  verifyPassword,
  verifyTurnstile,
  type UserRow,
} from "./auth";
import { DEFAULT_MODEL, createGeminiService, diagnoseGemini, probeGemini, type ChatTurn } from "./gemini";
import { notifyOwner, reminderMail, resetMail, sendMail, welcomeMail } from "./email";
import { agentRoutes } from "./agent";
import {
  AGENTS,
  CUSTOMER_SYSTEM,
  agentContext,
  crmAddNote,
  crmList,
  crmNotes,
  crmSetTags,
  customerContext,
  inventoryCreate,
  inventoryDelete,
  inventoryList,
  inventoryMove,
  inventoryUpdate,
  metrics,
  type AgentId,
} from "./admin";
import { ADMIN_SYSTEM, COACH_SYSTEM, WORKOUT_SCHEMA, catalogText, userContext, validateWorkout } from "./coach";
import { getCookie } from "./http";
import { SESSION_COOKIE } from "./auth";

/** Campos del perfil que el propio usuario puede modificar. */
const PROFILE_KEYS = new Set([
  "name", "sex", "birthYear", "heightCm", "activity", "goal", "targetWeight", "weeklyWorkoutsGoal", "calorieGoal", "proteinGoal",
  "carbsGoal", "fatGoal", "waterGoal", "onboarded", "level", "place", "focusAreas", "planSlug", "challenges", "diet", "sessionMinutes",
  "trainTime", "trainDays", "goals", "places", "emailOptIn",
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

const ipOf = (req: Request) => req.headers.get("cf-connecting-ip") || "local";
const uaOf = (req: Request) => req.headers.get("user-agent")?.slice(0, 300) ?? null;
const NEW_PROFILE = JSON.stringify({ onboarded: false, weeklyWorkoutsGoal: 3 });

/** Tareas en segundo plano (correos) sin retrasar la respuesta. */
const CTX = new WeakMap<Request, ExecutionContext>();
const later = (req: Request, p: Promise<unknown>) => {
  const ctx = CTX.get(req);
  if (ctx) ctx.waitUntil(p.catch((e) => console.error("tarea en segundo plano", e)));
  else p.catch(() => {});
};
const siteUrl = (env: Env, url: URL) => (env.SITE_URL && !/127\.0\.0\.1|localhost/.test(url.host) ? env.SITE_URL.replace(/\/$/, "") : url.origin);

async function unsubUrl(env: Env, url: URL, u: UserRow) {
  let t = u.unsub_token;
  if (!t) {
    t = randomToken(18);
    await env.DB.prepare("UPDATE users SET unsub_token = ? WHERE id = ?").bind(t, u.id).run();
  }
  return `${siteUrl(env, url)}/api/email/unsubscribe?t=${t}`;
}

/** Bienvenida al usuario y aviso al dueño de un registro nuevo. */
function onSignup(env: Env, req: Request, url: URL, u: UserRow, via: string) {
  later(
    req,
    (async () => {
      const w = welcomeMail(env, u.name || "", await unsubUrl(env, url, u));
      await sendMail(env, "welcome", { to: u.email, ...w });
      const total = await env.DB.prepare("SELECT COUNT(*) c FROM users").first<{ c: number }>();
      await notifyOwner(env, "owner_signup", `Nuevo registro en DNI GYM: ${u.name || u.email}`, [`${u.name || "Sin nombre"} (${u.email}) se ha registrado con ${via === "google" ? "Google" : "correo y contraseña"}.`, `Usuarios totales: ${total?.c ?? "?"}.`]);
    })(),
  );
}

async function userBy(env: Env, col: "id" | "email" | "google_sub", v: string) {
  return env.DB.prepare(`SELECT * FROM users WHERE ${col} = ?`).bind(v).first<UserRow>();
}

/** Admin solo si el email está en ADMIN_EMAILS y está verificado (Google o enlace de un solo uso). */
async function syncAdminRole(env: Env, u: UserRow) {
  if (u.email_verified && u.role !== "admin" && adminEmails(env).includes(u.email)) {
    await env.DB.prepare("UPDATE users SET role = 'admin' WHERE id = ?").bind(u.id).run();
    u.role = "admin";
  }
}

/** Abre sesión para el usuario: comprueba bloqueo, registra el acceso y devuelve la cookie. */
async function startSession(env: Env, req: Request, u: UserRow, isNew: boolean, via: string) {
  if (u.blocked) {
    await logEvent(env, { type: "auth_error", userId: u.id, email: u.email, code: "account/blocked", message: "Intento de acceso de una cuenta suspendida", path: "/login", ua: uaOf(req) });
    throw new HttpError(403, "Tu cuenta está suspendida. Escríbenos para revisarlo.");
  }
  await syncAdminRole(env, u);
  const now = Date.now();
  if (!isNew) await env.DB.prepare("UPDATE users SET last_login_at = ?, last_active_at = ?, login_count = login_count + 1 WHERE id = ?").bind(now, now, u.id).run();
  const token = await createSession(env, u.id, uaOf(req));
  await logEvent(env, { type: isNew ? "signup" : "login", userId: u.id, email: u.email, name: u.name, code: via, path: "/login", ua: uaOf(req) });
  const fresh = (await userBy(env, "id", u.id))!;
  return { token, profile: toProfile(fresh), isAdmin: fresh.role === "admin", isNew };
}

async function createUser(env: Env, d: { email: string; name: string; provider: string; passwordHash?: string | null; verified: boolean; googleSub?: string | null; picture?: string | null }) {
  const now = Date.now();
  const id = randomId();
  await env.DB.prepare(
    `INSERT INTO users (id, email, name, photo_url, provider, role, blocked, profile, created_at, last_login_at, last_active_at, login_count, password_hash, email_verified, google_sub)
     VALUES (?, ?, ?, ?, ?, 'user', 0, ?, ?, ?, ?, 1, ?, ?, ?)`,
  )
    .bind(id, d.email, d.name, d.picture ?? null, d.provider, NEW_PROFILE, now, now, now, d.passwordHash ?? null, d.verified ? 1 : 0, d.googleSub ?? null)
    .run();
  return (await userBy(env, "id", id))!;
}

/** Crea un enlace de un solo uso para crear o cambiar la contraseña. */
async function createResetLink(env: Env, origin: string, userId: string, hours: number, createdBy: string | null) {
  const token = randomToken(32);
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM auth_tokens WHERE user_id = ? AND purpose = 'reset'").bind(userId),
    env.DB.prepare("INSERT INTO auth_tokens (token_hash, user_id, purpose, created_at, expires_at, created_by) VALUES (?, ?, 'reset', ?, ?, ?)").bind(await sha256Hex(token), userId, now, now + hours * 3600_000, createdBy),
  ]);
  return { url: `${origin}/restablecer/?token=${token}`, expiresAt: now + hours * 3600_000 };
}

async function authRoutes(req: Request, env: Env, url: URL, path: string, m: string): Promise<Response | null> {
  const ip = ipOf(req);
  const withCookie = (r: { token: string; profile: unknown; isAdmin: boolean; isNew: boolean }) =>
    json({ profile: r.profile, isAdmin: r.isAdmin, isNew: r.isNew }, 200, { "set-cookie": sessionCookie(r.token, req) });

  // ── crear cuenta con correo y contraseña ──
  if (path === "/api/auth/signup" && m === "POST") {
    if (!(await rateLimit(env, `signup:${ip}`, 12, 3600))) throw new HttpError(429, "Demasiadas cuentas creadas desde esta conexión. Inténtalo más tarde.");
    const b = await readJson<{ email?: string; password?: string; name?: string; turnstile?: string; acceptTerms?: boolean }>(req, 8_000);
    await verifyTurnstile(env, b.turnstile, ip);
    const email = normalizeEmail(b.email);
    if (!email) throw new HttpError(400, "Escribe un correo electrónico válido.");
    const name = String(b.name || "").trim().slice(0, 80);
    if (name.length < 2) throw new HttpError(400, "Escribe tu nombre.");
    const problem = passwordProblem(b.password, email);
    if (problem) throw new HttpError(400, problem);
    if (b.acceptTerms !== true) throw new HttpError(400, "Debes aceptar los términos y la política de privacidad.");
    if (await userBy(env, "email", email)) throw new HttpError(409, "Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.");
    const u = await createUser(env, { email, name, provider: "password", passwordHash: await hashPassword(b.password!), verified: false });
    onSignup(env, req, url, u, "password");
    return withCookie(await startSession(env, req, u, true, "password"));
  }

  // ── iniciar sesión con correo y contraseña ──
  if (path === "/api/auth/login" && m === "POST") {
    if (!(await rateLimit(env, `login:${ip}`, 30, 600))) throw new HttpError(429, "Demasiados intentos. Espera unos minutos.");
    const b = await readJson<{ email?: string; password?: string; turnstile?: string }>(req, 8_000);
    await verifyTurnstile(env, b.turnstile, ip);
    const email = normalizeEmail(b.email);
    if (!email || typeof b.password !== "string" || !b.password) throw new HttpError(400, "Escribe tu correo y tu contraseña.");
    if (!(await rateLimit(env, `pw:${email}`, 8, 900))) throw new HttpError(429, "Demasiados intentos para esta cuenta. Espera 15 minutos o recupera tu contraseña.");
    const u = await userBy(env, "email", email);
    const ok = await verifyPassword(b.password.slice(0, 200), u?.password_hash ?? null);
    if (!u || !ok) {
      await logEvent(env, { type: "auth_error", userId: u?.id, email, code: u && !u.password_hash ? "auth/no-password" : "auth/wrong-credentials", message: "Correo o contraseña incorrectos", path: "/login", ua: uaOf(req) });
      if (u && !u.password_hash)
        throw new HttpError(401, googleEnabled(env, url.host) ? "Esta cuenta se creó con Google. Entra con Google o crea una contraseña desde «¿Olvidaste tu contraseña?»." : "Esta cuenta todavía no tiene contraseña. Pulsa «¿Olvidaste tu contraseña?».");
      throw new HttpError(401, "Correo o contraseña incorrectos.");
    }
    return withCookie(await startSession(env, req, u, false, "password"));
  }

  // ── olvidé mi contraseña ──
  if (path === "/api/auth/forgot" && m === "POST") {
    if (!(await rateLimit(env, `forgot:${ip}`, 5, 3600))) throw new HttpError(429, "Demasiadas solicitudes. Inténtalo más tarde.");
    const b = await readJson<{ email?: string; turnstile?: string }>(req, 8_000);
    await verifyTurnstile(env, b.turnstile, ip);
    const email = normalizeEmail(b.email);
    if (!email) throw new HttpError(400, "Escribe un correo electrónico válido.");
    const u = await userBy(env, "email", email);
    await logEvent(env, { type: "password_reset", userId: u?.id, email, code: u ? "reset/requested" : "reset/unknown-email", message: "Solicitud de cambio de contraseña", path: "/recuperar", ua: uaOf(req) });
    if (u && !u.blocked) {
      later(
        req,
        (async () => {
          // Con el envío a usuarios activo, el enlace (1 h) llega directamente a su correo; si no, se avisa al dueño.
          if (env.EMAIL_USERS === "1") {
            const link = await createResetLink(env, siteUrl(env, url), u.id, 1, null);
            const ok = await sendMail(env, "reset", { to: u.email, ...resetMail(env, u.name || "", link.url) });
            if (ok) return;
          }
          await notifyOwner(env, "owner_reset", `Solicitud de contraseña: ${u.email}`, [`${u.name || u.email} ha pedido cambiar su contraseña.`, "Genera su enlace en Admin → Usuarios → su ficha → «Enlace de contraseña» y envíaselo."]);
        })(),
      );
    }
    return json({ ok: true, emailed: env.EMAIL_USERS === "1" });
  }

  // ── restablecer con enlace de un solo uso ──
  if (path === "/api/auth/reset" && m === "POST") {
    if (!(await rateLimit(env, `reset:${ip}`, 20, 3600))) throw new HttpError(429, "Demasiados intentos. Inténtalo más tarde.");
    const b = await readJson<{ token?: string; password?: string }>(req, 8_000);
    if (typeof b.token !== "string" || b.token.length < 20 || b.token.length > 100) throw new HttpError(400, "El enlace no es válido.");
    const hash = await sha256Hex(b.token);
    const t = await env.DB.prepare("SELECT * FROM auth_tokens WHERE token_hash = ? AND purpose = 'reset'").bind(hash).first<{ user_id: string; expires_at: number }>();
    if (!t || t.expires_at < Date.now()) throw new HttpError(400, "El enlace ha caducado o ya se usó. Pide uno nuevo.");
    const u = await userBy(env, "id", t.user_id);
    if (!u) throw new HttpError(400, "El enlace no es válido.");
    const problem = passwordProblem(b.password, u.email);
    if (problem) throw new HttpError(400, problem);
    // El enlace llega al dueño del correo: la contraseña cambia, el email queda verificado y se cierran las demás sesiones.
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET password_hash = ?, email_verified = 1 WHERE id = ?").bind(await hashPassword(b.password!), u.id),
      env.DB.prepare("DELETE FROM auth_tokens WHERE user_id = ? AND purpose = 'reset'").bind(u.id),
      env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(u.id),
    ]);
    await logEvent(env, { type: "password_reset", userId: u.id, email: u.email, code: "reset/completed", message: "Contraseña cambiada con enlace", path: "/restablecer", ua: uaOf(req) });
    u.email_verified = 1;
    return withCookie(await startSession(env, req, u, false, "reset"));
  }

  // ── Google: inicio del flujo OAuth (código + PKCE + nonce + state) ──
  if (path === "/api/auth/google" && m === "GET") {
    if (!googleEnabled(env, url.host)) return Response.redirect(`${url.origin}/login/?error=google-off`, 302);
    if (!(await rateLimit(env, `google:${ip}`, 30, 600))) return Response.redirect(`${url.origin}/login/?error=rate`, 302);
    const state = randomToken(24);
    const verifier = randomToken(48);
    const nonce = randomToken(24);
    const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    auth.search = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${url.origin}/api/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: await pkceChallenge(verifier),
      code_challenge_method: "S256",
      prompt: "select_account",
    }).toString();
    const h = new Headers({ location: auth.toString(), "cache-control": "no-store" });
    h.append("set-cookie", tempCookie("g_oauth", `${state}.${verifier}.${nonce}`, req));
    return new Response(null, { status: 302, headers: h });
  }

  // ── Google: vuelta desde Google ──
  if (path === "/api/auth/google/callback" && m === "GET") {
    const fail = (code: string, msg: string) =>
      logEvent(env, { type: "auth_error", code, message: msg.slice(0, 300), path: "/login", ua: uaOf(req) }).then(() => {
        const h = new Headers({ location: `${url.origin}/login/?error=${encodeURIComponent(code)}`, "cache-control": "no-store" });
        h.append("set-cookie", tempCookie("g_oauth", "", req, 0));
        return new Response(null, { status: 302, headers: h });
      });
    if (!googleEnabled(env, url.host)) return fail("google-off", "Google no está configurado");
    const [state, verifier, nonce] = (getCookie(req, "g_oauth") || "").split(".");
    if (url.searchParams.get("error")) return fail("google-cancelled", url.searchParams.get("error") || "cancelado");
    if (!state || state !== url.searchParams.get("state")) return fail("google-state", "Estado OAuth no válido");
    const code = url.searchParams.get("code");
    if (!code) return fail("google-code", "Falta el código");
    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID!, client_secret: env.GOOGLE_CLIENT_SECRET!, redirect_uri: `${url.origin}/api/auth/google/callback`, grant_type: "authorization_code", code_verifier: verifier }),
      });
      const tok = (await res.json()) as { id_token?: string; error?: string };
      if (!res.ok || !tok.id_token) return fail("google-token", tok.error || `HTTP ${res.status}`);
      const g = await verifyGoogleIdToken(tok.id_token, env.GOOGLE_CLIENT_ID!, nonce);
      let u = await userBy(env, "google_sub", g.sub);
      let isNew = false;
      if (!u) {
        const byEmail = await userBy(env, "email", g.email);
        if (byEmail) {
          // Vincular. Si la cuenta tenía contraseña sin verificar, se anula (evita que alguien registre antes el correo de otra persona).
          const wipe = byEmail.password_hash && !byEmail.email_verified;
          await env.DB.batch([
            env.DB.prepare(`UPDATE users SET google_sub = ?, email_verified = 1, photo_url = COALESCE(photo_url, ?)${wipe ? ", password_hash = NULL" : ""} WHERE id = ?`).bind(g.sub, g.picture, byEmail.id),
            ...(wipe ? [env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(byEmail.id)] : []),
          ]);
          u = (await userBy(env, "id", byEmail.id))!;
        } else {
          u = await createUser(env, { email: g.email, name: g.name, provider: "google", verified: true, googleSub: g.sub, picture: g.picture });
          isNew = true;
          onSignup(env, req, url, u, "google");
        }
      }
      const r = await startSession(env, req, u, isNew, "google");
      const h = new Headers({ location: `${url.origin}${r.isNew || !JSON.parse(u.profile || "{}").onboarded ? "/bienvenida/" : "/panel/"}`, "cache-control": "no-store" });
      h.append("set-cookie", sessionCookie(r.token, req));
      h.append("set-cookie", tempCookie("g_oauth", "", req, 0));
      return new Response(null, { status: 302, headers: h });
    } catch (e) {
      if (e instanceof HttpError && e.status === 403 && /suspendida/.test(e.message)) return fail("account-blocked", e.message);
      return fail("google-verify", e instanceof Error ? e.message : "error");
    }
  }

  // ── cambiar o crear contraseña (con sesión) ──
  if (path === "/api/auth/password" && m === "POST") {
    const u = await requireUser(env, req);
    if (!(await rateLimit(env, `chpw:${u.id}`, 10, 3600))) throw new HttpError(429, "Demasiados intentos. Inténtalo más tarde.");
    const b = await readJson<{ current?: string; password?: string }>(req, 8_000);
    if (u.password_hash && !(await verifyPassword(String(b.current || "").slice(0, 200), u.password_hash))) throw new HttpError(400, "La contraseña actual no es correcta.");
    const problem = passwordProblem(b.password, u.email);
    if (problem) throw new HttpError(400, problem);
    const token = await createSession(env, u.id, uaOf(req));
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(await hashPassword(b.password!), u.id),
      env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?").bind(u.id, await sha256Hex(token)),
    ]);
    await logEvent(env, { type: "password_reset", userId: u.id, email: u.email, code: "password/changed", message: "Contraseña cambiada desde el perfil", path: "/panel/perfil", ua: uaOf(req) });
    return json({ ok: true }, 200, { "set-cookie": sessionCookie(token, req) });
  }

  // ── solo desarrollo local: DEV_AUTH=1 en .dev.vars (nunca en producción) ──
  if (path === "/api/auth/dev" && m === "POST") {
    if (env.DEV_AUTH !== "1") throw new HttpError(404, "No encontrado");
    const b = await readJson<{ email?: string; name?: string }>(req);
    const email = normalizeEmail(b.email || "dev@dnigym.local") ?? "dev@dnigym.local";
    let u = await userBy(env, "email", email);
    const isNew = !u;
    u ??= await createUser(env, { email, name: b.name || "Usuario de pruebas", provider: "dev", verified: true });
    return withCookie(await startSession(env, req, u, isNew, "dev"));
  }

  if (path === "/api/auth/logout" && m === "POST") {
    const token = getCookie(req, SESSION_COOKIE);
    const u = await currentUser(env, req);
    if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
    if (u) await logEvent(env, { type: "logout", userId: u.id, email: u.email });
    return json({ ok: true }, 200, { "set-cookie": clearCookie(req) });
  }
  return null;
}

// ───────────────────────── IA ─────────────────────────

/**
 * Cuota de IA de un usuario hoy.
 * - límite personal: el fijado por el admin (ai_limit) o AI_DAILY_LIMIT (admins ×4);
 * - reparto justo: si el uso global supera el 80 % del tope diario gratuito, los usuarios pasan a 5 consultas;
 * - el admin puede bloquear la IA a un usuario concreto (ai_blocked).
 */
async function aiQuota(env: Env, u: UserRow) {
  const globalCap = Number(env.AI_GLOBAL_DAILY_LIMIT || 200);
  const [g, mine] = await env.DB.batch([
    env.DB.prepare("SELECT COALESCE(SUM(requests),0) r FROM ai_usage WHERE day = ?").bind(today()),
    env.DB.prepare("SELECT COALESCE(SUM(requests),0) r FROM ai_usage WHERE user_id = ? AND day = ?").bind(u.id, today()),
  ]);
  const globalUsed = Number((g.results[0] as { r: number }).r);
  const used = Number((mine.results[0] as { r: number }).r);
  const base = u.ai_limit ?? Number(env.AI_DAILY_LIMIT || 30) * (u.role === "admin" ? 4 : 1);
  const tight = u.role !== "admin" && globalUsed >= globalCap * 0.8;
  const limit = u.ai_blocked ? 0 : tight ? Math.min(base, 5) : base;
  return { used, limit, remaining: Math.max(0, limit - used), globalUsed, globalCap, tight, blocked: Boolean(u.ai_blocked) };
}

async function checkAiQuota(env: Env, u: UserRow) {
  const q = await aiQuota(env, u);
  if (q.blocked) throw new HttpError(403, "El acceso a la IA está desactivado para tu cuenta. Escríbenos a contacto@dnigym.com si crees que es un error.");
  if (q.globalUsed >= q.globalCap) throw new HttpError(429, "La IA ha alcanzado su límite diario. Vuelve a intentarlo mañana.");
  if (q.remaining <= 0) throw new HttpError(429, `Has usado tus ${q.limit} consultas a la IA de hoy. Vuelven mañana a las 00:00 (UTC).`);
  return q.remaining;
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
    return json({
      backend: "cloudflare",
      ai: Boolean(env.GEMINI_API_KEY),
      model: env.GEMINI_MODEL || DEFAULT_MODEL,
      devAuth: env.DEV_AUTH === "1",
      google: googleEnabled(env, url.host),
      email: { owner: Boolean(env.EMAIL), users: env.EMAIL_USERS === "1" },
      turnstileSiteKey: env.TURNSTILE_SECRET ? env.TURNSTILE_SITE_KEY || null : null,
    });

  if (seg[0] === "auth") {
    const r = await authRoutes(req, env, url, path, m);
    if (r) return r;
  }

  // ── contacto (público) ──
  if (path === "/api/contact" && m === "POST") {
    const ip = req.headers.get("cf-connecting-ip") || "local";
    if (!(await rateLimit(env, `contact:${ip}`, 5, 3600))) throw new HttpError(429, "Has enviado varios mensajes seguidos. Inténtalo más tarde.");
    const b = await readJson<{ name?: string; email?: string; subject?: string; message?: string; turnstile?: string; website?: string }>(req, 12_000);
    if (b.website) return json({ ok: true }); // trampa anti-spam: campo oculto
    await verifyTurnstile(env, b.turnstile, ip);
    const name = String(b.name || "").trim().slice(0, 80);
    const email = normalizeEmail(b.email);
    const subject = String(b.subject || "Consulta").trim().slice(0, 120) || "Consulta";
    const message = String(b.message || "").trim().slice(0, 4000);
    if (name.length < 2) throw new HttpError(400, "Escribe tu nombre.");
    if (!email) throw new HttpError(400, "Escribe un correo electrónico válido.");
    if (message.length < 10) throw new HttpError(400, "Cuéntanos un poco más (mínimo 10 caracteres).");
    const u = await currentUser(env, req);
    await env.DB.prepare("INSERT INTO contact_messages (ts, name, email, subject, message, user_id) VALUES (?, ?, ?, ?, ?, ?)").bind(Date.now(), name, email, subject, message, u?.id ?? null).run();
    later(req, notifyOwner(env, "owner_contact", `Contacto: ${subject}`, [`De: ${name} <${email}>`, message], email));
    return json({ ok: true });
  }

  // diagnóstico gratuito de la IA (no genera texto ni expone la clave)
  if (path === "/api/ai/status" && m === "GET") {
    const ip = req.headers.get("cf-connecting-ip") || "local";
    if (!(await rateLimit(env, `aistatus:${ip}`, 20, 3600))) throw new HttpError(429, "Demasiadas comprobaciones. Inténtalo más tarde.");
    if (url.searchParams.get("probe") === "1") {
      if (!(await rateLimit(env, "aiprobe:global", 5, 3600))) throw new HttpError(429, "Prueba ya realizada hace poco.");
      return json(await probeGemini(env.GEMINI_API_KEY, env.GEMINI_MODEL || DEFAULT_MODEL));
    }
    return json(await diagnoseGemini(env.GEMINI_API_KEY, env.GEMINI_MODEL || DEFAULT_MODEL));
  }

  // avisar a los buscadores de cambios (como mucho 1 vez por hora para todo el sitio)
  if (path === "/api/seo/indexnow" && m === "POST") {
    if (!(await rateLimit(env, "indexnow:global", 1, 3600))) throw new HttpError(429, "Ya se avisó a los buscadores hace menos de una hora.");
    return json(await indexNow(env));
  }

  if (path === "/api/email/unsubscribe" && m === "GET") {
    const t = url.searchParams.get("t") || "";
    const u = t.length >= 16 ? await env.DB.prepare("SELECT * FROM users WHERE unsub_token = ?").bind(t).first<UserRow>() : null;
    if (u) {
      const prof = JSON.parse(u.profile || "{}") as Record<string, unknown>;
      prof.emailOptIn = false;
      await env.DB.prepare("UPDATE users SET profile = ? WHERE id = ?").bind(JSON.stringify(prof), u.id).run();
    }
    return new Response(
      `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Baja de correos · DNI GYM</title><body style="margin:0;background:#070708;color:#f4f4f5;font-family:Inter,Arial,sans-serif;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px"><div><h1 style="font-style:italic;text-transform:uppercase">${u ? "Listo, te hemos dado de baja" : "Enlace no válido"}</h1><p style="color:#b9bcc2">${u ? "Ya no recibirás recordatorios. Puedes volver a activarlos en tu Perfil." : "El enlace ha caducado o no es correcto."}</p><p><a href="/" style="color:#ff6b1a">Volver a DNI GYM</a></p></div></body></html>`,
      { headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" } },
    );
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

  // importar una copia de seguridad (JSON exportado): no sobrescribe nada existente
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
      env.DB.prepare("DELETE FROM auth_tokens WHERE user_id = ?").bind(user.id),
      env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
    ]);
    await logEvent(env, { type: "account_deleted", email: user.email });
    return json({ ok: true }, 200, { "set-cookie": clearCookie(req) });
  }

  // ── DNI AI Coach ──
  if (seg[0] === "ai") {
    if (path === "/api/ai/quota" && m === "GET") return json(await aiQuota(env, user));
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
      const b = await readJson<{ blocked?: boolean; role?: string; aiLimit?: number | null; aiBlocked?: boolean }>(req);
      const target = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(seg[2]).first<UserRow>();
      if (!target) throw new HttpError(404, "Usuario no encontrado");
      if (target.id === admin.id && (b.blocked || (b.role && b.role !== "admin"))) throw new HttpError(400, "No puedes bloquearte ni quitarte el rol de administrador a ti mismo");
      if (typeof b.blocked === "boolean") {
        await env.DB.prepare("UPDATE users SET blocked = ? WHERE id = ?").bind(b.blocked ? 1 : 0, target.id).run();
        if (b.blocked) await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(target.id).run();
        await audit(env, admin, b.blocked ? "user.block" : "user.unblock", target.email);
      }
      if ("aiLimit" in b) {
        const lim = b.aiLimit === null ? null : Math.max(0, Math.min(500, Math.round(Number(b.aiLimit))));
        if (lim !== null && !Number.isFinite(lim)) throw new HttpError(400, "Límite no válido");
        await env.DB.prepare("UPDATE users SET ai_limit = ? WHERE id = ?").bind(lim, target.id).run();
        await audit(env, admin, "user.ai_limit", target.email, { aiLimit: lim });
      }
      if (typeof b.aiBlocked === "boolean") {
        await env.DB.prepare("UPDATE users SET ai_blocked = ? WHERE id = ?").bind(b.aiBlocked ? 1 : 0, target.id).run();
        await audit(env, admin, b.aiBlocked ? "user.ai_block" : "user.ai_unblock", target.email);
      }
      if (b.role === "admin" || b.role === "user") {
        await env.DB.prepare("UPDATE users SET role = ? WHERE id = ?").bind(b.role, target.id).run();
        await audit(env, admin, "user.role", target.email, { role: b.role });
      }
      const fresh = (await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(target.id).first<UserRow>())!;
      return json(toProfile(fresh));
    }
    if (seg[1] === "users" && seg[2] && seg[3] === "reset-link" && m === "POST") {
      const target = await userBy(env, "id", seg[2]);
      if (!target) throw new HttpError(404, "Usuario no encontrado");
      const link = await createResetLink(env, url.origin, target.id, 72, admin.id);
      await audit(env, admin, "user.reset_link", target.email);
      return json(link);
    }
    if (path === "/api/admin/messages" && m === "GET") {
      const r = await env.DB.prepare("SELECT * FROM contact_messages ORDER BY id DESC LIMIT 300").all();
      return json(r.results);
    }
    if (seg[1] === "messages" && seg[2] && m === "PATCH") {
      const b = await readJson<{ status?: string }>(req);
      if (!["nuevo", "en_curso", "resuelto"].includes(String(b.status))) throw new HttpError(400, "Estado no válido");
      await env.DB.prepare("UPDATE contact_messages SET status = ? WHERE id = ?").bind(b.status, Number(seg[2])).run();
      return json({ ok: true });
    }
    if (path === "/api/admin/emails" && m === "GET") {
      const r = await env.DB.prepare("SELECT * FROM email_log ORDER BY id DESC LIMIT 200").all();
      return json(r.results);
    }
    if (path === "/api/admin/errors/clear" && m === "POST") {
      // el dueño marca como resueltos (elimina) los errores de un código o mensaje concreto
      const b = await readJson<{ code?: string | null; message?: string | null }>(req);
      const r = b.code
        ? await env.DB.prepare("DELETE FROM events WHERE type IN ('auth_error','client_error') AND code = ?").bind(String(b.code)).run()
        : b.message
          ? await env.DB.prepare("DELETE FROM events WHERE type = 'client_error' AND message = ?").bind(String(b.message)).run()
          : await env.DB.prepare("DELETE FROM events WHERE type = 'client_error' AND (code IS NULL OR code = '')").run();
      await audit(env, admin, "errors.clear", b.code ?? b.message ?? "client_error", { deleted: r.meta.changes });
      return json({ deleted: r.meta.changes });
    }
    if (path === "/api/admin/revenue" && m === "GET") {
      const since = Date.now() - 30 * 864e5;
      const [plans, subs, pay30, payAll, recent, byPlan] = await env.DB.batch([
        env.DB.prepare("SELECT * FROM plans ORDER BY price_cents"),
        env.DB.prepare("SELECT COUNT(*) active, COALESCE(SUM(p.price_cents),0) mrr FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.status = 'active'"),
        env.DB.prepare("SELECT COUNT(*) n, COALESCE(SUM(amount_cents),0) total FROM payments WHERE status = 'paid' AND ts >= ?").bind(since),
        env.DB.prepare("SELECT COUNT(*) n, COALESCE(SUM(amount_cents),0) total, COUNT(DISTINCT user_id) payers FROM payments WHERE status = 'paid'"),
        env.DB.prepare("SELECT p.*, u.email, u.name FROM payments p LEFT JOIN users u ON u.id = p.user_id ORDER BY p.ts DESC LIMIT 50"),
        env.DB.prepare("SELECT plan k, COUNT(*) c FROM users GROUP BY plan"),
      ]);
      return json({
        enabled: false,
        plans: plans.results,
        activeSubscriptions: Number((subs.results[0] as { active: number }).active),
        mrrCents: Number((subs.results[0] as { mrr: number }).mrr),
        revenue30Cents: Number((pay30.results[0] as { total: number }).total),
        payments30: Number((pay30.results[0] as { n: number }).n),
        revenueAllCents: Number((payAll.results[0] as { total: number }).total),
        payers: Number((payAll.results[0] as { payers: number }).payers),
        recent: recent.results,
        usersByPlan: byPlan.results,
      });
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
        auth: { password: true, google: googleEnabled(env), googleHosts: env.GOOGLE_HOSTS || "todos", turnstile: Boolean(env.TURNSTILE_SECRET), email: Boolean(env.EMAIL), emailUsers: env.EMAIL_USERS === "1" },
        siteUrl: env.SITE_URL || url.origin,
        aiGlobalDailyLimit: Number(env.AI_GLOBAL_DAILY_LIMIT || 200),
      });
    }
    // ── centro de control: métricas, CRM, inventario y agentes ──
    if (path === "/api/admin/metrics" && m === "GET") {
      const days = Math.min(90, Math.max(7, Number(url.searchParams.get("days") || 30)));
      return json(await metrics(env, days));
    }
    if (path === "/api/admin/crm" && m === "GET") return json(await crmList(env));
    if (seg[1] === "crm" && seg[2] && seg[3] === "tags" && m === "PUT") {
      const b = await readJson<{ tags?: unknown }>(req);
      const tags = await crmSetTags(env, seg[2], b.tags);
      await audit(env, admin, "crm.tags", seg[2], { tags });
      return json({ tags });
    }
    if (seg[1] === "crm" && seg[2] && seg[3] === "notes" && m === "GET") return json(await crmNotes(env, seg[2]));
    if (seg[1] === "crm" && seg[2] && seg[3] === "notes" && m === "POST") {
      const b = await readJson<{ text?: unknown }>(req, 8_000);
      return json(await crmAddNote(env, seg[2], admin.email, b.text));
    }
    if (seg[1] === "crm" && seg[2] && seg[3] === "ai" && m === "POST") {
      await checkAiQuota(env, admin);
      const g = gemini(env);
      const usage = { tokens: 0 };
      const ctx = await customerContext(env, seg[2]);
      return sse(g.streamChat([], ctx, { system: CUSTOMER_SYSTEM, temperature: 0.5, maxOutputTokens: 900 }, usage), async () => {
        await addAiUsage(env, admin.id, usage.tokens);
        await audit(env, admin, "crm.ai", seg[2]);
      });
    }
    if (seg[1] === "agents" && seg[2] && m === "POST") {
      const id = seg[2] as AgentId;
      if (!(id in AGENTS)) throw new HttpError(404, "Agente no encontrado");
      const { message } = await readJson<{ message?: string }>(req, 8_000);
      await checkAiQuota(env, admin);
      const g = gemini(env);
      const usage = { tokens: 0 };
      const ctx = await agentContext(env, id, await platformContext(env));
      const ask = String(message || "").trim().slice(0, 1500) || "Haz tu análisis completo con los datos actuales.";
      return sse(g.streamChat([], `${ctx}\n\nPETICIÓN DEL DUEÑO: ${ask}`, { system: AGENTS[id].system, temperature: 0.5, maxOutputTokens: 1600 }, usage), async () => {
        await addAiUsage(env, admin.id, usage.tokens);
        await audit(env, admin, "agent.run", id, { q: ask.slice(0, 200) });
      });
    }
    if (path === "/api/admin/inventory" && m === "GET") return json(await inventoryList(env));
    if (path === "/api/admin/inventory" && m === "POST") {
      const b = await readJson<Record<string, unknown>>(req, 8_000);
      const id = await inventoryCreate(env, b, admin.email);
      await audit(env, admin, "inventory.create", id, { name: b.name });
      return json(await inventoryList(env));
    }
    if (seg[1] === "inventory" && seg[2] && seg[3] === "move" && m === "POST") {
      const b = await readJson<{ delta?: unknown; reason?: unknown }>(req);
      await inventoryMove(env, seg[2], b.delta, b.reason, admin.email);
      return json(await inventoryList(env));
    }
    if (seg[1] === "inventory" && seg[2] && !seg[3] && m === "PATCH") {
      await inventoryUpdate(env, seg[2], await readJson<Record<string, unknown>>(req, 8_000));
      await audit(env, admin, "inventory.update", seg[2]);
      return json(await inventoryList(env));
    }
    if (seg[1] === "inventory" && seg[2] && !seg[3] && m === "DELETE") {
      await inventoryDelete(env, seg[2]);
      await audit(env, admin, "inventory.delete", seg[2]);
      return json(await inventoryList(env));
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


/** IndexNow: avisa a Bing, Yandex, Naver y Seznam (y a los buscadores de IA que usan Bing) de todas las URL del sitemap. */
const INDEXNOW_KEY = "d1c26e164ea44e77409679619fcd5d94";
async function indexNow(env: Env) {
  const base = (env.SITE_URL || "https://dnigym.com").replace(/\/$/, "");
  const xml = await (await env.ASSETS.fetch(new Request(`${base}/sitemap.xml`))).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, 10000);
  const body = JSON.stringify({ host: new URL(base).host, key: INDEXNOW_KEY, keyLocation: `${base}/${INDEXNOW_KEY}.txt`, urlList: urls });
  const post = (endpoint: string) => fetch(endpoint, { method: "POST", headers: { "content-type": "application/json; charset=utf-8" }, body });
  // api.indexnow.org reparte a todos los buscadores; si limita (429) se avisa directamente a Bing y Yandex
  const main = await post("https://api.indexnow.org/indexnow");
  if (main.ok) return { status: main.status, urls: urls.length, via: "indexnow.org" };
  const [bing, yandex] = await Promise.all([post("https://www.bing.com/indexnow"), post("https://yandex.com/indexnow")]);
  return { status: main.status, bing: bing.status, yandex: yandex.status, urls: urls.length };
}

/** Tareas diarias (Cron Trigger): recordatorios, resumen semanal al dueño y limpieza técnica. */
async function daily(env: Env, ctx: ExecutionContext) {
  await ensureSchema(env);
  const now = Date.now();
  const url = new URL(env.SITE_URL || "https://dnigym.com");
  // limpieza: sesiones y enlaces caducados, contadores de límites antiguos
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now),
    env.DB.prepare("DELETE FROM auth_tokens WHERE expires_at < ?").bind(now),
    env.DB.prepare("DELETE FROM rate_limits WHERE window < ?").bind(Math.floor(now / 1000 / 86400) - 2),
  ]);
  // recordatorios a quien lleva 3+ días sin entrar (máx. 1 por semana y 200 al día)
  if (env.EMAIL_USERS === "1") {
    const r = await env.DB.prepare(
      `SELECT * FROM users WHERE blocked = 0 AND last_active_at < ?1 AND last_active_at > ?2 AND (last_reminder_at IS NULL OR last_reminder_at < ?3)
       AND COALESCE(json_extract(profile,'$.emailOptIn'), 1) != 0 LIMIT 200`,
    )
      .bind(now - 3 * 864e5, now - 60 * 864e5, now - 7 * 864e5)
      .all<UserRow>();
    for (const u of r.results) {
      const days = Math.round((now - u.last_active_at) / 864e5);
      const ok = await sendMail(env, "reminder", { to: u.email, ...reminderMail(env, u.name || "", days, await unsubUrl(env, url, u)) });
      if (ok) await env.DB.prepare("UPDATE users SET last_reminder_at = ? WHERE id = ?").bind(now, u.id).run();
    }
  }
  // lunes: aviso a buscadores (IndexNow) y resumen semanal al dueño
  if (new Date(now).getUTCDay() === 1) {
    ctx.waitUntil(indexNow(env).catch((e) => console.error("indexnow", e)));
    const w = now - 7 * 864e5;
    const s = await env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM users) total, (SELECT COUNT(*) FROM users WHERE created_at >= ?1) nuevos, (SELECT COUNT(*) FROM users WHERE last_active_at >= ?1) activos,
       (SELECT COUNT(*) FROM workouts WHERE date >= ?1) entrenos, (SELECT COUNT(*) FROM events WHERE type IN ('auth_error','client_error') AND ts >= ?1) errores,
       (SELECT COUNT(*) FROM contact_messages WHERE status = 'nuevo') mensajes`,
    )
      .bind(w)
      .first<Record<string, number>>();
    ctx.waitUntil(
      notifyOwner(env, "owner_summary", "Resumen semanal de DNI GYM", [
        `Usuarios totales: ${s?.total}. Nuevos esta semana: ${s?.nuevos}. Activos: ${s?.activos}.`,
        `Entrenos guardados: ${s?.entrenos}. Errores: ${s?.errores}. Mensajes sin responder: ${s?.mensajes}.`,
      ]),
    );
  }
}

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(daily(env, ctx));
  },
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const pth = url.pathname;
    if (pth === "/" || pth === "/mcp" || pth === "/openapi.json" || pth.startsWith("/.well-known/") || pth.startsWith("/api/public/")) {
      try {
        const r = await agentRoutes(req, env, url);
        if (r) return r;
      } catch (e) {
        console.error("agent route", pth, e);
        if (pth !== "/") return json({ error: "Error interno" }, 500);
      }
    }
    if (!pth.startsWith("/api/")) return env.ASSETS.fetch(req);
    CTX.set(req, ctx);
    try {
      return await handleApi(req, env, url);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error("API error", url.pathname, e);
      return json({ error: "Error interno. Inténtalo de nuevo." }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
