// Centro de control del dueño: métricas agregadas, CRM, inventario y contexto para los agentes de IA.
import type { Env } from "./env";
import { HttpError } from "./http";
import { randomId } from "./auth";
import { EXERCISES } from "../src/data/exercises";
import { ROUTINES } from "../src/data/routines";

const DAY = 864e5;
type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0) || 0;
const first = (r: D1Result) => (r.results[0] ?? {}) as Row;

// ───────────────────────── métricas ─────────────────────────

const DEVICE_SQL = `CASE WHEN ua LIKE '%iPad%' OR ua LIKE '%Tablet%' THEN 'Tablet'
  WHEN ua LIKE '%Mobi%' OR ua LIKE '%Android%' OR ua LIKE '%iPhone%' THEN 'Móvil' ELSE 'Ordenador' END`;

export async function metrics(env: Env, days: number) {
  const now = Date.now();
  const since = now - days * DAY;
  const prev = since - days * DAY;
  const d = (n: number) => now - n * DAY;
  const q = (sql: string, ...b: unknown[]) => env.DB.prepare(sql).bind(...b);
  const [
    tot, perSignup, perActive, perWorkout, perVisit, perAi, devices, refs, goals, places, levels, providers, topEx, hours, recent, pages, funnelR, ret, errs,
  ] = await env.DB.batch([
    q(`SELECT COUNT(*) users,
        SUM(created_at >= ?1) new_range, SUM(created_at >= ?2 AND created_at < ?1) new_prev,
        SUM(last_active_at >= ?3) a1, SUM(last_active_at >= ?4) a7, SUM(last_active_at >= ?5) a30,
        SUM(json_extract(profile,'$.onboarded') = 1) onboarded, SUM(blocked) blocked, SUM(email_verified) verified,
        SUM(workouts_count > 0) with_workouts, SUM(role = 'admin') admins
       FROM users`, since, prev, d(1), d(7), d(30)),
    q(`SELECT date(created_at/1000,'unixepoch') d, COUNT(*) c FROM users WHERE created_at >= ? GROUP BY d`, since),
    q(`SELECT date(ts/1000,'unixepoch') d, COUNT(DISTINCT user_id) c FROM events WHERE ts >= ? AND user_id IS NOT NULL GROUP BY d`, since),
    q(`SELECT date(date/1000,'unixepoch') d, COUNT(*) c FROM workouts WHERE date >= ? GROUP BY d`, since),
    q(`SELECT date(ts/1000,'unixepoch') d, COUNT(*) c FROM events WHERE type = 'visit' AND ts >= ? GROUP BY d`, since),
    q(`SELECT day d, SUM(requests) c FROM ai_usage WHERE day >= ? GROUP BY day`, new Date(since).toISOString().slice(0, 10)),
    q(`SELECT ${DEVICE_SQL} k, COUNT(*) c FROM events WHERE ts >= ? AND ua IS NOT NULL GROUP BY k ORDER BY c DESC`, since),
    q(`SELECT COALESCE(NULLIF(ref,''),'Directo') k, COUNT(*) c FROM events WHERE type = 'visit' AND ts >= ? GROUP BY k ORDER BY c DESC LIMIT 8`, since),
    q(`SELECT COALESCE(json_extract(profile,'$.goal'),'sin definir') k, COUNT(*) c FROM users GROUP BY k ORDER BY c DESC`),
    q(`SELECT COALESCE(json_extract(profile,'$.place'),'sin definir') k, COUNT(*) c FROM users GROUP BY k ORDER BY c DESC`),
    q(`SELECT COALESCE(json_extract(profile,'$.level'),'sin definir') k, COUNT(*) c FROM users GROUP BY k ORDER BY c DESC`),
    q(`SELECT SUM(password_hash IS NOT NULL AND google_sub IS NULL) password, SUM(google_sub IS NOT NULL AND password_hash IS NULL) google, SUM(google_sub IS NOT NULL AND password_hash IS NOT NULL) both FROM users`),
    q(`SELECT json_extract(e.value,'$.name') k, COUNT(*) c FROM workouts w, json_each(w.data,'$.exercises') e WHERE w.date >= ? GROUP BY k ORDER BY c DESC LIMIT 8`, since),
    q(`SELECT CAST(strftime('%H', ts/1000, 'unixepoch') AS INTEGER) h, COUNT(*) c FROM events WHERE ts >= ? AND type IN ('login','signup','workout_completed','visit') GROUP BY h`, since),
    q(`SELECT id, name, email, created_at, provider, google_sub IS NOT NULL g, json_extract(profile,'$.onboarded') ob, json_extract(profile,'$.goal') goal, workouts_count w FROM users ORDER BY created_at DESC LIMIT 12`),
    q(`SELECT COALESCE(path,'/') k, COUNT(*) c FROM events WHERE type = 'visit' AND ts >= ? GROUP BY k ORDER BY c DESC LIMIT 8`, since),
    q(`SELECT (SELECT COUNT(*) FROM events WHERE type='visit' AND ts >= ?1) visits,
        COUNT(*) signups, SUM(json_extract(profile,'$.onboarded') = 1) onboarded, SUM(workouts_count >= 1) first_workout, SUM(workouts_count >= 3) habit
       FROM users WHERE created_at >= ?1`, since),
    q(`SELECT SUM(created_at <= ?1) d7_base, SUM(created_at <= ?1 AND last_active_at >= created_at + 7*86400000) d7,
        SUM(created_at <= ?2) d30_base, SUM(created_at <= ?2 AND last_active_at >= created_at + 30*86400000) d30 FROM users`, d(7), d(30)),
    q(`SELECT COUNT(*) c FROM events WHERE type IN ('auth_error','client_error') AND ts >= ?`, d(7)),
  ]);

  const series = (r: D1Result) => {
    const m = new Map((r.results as { d: string; c: number }[]).map((x) => [x.d, num(x.c)]));
    return Array.from({ length: days }, (_, i) => {
      const key = new Date(since + (i + 1) * DAY).toISOString().slice(0, 10);
      return { d: key, v: m.get(key) ?? 0 };
    });
  };
  const kv = (r: D1Result) => (r.results as { k: string; c: number }[]).map((x) => ({ label: String(x.k), value: num(x.c) }));
  const t = first(tot);
  const f = first(funnelR);
  const rt = first(ret);
  const pv = first(providers);
  const hourMap = new Map((hours.results as { h: number; c: number }[]).map((x) => [num(x.h), num(x.c)]));
  return {
    days,
    generatedAt: now,
    totals: {
      users: num(t.users), newRange: num(t.new_range), newPrev: num(t.new_prev), active1: num(t.a1), active7: num(t.a7), active30: num(t.a30),
      onboarded: num(t.onboarded), blocked: num(t.blocked), verified: num(t.verified), withWorkouts: num(t.with_workouts), admins: num(t.admins), errors7: num(first(errs).c),
    },
    series: { signups: series(perSignup), active: series(perActive), workouts: series(perWorkout), visits: series(perVisit), ai: series(perAi) },
    funnel: [
      { label: "Visitas", value: num(f.visits) },
      { label: "Registros", value: num(f.signups) },
      { label: "Cuestionario completado", value: num(f.onboarded) },
      { label: "Primer entreno", value: num(f.first_workout) },
      { label: "Hábito (3+ entrenos)", value: num(f.habit) },
    ],
    retention: {
      d7: num(rt.d7_base) ? (num(rt.d7) / num(rt.d7_base)) * 100 : null,
      d30: num(rt.d30_base) ? (num(rt.d30) / num(rt.d30_base)) * 100 : null,
      d7Base: num(rt.d7_base),
      d30Base: num(rt.d30_base),
    },
    devices: kv(devices),
    referrers: kv(refs),
    pages: kv(pages),
    goals: kv(goals),
    places: kv(places),
    levels: kv(levels),
    providers: [
      { label: "Correo y contraseña", value: num(pv.password) },
      { label: "Google", value: num(pv.google) },
      { label: "Ambos", value: num(pv.both) },
    ],
    topExercises: kv(topEx),
    hours: Array.from({ length: 24 }, (_, h) => ({ label: `${h}h`, value: hourMap.get(h) ?? 0 })),
    recent: (recent.results as Row[]).map((r) => ({
      uid: String(r.id), name: String(r.name ?? ""), email: String(r.email), createdAt: num(r.created_at), provider: r.g ? "google" : String(r.provider ?? "password"),
      onboarded: num(r.ob) === 1, goal: (r.goal as string) ?? null, workouts: num(r.w),
    })),
    catalog: { exercises: EXERCISES.length, routines: ROUTINES.length },
  };
}

