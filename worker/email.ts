// Correo de DNI GYM con Cloudflare Email Service (binding `EMAIL`).
// - Avisos al dueño (OWNER_EMAIL, dirección verificada): gratis en cualquier plan.
// - Correos a usuarios (bienvenida, contraseña, recordatorios): requieren el plan Workers Paid y
//   EMAIL_USERS = "1". Mientras tanto se registran en email_log como «omitido» y no rompen nada.
import type { Env } from "./env";

export type MailKind = "welcome" | "reset" | "reminder" | "owner_signup" | "owner_contact" | "owner_reset" | "owner_summary" | "contact_ack";

const SITE = (env: Env) => (env.SITE_URL || "https://dnigym.com").replace(/\/$/, "");
const FROM = (env: Env) => env.EMAIL_FROM || "DNI GYM <hola@dnigym.com>";
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function parseFrom(v: string) {
  const m = /^(.*)<([^>]+)>$/.exec(v.trim());
  return m ? { name: m[1].trim(), email: m[2].trim() } : { name: "DNI GYM", email: v.trim() };
}

/** Plantilla HTML de marca: fondo grafito, acento naranja, botón principal y pie legal. */
export function layout(env: Env, opts: { preheader: string; title: string; body: string; cta?: { label: string; url: string }; footer?: string }) {
  const site = SITE(env);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>${esc(opts.title)}</title></head>
<body style="margin:0;background:#070708;font-family:Inter,Segoe UI,Arial,sans-serif;color:#f4f4f5">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070708;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#101113;border:1px solid #25282d;border-radius:20px;overflow:hidden">
<tr><td style="padding:24px 28px;border-bottom:1px solid #25282d">
<a href="${site}" style="text-decoration:none;color:#f4f4f5;font-weight:800;font-style:italic;font-size:22px;letter-spacing:-0.5px">
<span style="display:inline-block;width:30px;height:30px;line-height:30px;text-align:center;background:#ff6b1a;color:#160700;border-radius:8px;margin-right:8px">D</span>DNI <span style="color:#ff6b1a">GYM</span></a></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 14px;font-size:26px;line-height:1.15;font-weight:800;font-style:italic;text-transform:uppercase">${esc(opts.title)}</h1>
<div style="font-size:15px;line-height:1.6;color:#b9bcc2">${opts.body}</div>
${opts.cta ? `<p style="margin:26px 0 6px"><a href="${opts.cta.url}" style="display:inline-block;background:#ff6b1a;color:#1a0a00;text-decoration:none;font-weight:800;padding:14px 26px;border-radius:12px;text-transform:uppercase;font-style:italic">${esc(opts.cta.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #25282d;font-size:12px;line-height:1.6;color:#80858d">
${opts.footer ?? ""}DNI GYM · Tu entrenador personal gratis · <a href="${site}" style="color:#80858d">dnigym.com</a><br>
¿Dudas? Escríbenos a <a href="mailto:contacto@dnigym.com" style="color:#ff8540">contacto@dnigym.com</a> · <a href="${site}/privacidad/" style="color:#80858d">Privacidad</a></td></tr>
</table></td></tr></table></body></html>`;
}

async function log(env: Env, kind: MailKind, to: string, status: string, error?: string) {
  await env.DB.prepare("INSERT INTO email_log (ts, kind, to_email, status, error) VALUES (?, ?, ?, ?, ?)")
    .bind(Date.now(), kind, to.toLowerCase(), status, error?.slice(0, 300) ?? null)
    .run()
    .catch(() => {});
}

/** Envía un correo. Nunca lanza: devuelve true/false y deja constancia en email_log. */
export async function sendMail(env: Env, kind: MailKind, m: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
  const toOwner = kind.startsWith("owner_");
  if (!env.EMAIL) {
    await log(env, kind, m.to, "omitido", "Sin binding EMAIL");
    return false;
  }
  if (!toOwner && env.EMAIL_USERS !== "1") {
    await log(env, kind, m.to, "omitido", "Envío a usuarios desactivado (requiere Workers Paid y EMAIL_USERS=1)");
    return false;
  }
  try {
    await env.EMAIL.send({
      from: parseFrom(FROM(env)),
      to: m.to,
      subject: m.subject,
      html: m.html,
      text: m.text,
      ...(m.replyTo ? { replyTo: m.replyTo } : {}),
    } as never);
    await log(env, kind, m.to, "enviado");
    return true;
  } catch (e) {
    await log(env, kind, m.to, "error", e instanceof Error ? e.message : String(e));
    return false;
  }
}

const ownerTo = (env: Env) => env.OWNER_EMAIL || "ibraguimova19@gmail.com";

// ───────────────────────── plantillas ─────────────────────────

export function welcomeMail(env: Env, name: string, unsubUrl: string) {
  const first = esc(name.split(" ")[0] || "deportista");
  const site = SITE(env);
  return {
    subject: `¡Bienvenido a DNI GYM, ${name.split(" ")[0] || "deportista"}! 💪`,
    html: layout(env, {
      preheader: "Tu plan personalizado te espera. Así empiezas en 2 minutos.",
      title: `¡Bienvenido, ${first}!`,
      body: `<p>Ya formas parte de <strong style="color:#f4f4f5">DNI GYM</strong>, tu entrenador personal gratis.</p>
<p>Así sacas el máximo partido desde hoy:</p>
<ol style="padding-left:18px;margin:0">
<li><strong style="color:#f4f4f5">Responde el cuestionario</strong> (2 min) y creamos tu plan de entreno y tu menú diario.</li>
<li><strong style="color:#f4f4f5">Pulsa «Empezar»</strong> y te guiamos ejercicio a ejercicio, con descansos automáticos.</li>
<li><strong style="color:#f4f4f5">Pregunta al DNI AI Coach</strong> qué entrenar si tienes poco tiempo o qué cenar.</li>
</ol>`,
      cta: { label: "Empezar mi plan", url: `${site}/panel/` },
      footer: `¿No quieres recibir recordatorios? <a href="${unsubUrl}" style="color:#80858d">Darse de baja</a>.<br>`,
    }),
    text: `¡Bienvenido a DNI GYM, ${name}!\n\n1) Responde el cuestionario y creamos tu plan.\n2) Pulsa «Empezar» y te guiamos ejercicio a ejercicio.\n3) Pregunta al DNI AI Coach.\n\nEmpieza: ${site}/panel/\n\nBaja de recordatorios: ${unsubUrl}`,
  };
}

export function resetMail(env: Env, name: string, url: string) {
  return {
    subject: "Crea tu contraseña nueva de DNI GYM",
    html: layout(env, {
      preheader: "Enlace seguro de un solo uso, válido 1 hora.",
      title: "Contraseña nueva",
      body: `<p>Hola ${esc(name.split(" ")[0] || "")}, hemos recibido una solicitud para cambiar la contraseña de tu cuenta.</p><p>El enlace es de un solo uso y caduca en <strong style="color:#f4f4f5">1 hora</strong>. Si no lo pediste tú, ignora este correo: tu contraseña no cambiará.</p>`,
      cta: { label: "Crear contraseña nueva", url },
    }),
    text: `Crea tu contraseña nueva (válido 1 hora): ${url}\nSi no lo pediste, ignora este correo.`,
  };
}

export function reminderMail(env: Env, name: string, days: number, unsubUrl: string) {
  const site = SITE(env);
  return {
    subject: `${name.split(" ")[0] || "Hola"}, tu entreno de hoy está listo`,
    html: layout(env, {
      preheader: "Solo 30 minutos y mantienes tu racha.",
      title: "¿Volvemos al gym?",
      body: `<p>Han pasado ${days} días desde tu último entreno. No pasa nada: lo importante es volver.</p><p>Tu sesión de hoy está preparada y puedes adaptarla a <strong style="color:#f4f4f5">20, 30 o 45 minutos</strong>, en casa o en el gimnasio.</p>`,
      cta: { label: "Entrenar ahora", url: `${site}/panel/` },
      footer: `Recibes este recordatorio porque tienes cuenta en DNI GYM. <a href="${unsubUrl}" style="color:#80858d">Darse de baja</a>.<br>`,
    }),
    text: `Han pasado ${days} días desde tu último entreno. Tu sesión de hoy: ${site}/panel/\nBaja: ${unsubUrl}`,
  };
}

export async function notifyOwner(env: Env, kind: "owner_signup" | "owner_contact" | "owner_reset" | "owner_summary", subject: string, lines: string[], replyTo?: string) {
  const site = SITE(env);
  return sendMail(env, kind, {
    to: ownerTo(env),
    subject,
    replyTo,
    html: layout(env, { preheader: lines[0] ?? subject, title: subject, body: lines.map((l) => `<p style="margin:0 0 8px">${esc(l)}</p>`).join(""), cta: { label: "Abrir el panel", url: `${site}/admin/` } }),
    text: `${lines.join("\n")}\n\n${site}/admin/`,
  });
}
