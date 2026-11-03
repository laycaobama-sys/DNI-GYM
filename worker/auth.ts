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
}

export interface GoogleIdentity {
  uid: string;
  email: string;
  name: string;
  picture: string | null;
  provider: string;
}

// ───────────────────────── utilidades criptográficas ─────────────────────────

const b64urlToBytes = (s: string) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const bytesToB64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function sha256Hex(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ───────────────────────── verificación del token de Google (Firebase) ─────────────────────────

const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let jwksCache: { keys: (JsonWebKey & { kid: string })[]; exp: number } | null = null;

async function getJwks() {
  if (jwksCache && jwksCache.exp > Date.now()) return jwksCache.keys;
  const res = await fetch(JWKS_URL, { cf: { cacheTtl: 3600 } } as RequestInit);
  if (!res.ok) throw new HttpError(503, "No se pudieron obtener las claves de Google");
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") || "")?.[1] ?? 3600);
  const body = (await res.json()) as { keys: (JsonWebKey & { kid: string })[] };
  jwksCache = { keys: body.keys, exp: Date.now() + maxAge * 1000 };
  return body.keys;
}

/**
 * Verifica un ID token de Firebase Auth (inicio de sesión con Google):
 * firma RS256 con las claves públicas de Google, emisor, audiencia y caducidad.
 */
export async function verifyGoogleIdToken(token: string, projectId: string): Promise<GoogleIdentity> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new HttpError(401, "Token no válido");
  const [h, p, s] = parts;
  let header: { alg?: string; kid?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
    payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
  } catch {
    throw new HttpError(401, "Token no válido");
  }
  if (header.alg !== "RS256" || !header.kid) throw new HttpError(401, "Algoritmo de token no válido");
  let jwk = (await getJwks()).find((k) => k.kid === header.kid);
  if (!jwk) {
    jwksCache = null; // las claves rotan: reintentar una vez con claves nuevas
    jwk = (await getJwks()).find((k) => k.kid === header.kid);
  }
  if (!jwk) throw new HttpError(401, "Clave de firma desconocida");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new HttpError(401, "Firma de token no válida");

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId) throw new HttpError(401, "Audiencia de token no válida");
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new HttpError(401, "Emisor de token no válido");
  if (typeof payload.exp !== "number" || payload.exp < now - 30) throw new HttpError(401, "El token ha caducado");
  if (typeof payload.iat !== "number" || payload.iat > now + 300) throw new HttpError(401, "Fecha de token no válida");
  if (typeof payload.sub !== "string" || !payload.sub || payload.sub.length > 128) throw new HttpError(401, "Usuario no válido");
  if (typeof payload.email !== "string" || payload.email_verified !== true) throw new HttpError(403, "El email de Google no está verificado");

  const fb = (payload.firebase ?? {}) as { sign_in_provider?: string };
  return {
    uid: payload.sub,
    email: payload.email.toLowerCase(),
    name: typeof payload.name === "string" ? payload.name : payload.email.split("@")[0],
    picture: typeof payload.picture === "string" ? payload.picture : null,
    provider: fb.sign_in_provider ?? "google.com",
  };
}

// ───────────────────────── sesiones ─────────────────────────

export async function createSession(env: Env, userId: string, ua: string | null) {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const token = bytesToB64url(raw);
  const now = Date.now();
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at, ua) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(await sha256Hex(token), userId, now, now + SESSION_DAYS * 864e5, now, ua?.slice(0, 300) ?? null)
    .run();
  return token;
}

export function sessionCookie(token: string, req: Request) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`;
}

export function clearCookie(req: Request) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
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

/** Convierte la fila de usuario en el perfil que usa la app. */
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
    provider: u.provider ?? "google.com",
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
    lastActiveAt: u.last_active_at,
    loginCount: u.login_count,
    workoutsCount: u.workouts_count,
    blocked: Boolean(u.blocked),
    role: u.role,
  };
}
