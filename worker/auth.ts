import type { Env } from "./env";
import { HttpError, getCookie } from "./http";

export const SESSION_COOKIE = "dni_session";
const SESSION_DAYS = 180;

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  photo_url: string | null;
  provider: string | null;
  role: string;
  blocked: number;
  profile: string;
  created_at: number;
  last_login_at: number;
  last_active_at: number;
  login_count: number;
  workouts_count: number;
  password_hash: string | null;
  email_verified: number;
  google_sub: string | null;
  unsub_token?: string | null;
  last_reminder_at?: number | null;
  ai_limit?: number | null;
  ai_blocked?: number;
  plan?: string;
}

// ───────────────────────── utilidades ─────────────────────────

const enc = new TextEncoder();

export const b64urlToBytes = (s: string) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
export const bytesToB64url = (b: Uint8Array) => {
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const randomToken = (bytes = 32) => bytesToB64url(crypto.getRandomValues(new Uint8Array(bytes)));
export const randomId = () => [...crypto.getRandomValues(new Uint8Array(12))].map((x) => x.toString(16).padStart(2, "0")).join("");

export async function sha256Hex(s: string) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Comparación en tiempo constante. */
function safeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}

// ───────────────────────── contraseñas ─────────────────────────

/** PBKDF2-SHA256 con sal aleatoria (100 000 iteraciones: el máximo que admite Workers). */
const PBKDF2_ITERATIONS = 100_000;

async function pbkdf2(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password.normalize("NFKC")), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${bytesToB64url(salt)}$${bytesToB64url(hash)}`;
}

const DUMMY_HASH = `pbkdf2-sha256$${PBKDF2_ITERATIONS}$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;

/** Verifica la contraseña. Si no hay hash, calcula uno de todas formas para no revelar por tiempo si la cuenta existe. */
export async function verifyPassword(password: string, stored: string | null) {
  const [algo, iter, salt, hash] = (stored || DUMMY_HASH).split("$");
  if (algo !== "pbkdf2-sha256") return false;
  const calc = await pbkdf2(password, b64urlToBytes(salt), Number(iter));
  return Boolean(stored) && safeEqual(calc, b64urlToBytes(hash));
}

const COMMON = new Set([
  "1234567890", "12345678910", "123456789a", "contraseña1", "contrasena1", "password1", "password123", "qwertyuiop", "1q2w3e4r5t", "abcdefghij",
  "iloveyou12", "dnigym1234", "gimnasio123", "0123456789", "1111111111", "aaaaaaaaaa", "asdfghjklñ", "asdfghjkl1", "superman12", "qwerty1234",
]);

/** Devuelve un mensaje si la contraseña no es suficientemente segura. */
export function passwordProblem(pw: unknown, email?: string): string | null {
  if (typeof pw !== "string") return "Escribe una contraseña.";
  if (pw.length < 10) return "La contraseña debe tener al menos 10 caracteres.";
  if (pw.length > 200) return "La contraseña es demasiado larga.";
  if (!/[a-zA-ZñÑ]/.test(pw) || !/\d/.test(pw)) return "Usa letras y al menos un número.";
  if (new Set(pw).size < 5 || COMMON.has(pw.toLowerCase())) return "Esa contraseña es demasiado fácil de adivinar.";
  const local = email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && pw.toLowerCase().includes(local)) return "La contraseña no puede contener tu correo.";
  return null;
}

export function normalizeEmail(v: unknown) {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return null;
  return e;
}

// ───────────────────────── Turnstile (anti-bots de Cloudflare) ─────────────────────────

export async function verifyTurnstile(env: Env, token: unknown, ip: string | null) {
  if (!env.TURNSTILE_SECRET) return; // sin configurar (desarrollo local)
  if (typeof token !== "string" || !token || token.length > 4096) throw new HttpError(400, "Completa la verificación de seguridad.");
  const body = new FormData();
  body.append("secret", env.TURNSTILE_SECRET);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const out = (await res.json().catch(() => ({}))) as { success?: boolean };
  if (!out.success) throw new HttpError(400, "La verificación de seguridad ha fallado. Recarga la página e inténtalo de nuevo.");
}

// ───────────────────────── Google (OAuth 2.0 + OpenID Connect) ─────────────────────────

/** Google se ofrece solo en los hosts cuya URL de retorno está registrada en Google Cloud (GOOGLE_HOSTS). */
export const googleEnabled = (env: Env, host?: string) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return false;
  if (!host || !env.GOOGLE_HOSTS) return true;
  return env.GOOGLE_HOSTS.split(",").map((h) => h.trim().toLowerCase()).includes(host.toLowerCase()) || host.startsWith("127.0.0.1") || host.startsWith("localhost");
};

const GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
let jwksCache: { keys: (JsonWebKey & { kid: string })[]; exp: number } | null = null;

async function googleKeys(force = false) {
  if (!force && jwksCache && jwksCache.exp > Date.now()) return jwksCache.keys;
  const res = await fetch(GOOGLE_JWKS);
  if (!res.ok) throw new HttpError(503, "No se pudieron obtener las claves de Google");
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") || "")?.[1] ?? 3600);
  const body = (await res.json()) as { keys: (JsonWebKey & { kid: string })[] };
  jwksCache = { keys: body.keys, exp: Date.now() + maxAge * 1000 };
  return body.keys;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
}

