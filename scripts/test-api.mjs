// Pruebas de integración de la API de DNI GYM contra `wrangler dev` (D1 local, DEV_AUTH=1).
// Uso: npx wrangler dev   (en otra terminal)   y luego   node scripts/test-api.mjs [http://127.0.0.1:8787]
const BASE = process.argv[2] || "http://127.0.0.1:8787";
let passed = 0;
let failed = 0;
const ok = (cond, name, extra = "") => {
  if (cond) passed++;
  else failed++;
  console.log(`${cond ? "✔" : "✘"} ${name}${cond ? "" : ` ${extra}`}`);
};

function client() {
  let cookie = "";
  return async (path, { method = "GET", body, origin } = {}) => {
    const res = await fetch(BASE + path, {
      method,
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...(origin ? { origin } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0].endsWith("=") ? "" : set.split(";")[0];
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data, cookie: set };
  };
}

const uniq = Date.now().toString(36);
const anon = client();
const admin = client();
const a = client();
const b = client();

// ── públicas y sin sesión ──
ok((await anon("/api/health")).status === 200, "health responde");
ok((await anon("/api/me")).data.profile === null, "sin sesión /api/me devuelve null");
ok((await anon("/api/workouts")).status === 401, "sin sesión no se pueden leer entrenos");
ok((await anon("/api/auth/session", { method: "POST", body: { idToken: "x.y.z" } })).status === 401, "token de Google falso rechazado");
ok((await anon("/api/auth/session", { method: "POST", body: { idToken: "x.y.z" }, origin: "https://malicioso.example" })).status === 403, "origen externo bloqueado (CSRF)");
ok((await anon("/api/events", { method: "POST", body: { type: "visit", path: "/" } })).status === 200, "evento de visita anónimo aceptado");
ok((await anon("/api/events", { method: "POST", body: { type: "login" } })).status === 400, "no se pueden falsificar eventos de login");

// ── inicio de sesión ──
const la = await a("/api/auth/dev", { method: "POST", body: { email: `ana.${uniq}@test.dev`, name: "Ana" } });
ok(la.status === 200 && la.data.isNew === true && la.data.isAdmin === false, "registro de usuario nuevo");
ok(/HttpOnly/i.test(la.cookie || "") && /SameSite=Lax/i.test(la.cookie || ""), "cookie de sesión HttpOnly + SameSite");
const lb = await b("/api/auth/dev", { method: "POST", body: { email: `beto.${uniq}@test.dev`, name: "Beto" } });
ok(lb.status === 200, "segundo usuario");
const ladm = await admin("/api/auth/dev", { method: "POST", body: { email: "ibraguimova19@gmail.com", name: "Dueño" } });
ok(ladm.data.isAdmin === true, "el email de ADMIN_EMAILS obtiene rol admin");
const relog = await a("/api/auth/dev", { method: "POST", body: { email: `ana.${uniq}@test.dev` } });
ok(relog.data.isNew === false && relog.data.profile.loginCount === 2, "segundo inicio de sesión cuenta como login");

// ── perfil ──
const pp = await a("/api/profile", { method: "PATCH", body: { goal: "ganar", heightCm: 170, role: "admin", blocked: true, onboarded: true, name: "Ana G" } });
ok(pp.status === 200 && pp.data.profile.goal === "ganar" && pp.data.profile.name === "Ana G", "perfil actualizado");
ok(pp.data.profile.role === "user" && pp.data.profile.blocked === false, "el usuario no puede hacerse admin ni cambiar su bloqueo");

// ── entrenos ──
const w = { id: "w1" + uniq, name: "Pierna", date: Date.now(), durationSec: 3000, volume: 1000, totalSets: 2, exercises: [{ slug: "sentadilla-con-barra", name: "Sentadilla", sets: [{ reps: 5, weight: 100, done: true }] }] };
ok((await a(`/api/workouts/${w.id}`, { method: "PUT", body: w })).status === 200, "guardar entreno");
ok((await a(`/api/workouts/${w.id}`, { method: "PUT", body: { ...w, name: "Pierna editada" } })).status === 200, "editar entreno (sin duplicar)");
const list = await a("/api/workouts");
ok(list.data.length === 1 && list.data[0].name === "Pierna editada", "lista de entrenos sin duplicados");
ok((await a("/api/workouts/bad id!", { method: "PUT", body: w })).status === 400, "id de entreno no válido rechazado");
ok((await a(`/api/workouts/x${uniq}`, { method: "PUT", body: { name: "sin fecha" } })).status === 400, "entreno sin fecha rechazado");
ok((await b("/api/workouts")).data.length === 0, "aislamiento: otro usuario no ve los entrenos");
ok((await a("/api/me")).data.profile.workoutsCount === 1, "contador de entrenos actualizado");

// ── peso y nutrición ──
ok((await a("/api/body/2026-11-01", { method: "PUT", body: { weight: 70.5, waist: 80, hack: "<script>" } })).data.hack === undefined, "peso guardado y campos extra filtrados");
ok((await a("/api/body")).data[0].weight === 70.5, "leer peso");
ok((await a("/api/body/fecha-mala", { method: "PUT", body: { weight: 1 } })).status === 400, "fecha no válida rechazada");
const nd = await a("/api/nutrition/2026-11-03", { method: "PUT", body: { entries: [{ id: "e1", name: "Avena", grams: 60, kcal: 227, protein: 8, carbs: 40, fat: 4, meal: "desayuno" }], waterMl: 99999 } });
ok(nd.status === 200 && nd.data.waterMl === 20000, "diario guardado y agua acotada");
ok((await a("/api/nutrition/2026-11-03")).data.entries.length === 1, "leer diario del día");
ok((await a("/api/nutrition?from=2026-11-01")).data.length === 1, "listar diarios desde fecha");
ok((await a("/api/nutrition/2026-01-01")).data.entries.length === 0, "día sin datos devuelve diario vacío");

// ── importación desde la base anterior (no sobrescribe) ──
const imp = await a("/api/import", { method: "POST", body: { workouts: [w, { ...w, id: "w2" + uniq }], body: [{ id: "2026-10-01", date: "2026-10-01", weight: 72 }], profile: { goal: "perder", level: "intermedio" } } });
ok(imp.status === 200, "importación aceptada");
ok((await a("/api/workouts")).data.length === 2, "importación añade lo nuevo sin duplicar lo existente");
ok(imp.data.profile.goal === "ganar" && imp.data.profile.level === "intermedio", "importación no pisa el perfil actual y completa lo que falta");

// ── IA sin clave ──
const ai = await a("/api/ai/chat", { method: "POST", body: { message: "hola" } });
ok(ai.status === 503 || ai.status === 200, "IA: sin clave devuelve 503 claro (o responde si hay clave)", JSON.stringify(ai.data));
ok((await a("/api/ai/history")).status === 200, "IA: historial accesible");

// ── administración ──
ok((await a("/api/admin/users")).status === 403, "usuario normal no accede al panel de admin");
const users = await admin("/api/admin/users");
ok(users.status === 200 && users.data.length >= 3, "admin lista usuarios");
ok((await admin("/api/admin/events")).status === 200, "admin lee eventos");
ok((await admin("/api/admin/system")).data.backend.includes("D1"), "admin ve el estado del sistema");
const beto = users.data.find((u) => u.email === `beto.${uniq}@test.dev`);
ok((await admin(`/api/admin/users/${beto.uid}`, { method: "PATCH", body: { blocked: true } })).data.blocked === true, "admin bloquea a un usuario");
ok((await b("/api/workouts")).status === 401, "el usuario bloqueado pierde la sesión al instante");
ok((await b("/api/auth/dev", { method: "POST", body: { email: `beto.${uniq}@test.dev` } })).status === 403, "el usuario bloqueado no puede volver a entrar");
await admin(`/api/admin/users/${beto.uid}`, { method: "PATCH", body: { blocked: false } });
ok((await b("/api/auth/dev", { method: "POST", body: { email: `beto.${uniq}@test.dev` } })).status === 200, "desbloqueado puede volver a entrar");
const me = (await admin("/api/me")).data.profile;
ok((await admin(`/api/admin/users/${me.uid}`, { method: "PATCH", body: { blocked: true } })).status === 400, "el admin no puede bloquearse a sí mismo");
ok((await admin("/api/admin/audit")).data.some((x) => x.action === "user.block"), "las acciones de admin quedan en la auditoría");

// ── exportar, cerrar sesión y borrar ──
const exp = await a("/api/export");
ok(exp.data.workouts.length === 2 && exp.data.body.length === 2, "exportar mis datos");
ok((await a("/api/auth/logout", { method: "POST" })).status === 200, "cerrar sesión");
ok((await a("/api/workouts")).status === 401, "tras cerrar sesión no hay acceso");
await a("/api/auth/dev", { method: "POST", body: { email: `ana.${uniq}@test.dev` } });
ok((await a("/api/workouts")).data.length === 2, "al volver a entrar los datos siguen ahí (no se borra nada)");
ok((await b("/api/account", { method: "DELETE" })).status === 200, "borrar cuenta (solo si el usuario lo pide)");
ok((await admin("/api/admin/users")).data.every((u) => u.email !== `beto.${uniq}@test.dev`), "cuenta borrada desaparece");

console.log(`\n${passed} pruebas correctas, ${failed} fallidas`);
process.exit(failed ? 1 : 0);
