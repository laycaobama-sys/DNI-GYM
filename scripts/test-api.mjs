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

// IP simulada distinta en cada ejecución (en producción Cloudflare fija cf-connecting-ip y no se puede falsificar)
const IP = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

function client() {
  let cookie = "";
  return async (path, { method = "GET", body, origin, redirect = "follow" } = {}) => {
    const res = await fetch(BASE + path, {
      method,
      redirect,
      headers: { "content-type": "application/json", "cf-connecting-ip": IP, ...(cookie ? { cookie } : {}), ...(origin ? { origin } : {}) },
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
    return { status: res.status, data, cookie: set, location: res.headers.get("location") };
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
ok((await anon("/api/auth/login", { method: "POST", body: { email: "x@y.dev", password: "x" }, origin: "https://malicioso.example" })).status === 403, "origen externo bloqueado (CSRF)");
const cfg = (await anon("/api/config")).data;
ok(cfg.backend === "cloudflare" && typeof cfg.google === "boolean" && "turnstileSiteKey" in cfg, "configuración pública de acceso");
const g = await anon("/api/auth/google", { redirect: "manual" });
ok(g.status === 302 && /\/login\/\?error=google-off|accounts\.google\.com/.test(g.location || ""), "Google: redirige al flujo OAuth o avisa si no está configurado");
ok((await anon("/api/auth/google/callback?state=a&code=b", { redirect: "manual" })).location?.includes("/login/?error="), "Google: vuelta sin estado válido rechazada");
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

// ── cuentas con correo y contraseña ──
const p1 = client();
const p2 = client();
const pwEmail = `pablo.${uniq}@test.dev`;
const signup = (c, body) => c("/api/auth/signup", { method: "POST", body: { name: "Pablo", email: pwEmail, password: "Fuerza2026gym", acceptTerms: true, ...body } });
ok((await signup(anon, { password: "123" })).status === 400, "registro: contraseña corta rechazada");
ok((await signup(anon, { password: "abcdefghijkl" })).status === 400, "registro: contraseña sin números rechazada");
ok((await signup(anon, { password: "1234567890" })).status === 400, "registro: contraseña común rechazada");
ok((await signup(anon, { email: "no-es-un-correo" })).status === 400, "registro: email no válido rechazado");
ok((await signup(anon, { acceptTerms: false })).status === 400, "registro: hay que aceptar los términos");
const su = await signup(p1, {});
ok(su.status === 200 && su.data.isNew === true && su.data.profile.hasPassword === true && su.data.profile.emailVerified === false, "registro con correo y contraseña");
ok(/HttpOnly/i.test(su.cookie || ""), "el registro abre sesión con cookie segura");
ok(!JSON.stringify((await p1("/api/me")).data).includes("pbkdf2"), "el hash de la contraseña nunca sale del servidor");
ok((await signup(anon, {})).status === 409, "no se puede registrar dos veces el mismo correo");
ok((await signup(anon, { email: "IBRAGUIMOVA19@gmail.com" })).status === 409, "nadie puede registrarse con el correo del dueño");
ok((await p2("/api/auth/login", { method: "POST", body: { email: pwEmail, password: "otra-cosa-1" } })).status === 401, "login con contraseña incorrecta rechazado");
const li = await p2("/api/auth/login", { method: "POST", body: { email: pwEmail.toUpperCase(), password: "Fuerza2026gym" } });
ok(li.status === 200 && li.data.isNew === false && li.data.profile.loginCount === 2, "login con correo y contraseña (sin distinguir mayúsculas)");
const victim = `victima.${uniq}@test.dev`;
await anon("/api/auth/signup", { method: "POST", body: { name: "V", email: victim, password: "Segura2026xyz", acceptTerms: true } });
let locked = 0;
for (let i = 0; i < 10; i++) if ((await anon("/api/auth/login", { method: "POST", body: { email: victim, password: `mala-${i}-xx` } })).status === 429) locked++;
ok(locked >= 1, "bloqueo temporal tras muchos intentos fallidos (fuerza bruta)");
ok((await anon("/api/auth/forgot", { method: "POST", body: { email: "nadie@nada.dev" } })).data.ok === true, "recuperar contraseña no revela si el correo existe");
ok((await anon("/api/auth/reset", { method: "POST", body: { token: "x".repeat(40), password: "Nueva2026gymx" } })).status === 400, "enlace de restablecer falso rechazado");

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
// ── enlace de contraseña (admin) y restablecer ──
const pid = (await p2("/api/me")).data.profile.uid;
ok((await a(`/api/admin/users/${pid}/reset-link`, { method: "POST" })).status === 403, "un usuario normal no puede crear enlaces de contraseña");
const link = await admin(`/api/admin/users/${pid}/reset-link`, { method: "POST" });
ok(link.status === 200 && /\/restablecer\/\?token=/.test(link.data.url), "el admin crea un enlace de un solo uso");
const tok = new URL(link.data.url).searchParams.get("token");
const p3 = client();
ok((await p3("/api/auth/reset", { method: "POST", body: { token: tok, password: "corta" } })).status === 400, "restablecer exige contraseña segura");
const rs = await p3("/api/auth/reset", { method: "POST", body: { token: tok, password: "Renovada2026gym" } });
ok(rs.status === 200 && rs.data.profile.emailVerified === true, "restablecer cambia la contraseña y verifica el email");
ok((await p3("/api/auth/reset", { method: "POST", body: { token: tok, password: "Otra2026gymxx" } })).status === 400, "el enlace no se puede reutilizar");
ok((await p2("/api/me")).data.profile === null, "al restablecer se cierran las demás sesiones");
ok((await anon("/api/auth/login", { method: "POST", body: { email: pwEmail, password: "Fuerza2026gym" } })).status === 401, "la contraseña antigua ya no sirve");
ok((await p3("/api/auth/password", { method: "POST", body: { current: "mal", password: "Cambio2026gymx" } })).status === 400, "cambiar contraseña exige la actual");
ok((await p3("/api/auth/password", { method: "POST", body: { current: "Renovada2026gym", password: "Cambio2026gymx" } })).status === 200, "cambiar contraseña desde el perfil");
ok((await p3("/api/me")).data.profile?.email === pwEmail, "la sesión actual sigue activa tras cambiarla");
ok((await anon("/api/auth/login", { method: "POST", body: { email: pwEmail, password: "Cambio2026gymx" } })).status === 200, "login con la contraseña nueva");

// ── centro de control: métricas, CRM, agentes e inventario ──
ok((await a("/api/admin/metrics")).status === 403, "un usuario normal no ve las métricas");
const met = await admin("/api/admin/metrics?days=30");
ok(met.status === 200 && met.data.totals.users >= 3 && met.data.series.signups.length === 30 && met.data.funnel.length === 5, "métricas agregadas en el servidor");
ok(met.data.catalog.exercises >= 140 && met.data.catalog.routines >= 14, "el catálogo publicado aparece en las métricas");
const crm = await admin("/api/admin/crm");
const ana = crm.data.find((c) => c.email === `ana.${uniq}@test.dev`);
ok(crm.status === 200 && ana && ["nuevo", "activo"].includes(ana.stage) && ana.health >= 0 && ana.health <= 100, "CRM con etapa y salud de cada cliente");
ok(!JSON.stringify(crm.data).includes("pbkdf2"), "el CRM no expone contraseñas");
const tg = await admin(`/api/admin/crm/${ana.uid}/tags`, { method: "PUT", body: { tags: ["VIP", "VIP", " Feedback "] } });
ok(tg.status === 200 && tg.data.tags.join() === "VIP,Feedback", "etiquetas del CRM sin duplicados");
const nt = await admin(`/api/admin/crm/${ana.uid}/notes`, { method: "POST", body: { text: "Le escribí para animarle" } });
ok(nt.status === 200 && nt.data[0].text === "Le escribí para animarle", "notas internas del CRM");
ok((await a(`/api/admin/crm/${ana.uid}/notes`)).status === 403, "un usuario no puede leer notas del CRM");
ok((await admin("/api/admin/agents/inventado", { method: "POST", body: {} })).status === 404, "agente inexistente rechazado");
const inv1 = await admin("/api/admin/inventory", { method: "POST", body: { name: "Proteína whey", category: "Suplementos", stock: 10, min_stock: 4, cost: 18.5, price: 34.9 } });
const item = inv1.data.items.find((i) => i.name === "Proteína whey");
ok(inv1.status === 200 && item && item.stock === 10 && inv1.data.moves.some((m) => m.reason === "Stock inicial"), "crear producto con stock inicial");
ok((await admin(`/api/admin/inventory/${item.id}/move`, { method: "POST", body: { delta: -7, reason: "Venta" } })).data.items.find((i) => i.id === item.id).stock === 3, "salida de stock");
ok((await admin(`/api/admin/inventory/${item.id}/move`, { method: "POST", body: { delta: -50 } })).status === 400, "no se puede dejar el stock en negativo");
ok((await admin("/api/admin/inventory", { method: "POST", body: { name: "", stock: -1 } })).status === 400, "producto no válido rechazado");
ok((await a("/api/admin/inventory")).status === 403, "un usuario normal no ve el inventario");
const upd = await admin(`/api/admin/inventory/${item.id}`, { method: "PATCH", body: { price: 39.9, stock: 999 } });
const it2 = upd.data.items.find((i) => i.id === item.id);
ok(it2.price === 39.9 && it2.stock === 3, "editar producto no permite saltarse el historial de stock");
ok((await admin(`/api/admin/inventory/${item.id}`, { method: "DELETE" })).data.items.every((i) => i.id !== item.id), "eliminar producto");

ok((await a("/api/auth/logout", { method: "POST" })).status === 200, "cerrar sesión");
ok((await a("/api/workouts")).status === 401, "tras cerrar sesión no hay acceso");
await a("/api/auth/dev", { method: "POST", body: { email: `ana.${uniq}@test.dev` } });
ok((await a("/api/workouts")).data.length === 2, "al volver a entrar los datos siguen ahí (no se borra nada)");
ok((await b("/api/account", { method: "DELETE" })).status === 200, "borrar cuenta (solo si el usuario lo pide)");
ok((await admin("/api/admin/users")).data.every((u) => u.email !== `beto.${uniq}@test.dev`), "cuenta borrada desaparece");

console.log(`\n${passed} pruebas correctas, ${failed} fallidas`);
process.exit(failed ? 1 : 0);