/** Verifica el ID token devuelto por Google: firma RS256, emisor, audiencia, caducidad, nonce y email verificado. */
export async function verifyGoogleIdToken(token: string, clientId: string, nonce: string): Promise<GoogleIdentity> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new HttpError(401, "Token de Google no válido");
  const [h, p, s] = parts;
  let header: { alg?: string; kid?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
  } catch {
    throw new HttpError(401, "Token de Google no válido");
  }
  if (header.alg !== "RS256" || !header.kid) throw new HttpError(401, "Algoritmo de token no válido");
  let jwk = (await googleKeys()).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await googleKeys(true)).find((k) => k.kid === header.kid);
  if (!jwk) throw new HttpError(401, "Clave de firma desconocida");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  if (!(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(s), enc.encode(`${h}.${p}`)))) throw new HttpError(401, "Firma de token no válida");

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== clientId) throw new HttpError(401, "Audiencia de token no válida");
  if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") throw new HttpError(401, "Emisor de token no válido");
  if (typeof payload.exp !== "number" || payload.exp < now - 30) throw new HttpError(401, "El token de Google ha caducado");
  if (payload.nonce !== nonce) throw new HttpError(401, "Nonce no válido");
  if (typeof payload.sub !== "string" || !payload.sub || payload.sub.length > 255) throw new HttpError(401, "Usuario de Google no válido");
  if (typeof payload.email !== "string" || payload.email_verified !== true) throw new HttpError(403, "Tu email de Google no está verificado");
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: typeof payload.name === "string" ? payload.name.slice(0, 80) : payload.email.split("@")[0],
    picture: typeof payload.picture === "string" && payload.picture.startsWith("https://") ? payload.picture.slice(0, 500) : null,
  };
}

export async function pkceChallenge(verifier: string) {
  return bytesToB64url(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(verifier))));
}

// ───────────────────────── sesiones ─────────────────────────

export async function createSession(env: Env, userId: string, ua: string | null) {
  const token = randomToken(32);
  const now = Date.now();
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at, ua) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(await sha256Hex(token), userId, now, now + SESSION_DAYS * 864e5, now, ua?.slice(0, 300) ?? null)
    .run();
  return token;
}

const isHttps = (req: Request) => new URL(req.url).protocol === "https:";

export function sessionCookie(token: string, req: Request) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${isHttps(req) ? "; Secure" : ""}`;
}

export function clearCookie(req: Request) {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isHttps(req) ? "; Secure" : ""}`;
}

/** Cookie temporal para el flujo de Google (estado, PKCE y nonce). */
export function tempCookie(name: string, value: string, req: Request, maxAge = 600) {
  return `${name}=${value}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isHttps(req) ? "; Secure" : ""}`;
}

/** Devuelve el usuario de la sesión actual o null. Renueva la actividad como mucho cada 10 minutos. */
export async function currentUser(env: Env, req: Request): Promise<UserRow | null> {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token || token.length > 100) return null;
  const hash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT u.*, s.expires_at AS s_exp, s.last_seen_at AS s_seen FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
  )
    .bind(hash)
    .first<UserRow & { s_exp: number; s_seen: number }>();
  if (!row) return null;
  const now = Date.now();
  if (row.s_exp < now) {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hash).run();
    return null;
  }
  if (now - row.s_seen > 10 * 60_000) {
    await env.DB.batch([
      env.DB.prepare("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?").bind(now, hash),
      env.DB.prepare("UPDATE users SET last_active_at = ? WHERE id = ?").bind(now, row.id),
    ]);
    row.last_active_at = now;
  }
  return row;
}

export async function requireUser(env: Env, req: Request) {
  const u = await currentUser(env, req);
  if (!u) throw new HttpError(401, "Inicia sesión para continuar");
  if (u.blocked) throw new HttpError(403, "Tu cuenta está suspendida");
  return u;
}

export async function requireAdmin(env: Env, req: Request) {
  const u = await requireUser(env, req);
  if (u.role !== "admin") throw new HttpError(403, "Solo para administradores");
  return u;
}

export function adminEmails(env: Env) {
  return (env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Convierte la fila de usuario en el perfil que usa la app (sin datos sensibles). */
export function toProfile(u: UserRow) {
  let extra: Record<string, unknown> = {};
  try {
    extra = JSON.parse(u.profile || "{}");
  } catch {}
  return {
    ...extra,
    uid: u.id,
    email: u.email,
    name: u.name ?? u.email.split("@")[0],
    photoURL: u.photo_url,
    provider: u.provider ?? "password",
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
    lastActiveAt: u.last_active_at,
    loginCount: u.login_count,
    workoutsCount: u.workouts_count,
    blocked: Boolean(u.blocked),
    role: u.role,
    emailVerified: Boolean(u.email_verified),
    hasPassword: Boolean(u.password_hash),
    googleLinked: Boolean(u.google_sub),
    aiLimit: u.ai_limit ?? null,
    aiBlocked: Boolean(u.ai_blocked),
    plan: u.plan ?? "free",
  };
}