// ───────────────────────── CRM ─────────────────────────

export type Stage = "nuevo" | "activo" | "en_riesgo" | "inactivo" | "bloqueado";

export function stageOf(u: { blocked: number; created_at: number; last_active_at: number }, now = Date.now()): Stage {
  if (u.blocked) return "bloqueado";
  if (now - u.created_at < 7 * DAY) return "nuevo";
  if (now - u.last_active_at < 7 * DAY) return "activo";
  if (now - u.last_active_at < 21 * DAY) return "en_riesgo";
  return "inactivo";
}

/** Puntuación de salud 0–100: recencia, constancia (entrenos 30 d), perfil completo y uso del coach. */
export function healthScore(u: { last_active_at: number; onboarded: number; w30: number; ai30: number }, now = Date.now()) {
  const daysIdle = (now - u.last_active_at) / DAY;
  const recency = Math.max(0, 40 - daysIdle * 2);
  const habit = Math.min(35, u.w30 * 3.5);
  const setup = u.onboarded ? 15 : 0;
  const coach = Math.min(10, u.ai30 * 2);
  return Math.round(recency + habit + setup + coach);
}

export async function crmList(env: Env) {
  const since = Date.now() - 30 * DAY;
  const r = await env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.photo_url, u.provider, u.google_sub IS NOT NULL g, u.role, u.blocked, u.ai_limit, u.ai_blocked, u.plan, u.created_at, u.last_active_at, u.login_count, u.workouts_count,
       json_extract(u.profile,'$.onboarded') onboarded, json_extract(u.profile,'$.goal') goal, json_extract(u.profile,'$.place') place, json_extract(u.profile,'$.level') level,
       COALESCE(c.tags,'[]') tags,
       (SELECT COUNT(*) FROM workouts w WHERE w.user_id = u.id AND w.date >= ?1) w30,
       (SELECT COALESCE(SUM(requests),0) FROM ai_usage a WHERE a.user_id = u.id AND a.day >= ?2) ai30,
       (SELECT COUNT(*) FROM crm_notes n WHERE n.user_id = u.id) notes
     FROM users u LEFT JOIN crm c ON c.user_id = u.id ORDER BY u.created_at DESC LIMIT 5000`,
  )
    .bind(since, new Date(since).toISOString().slice(0, 10))
    .all<Row>();
  const now = Date.now();
  return r.results.map((u) => {
    const base = { blocked: num(u.blocked), created_at: num(u.created_at), last_active_at: num(u.last_active_at) };
    let tags: string[] = [];
    try {
      tags = JSON.parse(String(u.tags));
    } catch {}
    return {
      uid: String(u.id), name: String(u.name ?? ""), email: String(u.email), photoURL: (u.photo_url as string) ?? null, provider: u.g ? "google" : String(u.provider ?? "password"),
      role: String(u.role), blocked: Boolean(u.blocked), createdAt: base.created_at, lastActiveAt: base.last_active_at, loginCount: num(u.login_count), workoutsCount: num(u.workouts_count),
      onboarded: num(u.onboarded) === 1, goal: (u.goal as string) ?? null, place: (u.place as string) ?? null, level: (u.level as string) ?? null,
      tags, workouts30: num(u.w30), ai30: num(u.ai30), notes: num(u.notes),
      aiLimit: u.ai_limit == null ? null : num(u.ai_limit), aiBlocked: Boolean(u.ai_blocked), plan: String(u.plan ?? "free"),
      stage: stageOf(base, now),
      health: healthScore({ last_active_at: base.last_active_at, onboarded: num(u.onboarded), w30: num(u.w30), ai30: num(u.ai30) }, now),
    };
  });
}

export async function crmSetTags(env: Env, userId: string, tags: unknown) {
  if (!Array.isArray(tags)) throw new HttpError(400, "Etiquetas no válidas");
  const clean = [...new Set(tags.map((t) => String(t).trim().slice(0, 24)).filter(Boolean))].slice(0, 12);
  await env.DB.prepare("INSERT INTO crm (user_id, tags, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET tags = excluded.tags, updated_at = excluded.updated_at")
    .bind(userId, JSON.stringify(clean), Date.now())
    .run();
  return clean;
}

export async function crmNotes(env: Env, userId: string) {
  const r = await env.DB.prepare("SELECT id, ts, author_email, text FROM crm_notes WHERE user_id = ? ORDER BY id DESC LIMIT 100").bind(userId).all();
  return r.results;
}

export async function crmAddNote(env: Env, userId: string, author: string, text: unknown) {
  const t = String(text ?? "").trim().slice(0, 2000);
  if (!t) throw new HttpError(400, "Escribe la nota");
  await env.DB.prepare("INSERT INTO crm_notes (user_id, ts, author_email, text) VALUES (?, ?, ?, ?)").bind(userId, Date.now(), author, t).run();
  return crmNotes(env, userId);
}

// ───────────────────────── inventario ─────────────────────────

export interface ItemInput {
  name?: unknown;
  category?: unknown;
  sku?: unknown;
  unit?: unknown;
  stock?: unknown;
  min_stock?: unknown;
  cost?: unknown;
  price?: unknown;
  location?: unknown;
  notes?: unknown;
}

const s = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
const n = (v: unknown, def: number | null = null) => {
  if (v === null || v === undefined || v === "") return def;
  const x = Number(v);
  if (!Number.isFinite(x) || x < 0 || x > 1e9) throw new HttpError(400, "Número no válido");
  return Math.round(x * 100) / 100;
};

export async function inventoryList(env: Env) {
  const [items, moves] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM inventory_items ORDER BY category, name"),
    env.DB.prepare("SELECT m.*, i.name item_name, i.unit FROM inventory_moves m LEFT JOIN inventory_items i ON i.id = m.item_id ORDER BY m.id DESC LIMIT 60"),
  ]);
  return { items: items.results, moves: moves.results };
}

export async function inventoryCreate(env: Env, b: ItemInput, actor: string) {
  const name = s(b.name, 80);
  if (!name) throw new HttpError(400, "Escribe el nombre del producto");
  const id = randomId();
  const now = Date.now();
  const stock = n(b.stock, 0)!;
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO inventory_items (id, name, category, sku, unit, stock, min_stock, cost, price, location, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(id, name, s(b.category, 40) ?? "General", s(b.sku, 40), s(b.unit, 12) ?? "uds", stock, n(b.min_stock, 0), n(b.cost), n(b.price), s(b.location, 60), s(b.notes, 500), now, now),
    ...(stock ? [env.DB.prepare("INSERT INTO inventory_moves (item_id, ts, delta, reason, actor_email) VALUES (?, ?, ?, 'Stock inicial', ?)").bind(id, now, stock, actor)] : []),
  ]);
  return id;
}

export async function inventoryUpdate(env: Env, id: string, b: ItemInput) {
  const cur = await env.DB.prepare("SELECT * FROM inventory_items WHERE id = ?").bind(id).first<Row>();
  if (!cur) throw new HttpError(404, "Producto no encontrado");
  const pick = <T,>(k: keyof ItemInput, f: (v: unknown) => T) => (k in b ? f(b[k]) : (cur[k as string] as T));
  await env.DB.prepare(
    "UPDATE inventory_items SET name = ?, category = ?, sku = ?, unit = ?, min_stock = ?, cost = ?, price = ?, location = ?, notes = ?, updated_at = ? WHERE id = ?",
  )
    .bind(
      pick("name", (v) => s(v, 80)) ?? cur.name,
      pick("category", (v) => s(v, 40)) ?? "General",
      pick("sku", (v) => s(v, 40)),
      pick("unit", (v) => s(v, 12)) ?? "uds",
      pick("min_stock", (v) => n(v, 0)),
      pick("cost", (v) => n(v)),
      pick("price", (v) => n(v)),
      pick("location", (v) => s(v, 60)),
      pick("notes", (v) => s(v, 500)),
      Date.now(),
      id,
    )
    .run();
}

export async function inventoryMove(env: Env, id: string, delta: unknown, reason: unknown, actor: string) {
  const d = Number(delta);
  if (!Number.isFinite(d) || d === 0 || Math.abs(d) > 1e6) throw new HttpError(400, "Cantidad no válida");
  const cur = await env.DB.prepare("SELECT stock FROM inventory_items WHERE id = ?").bind(id).first<{ stock: number }>();
  if (!cur) throw new HttpError(404, "Producto no encontrado");
  if (cur.stock + d < 0) throw new HttpError(400, `No hay stock suficiente (quedan ${cur.stock}).`);
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("UPDATE inventory_items SET stock = stock + ?, updated_at = ? WHERE id = ?").bind(d, now, id),
    env.DB.prepare("INSERT INTO inventory_moves (item_id, ts, delta, reason, actor_email) VALUES (?, ?, ?, ?, ?)").bind(id, now, d, s(reason, 120) ?? (d > 0 ? "Entrada" : "Salida"), actor),
  ]);
}

export async function inventoryDelete(env: Env, id: string) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM inventory_items WHERE id = ?").bind(id),
    env.DB.prepare("DELETE FROM inventory_moves WHERE item_id = ?").bind(id),
  ]);
}

// ───────────────────────── agentes de IA ─────────────────────────

export const AGENTS = {
  retencion: {
    name: "Agente de retención",
    system:
      "Eres el agente de retención de DNI GYM, una app de fitness gratuita en español. Analizas usuarios en riesgo de abandonar con datos reales y propones acciones concretas: segmentos, prioridad y un mensaje corto y cercano (WhatsApp/email) para cada segmento, con su nombre de pila como variable {nombre}. No inventes datos ni prometas cosas que la app no hace. Responde en Markdown con secciones breves.",
  },
  crecimiento: {
    name: "Agente de crecimiento",
    system:
      "Eres el agente de crecimiento de DNI GYM. Con las métricas reales (embudo, orígenes, dispositivos, retención) detectas el cuello de botella principal y propones un plan de 7 días con 3–5 acciones priorizadas por impacto/esfuerzo y la métrica para medir cada una. Sé concreto y honesto si hay pocos datos. Markdown breve.",
  },
  soporte: {
    name: "Agente de soporte técnico",
    system:
      "Eres el agente de soporte técnico de DNI GYM (Cloudflare Workers + D1, acceso con correo/contraseña y Google OAuth). Revisas los errores reales de acceso y de la app, explicas la causa probable en lenguaje sencillo y das los pasos exactos para resolverlos, indicando la urgencia (alta/media/baja). No inventes errores que no aparezcan. Markdown breve.",
  },
  contenido: {
    name: "Agente de contenido SEO/AEO",
    system:
      "Eres el agente de contenido y posicionamiento (SEO y AEO para asistentes de IA) de DNI GYM. Con el catálogo y las páginas más visitadas propones: 5 artículos/guías nuevos con título, intención de búsqueda y estructura; 5 preguntas frecuentes con respuesta corta citable por IA; y mejoras de enlazado interno. Todo en español de España. Markdown.",
  },
  inventario: {
    name: "Agente de inventario",
    system:
      "Eres el agente de inventario de DNI GYM. Con el stock real, los mínimos y los últimos movimientos, indicas qué reponer primero, cuánto pedir (con el razonamiento), productos parados y riesgos de rotura de stock. Si no hay productos, explica cómo empezar a usar el inventario. Markdown breve con una tabla.",
  },
} as const;

export type AgentId = keyof typeof AGENTS;

export async function agentContext(env: Env, id: AgentId, platform: string) {
  const now = Date.now();
  if (id === "retencion") {
    const users = (await crmList(env)).filter((u) => u.stage === "en_riesgo" || u.stage === "inactivo" || (u.stage === "nuevo" && !u.onboarded)).slice(0, 40);
    const lines = users.map(
      (u) => `- ${u.name.split(" ")[0] || "Usuario"} · etapa ${u.stage} · ${Math.round((now - u.lastActiveAt) / DAY)} días sin entrar · ${u.workoutsCount} entrenos · objetivo ${u.goal ?? "?"} · cuestionario ${u.onboarded ? "sí" : "no"} · salud ${u.health}/100`,
    );
    return `${platform}\n\nUSUARIOS EN RIESGO O SIN ACTIVAR (${users.length}):\n${lines.join("\n") || "Ninguno ahora mismo."}`;
  }
  if (id === "crecimiento") {
    const m = await metrics(env, 30);
    return `${platform}\n\nEMBUDO 30 d: ${m.funnel.map((f) => `${f.label}=${f.value}`).join(" → ")}\nRetención D7: ${m.retention.d7?.toFixed(0) ?? "sin datos"}% (base ${m.retention.d7Base}) · D30: ${m.retention.d30?.toFixed(0) ?? "sin datos"}%\nOrígenes: ${m.referrers.map((r) => `${r.label}=${r.value}`).join(", ") || "sin datos"}\nDispositivos: ${m.devices.map((r) => `${r.label}=${r.value}`).join(", ") || "sin datos"}\nPáginas de entrada: ${m.pages.map((r) => `${r.label}=${r.value}`).join(", ") || "sin datos"}\nObjetivos: ${m.goals.map((r) => `${r.label}=${r.value}`).join(", ")}`;
  }
  if (id === "soporte") {
    const r = await env.DB.prepare("SELECT type, code, message, path, ts FROM events WHERE type IN ('auth_error','client_error') AND ts >= ? ORDER BY ts DESC LIMIT 60").bind(now - 30 * DAY).all<Row>();
    return `${platform}\n\nÚLTIMOS ERRORES (30 d, sin datos personales):\n${r.results.map((e) => `- ${new Date(num(e.ts)).toISOString().slice(0, 16)} · ${e.type} · ${e.code ?? "sin código"} · ${String(e.message ?? "").slice(0, 160)} · ${e.path ?? ""}`).join("\n") || "Sin errores."}`;
  }
  if (id === "contenido") {
    const m = await metrics(env, 30);
    const groups = [...new Set(EXERCISES.map((e) => e.group))].map((g) => `${g}=${EXERCISES.filter((e) => e.group === g).length}`).join(", ");
    return `CATÁLOGO: ${EXERCISES.length} ejercicios (${groups}); ${ROUTINES.length} rutinas: ${ROUTINES.map((r) => r.name).join("; ")}.\nPáginas más visitadas: ${m.pages.map((r) => `${r.label}=${r.value}`).join(", ") || "sin datos"}\nEjercicios más entrenados: ${m.topExercises.map((r) => `${r.label}=${r.value}`).join(", ") || "sin datos"}\nObjetivos de los usuarios: ${m.goals.map((r) => `${r.label}=${r.value}`).join(", ")}`;
  }
  const inv = await inventoryList(env);
  return `INVENTARIO (${inv.items.length} productos):\n${(inv.items as Row[]).map((i) => `- ${i.name} [${i.category}] stock ${i.stock} ${i.unit} · mínimo ${i.min_stock} · coste ${i.cost ?? "?"} · precio ${i.price ?? "?"}`).join("\n") || "Sin productos."}\n\nÚLTIMOS MOVIMIENTOS:\n${(inv.moves as Row[]).slice(0, 30).map((m) => `- ${new Date(num(m.ts)).toISOString().slice(0, 10)} · ${m.item_name} · ${num(m.delta) > 0 ? "+" : ""}${m.delta} · ${m.reason ?? ""}`).join("\n") || "Sin movimientos."}`;
}

/** Contexto de un cliente para el análisis individual (sin email ni datos de contacto). */
export async function customerContext(env: Env, userId: string) {
  const u = (await crmList(env)).find((x) => x.uid === userId);
  if (!u) throw new HttpError(404, "Usuario no encontrado");
  const [w, notes] = await env.DB.batch([
    env.DB.prepare("SELECT data FROM workouts WHERE user_id = ? ORDER BY date DESC LIMIT 8").bind(userId),
    env.DB.prepare("SELECT ts, text FROM crm_notes WHERE user_id = ? ORDER BY id DESC LIMIT 10").bind(userId),
  ]);
  const ws = (w.results as { data: string }[]).map((x) => {
    const d = JSON.parse(x.data) as { name?: string; date?: number; durationSec?: number; exercises?: unknown[] };
    return `${new Date(num(d.date)).toISOString().slice(0, 10)} ${d.name ?? "Entreno"} (${Math.round(num(d.durationSec) / 60)} min, ${d.exercises?.length ?? 0} ejercicios)`;
  });
  return `CLIENTE: ${u.name.split(" ")[0] || "Usuario"} · alta ${new Date(u.createdAt).toISOString().slice(0, 10)} · última actividad hace ${Math.round((Date.now() - u.lastActiveAt) / DAY)} días · etapa ${u.stage} · salud ${u.health}/100
Objetivo ${u.goal ?? "?"} · lugar ${u.place ?? "?"} · nivel ${u.level ?? "?"} · cuestionario ${u.onboarded ? "completado" : "pendiente"} · ${u.workoutsCount} entrenos (${u.workouts30} en 30 d) · ${u.ai30} consultas al coach · etiquetas: ${u.tags.join(", ") || "ninguna"}
Últimos entrenos: ${ws.join("; ") || "ninguno"}
Notas internas: ${(notes.results as Row[]).map((x) => `${new Date(num(x.ts)).toISOString().slice(0, 10)}: ${x.text}`).join(" | ") || "ninguna"}`;
}

export const CUSTOMER_SYSTEM =
  "Eres el asistente de CRM de DNI GYM. Con los datos reales de un cliente das: 1) un resumen en 2 frases, 2) su riesgo de abandono (bajo/medio/alto) y por qué, 3) la siguiente mejor acción para el dueño y 4) un mensaje corto, cercano y personalizado listo para enviar. No inventes datos. Markdown breve.";
