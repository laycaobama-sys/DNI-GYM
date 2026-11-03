// DNI AI Coach: construye el contexto con datos reales del usuario y valida las propuestas de la IA.
import type { Env } from "./env";
import type { UserRow } from "./auth";
import { toProfile } from "./auth";
import { EXERCISES, EXERCISE_BY_SLUG } from "../src/data/exercises";
import { ROUTINES } from "../src/data/routines";

interface WSet {
  reps: number;
  weight: number;
  done: boolean;
}
interface WEx {
  slug: string;
  name: string;
  sets: WSet[];
}
interface Workout {
  id: string;
  name: string;
  date: number;
  durationSec: number;
  volume: number;
  totalSets: number;
  exercises: WEx[];
  feeling?: number;
  notes?: string;
}

const e1rm = (w: number, r: number) => (r <= 0 || w <= 0 ? 0 : r === 1 ? w : w * (1 + r / 30));
const day = (ts: number) => new Date(ts).toISOString().slice(0, 10);

export const COACH_SYSTEM = `Eres DNI AI Coach, el entrenador personal de la app DNI GYM. Hablas en español de España, con tono cercano, directo y motivador.

Reglas:
- Basa tus respuestas en los DATOS DEL USUARIO que se te proporcionan. Cita sus cifras reales (pesos, fechas, récords, calorías) cuando sean relevantes. Si falta un dato, dilo y sugiere cómo registrarlo en la app.
- No inventes entrenamientos, marcas personales ni medidas que no estén en los datos.
- Cuando recomiendes ejercicios, usa SOLO ejercicios del CATÁLOGO DNI GYM, con su nombre exacto.
- Sé concreto: series, repeticiones, descansos, cargas orientativas basadas en su 1RM estimado si existe.
- Formato: Markdown breve (titulares con **negrita**, listas con "-"). Máximo ~250 palabras salvo que pidan un plan completo.
- Salud: no diagnosticas ni tratas lesiones ni enfermedades. Ante dolor agudo, lesiones, embarazo, trastornos de la conducta alimentaria, enfermedades o medicación, recomienda consultar con un profesional sanitario y ofrece solo pautas generales prudentes.
- Nutrición clínica: no prescribas dietas para patologías; remite a un dietista-nutricionista.
- No puedes modificar los datos del usuario: si propones cambios (rutina, calorías), explica que debe aplicarlos él desde la app.`;

export const ADMIN_SYSTEM = `Eres el analista de negocio de DNI GYM, una app de fitness gratuita. Ayudas al propietario a entender métricas, detectar problemas (errores de acceso, abandono, actividad) y decidir acciones.
Usa SOLO las cifras del CONTEXTO DE LA PLATAFORMA. Si una pregunta necesita datos que no están, dilo. Responde en español, en Markdown breve, con conclusiones y acciones concretas priorizadas. No muestres datos personales innecesarios.`;

export function catalogText() {
  const groups = new Map<string, string[]>();
  for (const e of EXERCISES) {
    const list = groups.get(e.group) ?? [];
    list.push(`${e.name} [${e.slug}] (${e.equipment}, ${e.level})`);
    groups.set(e.group, list);
  }
  return [...groups.entries()].map(([g, l]) => `${g}: ${l.join("; ")}`).join("\n");
}

/** Contexto completo y real del usuario para la IA. */
export async function userContext(env: Env, u: UserRow) {
  const p = toProfile(u) as Record<string, unknown>;
  const [wRes, bRes, nRes] = await env.DB.batch([
    env.DB.prepare("SELECT data FROM workouts WHERE user_id = ? ORDER BY date DESC LIMIT 60").bind(u.id),
    env.DB.prepare("SELECT data FROM body_logs WHERE user_id = ? ORDER BY date DESC LIMIT 12").bind(u.id),
    env.DB.prepare("SELECT data FROM nutrition_days WHERE user_id = ? ORDER BY date DESC LIMIT 7").bind(u.id),
  ]);
  const workouts = (wRes.results as { data: string }[]).map((r) => JSON.parse(r.data) as Workout);
  const body = (bRes.results as { data: string }[]).map((r) => JSON.parse(r.data) as Record<string, number | string>);
  const nutrition = (nRes.results as { data: string }[]).map((r) => JSON.parse(r.data) as { date: string; waterMl: number; entries: { kcal: number; protein: number; carbs: number; fat: number }[] });

  // récords (1RM estimado) por ejercicio
  const best: Record<string, { e: number; w: number; r: number; d: number }> = {};
  for (const w of workouts)
    for (const ex of w.exercises)
      for (const s of ex.sets) {
        if (!s.done || !s.weight || !s.reps) continue;
        const v = e1rm(s.weight, s.reps);
        if (!best[ex.slug] || v > best[ex.slug].e) best[ex.slug] = { e: v, w: s.weight, r: s.reps, d: w.date };
      }
  const prs = Object.entries(best)
    .sort((a, b) => b[1].e - a[1].e)
    .slice(0, 15)
    .map(([slug, b]) => `- ${EXERCISE_BY_SLUG[slug]?.name ?? slug}: mejor serie ${b.w} kg × ${b.r} (1RM est. ${Math.round(b.e)} kg, ${day(b.d)})`);

  // volumen por semana (4 semanas)
  const weeks: string[] = [];
  for (let i = 0; i < 4; i++) {
    const to = Date.now() - i * 7 * 864e5;
    const from = to - 7 * 864e5;
    const ws = workouts.filter((w) => w.date >= from && w.date < to);
    weeks.push(`- Semana -${i}: ${ws.length} entrenos, ${Math.round(ws.reduce((a, w) => a + (w.volume || 0), 0))} kg de volumen`);
  }

  const recent = workouts.slice(0, 8).map((w) => {
    const ex = w.exercises
      .slice(0, 8)
      .map((e) => {
        const top = [...e.sets].filter((s) => s.done).sort((a, b) => e1rm(b.weight, b.reps) - e1rm(a.weight, a.reps))[0];
        return `${e.name}${top ? ` (${top.weight ? `${top.weight} kg × ` : ""}${top.reps})` : ""}`;
      })
      .join(", ");
    return `- ${day(w.date)} · ${w.name} · ${Math.round((w.durationSec || 0) / 60)} min · ${w.totalSets} series${w.feeling ? ` · sensación ${w.feeling}/5` : ""}${w.notes ? ` · nota: "${String(w.notes).slice(0, 120)}"` : ""}\n  ${ex}`;
  });

  const weights = body.filter((b) => b.weight).map((b) => `${b.date}: ${b.weight} kg${b.waist ? `, cintura ${b.waist} cm` : ""}`);
  const today = new Date().toISOString().slice(0, 10);
  const nToday = nutrition.find((n) => n.date === today);
  const sum = (k: "kcal" | "protein" | "carbs" | "fat") => Math.round(nToday?.entries.reduce((a, e) => a + (e[k] || 0), 0) ?? 0);
  const avgKcal = nutrition.length ? Math.round(nutrition.reduce((a, n) => a + n.entries.reduce((x, e) => x + (e.kcal || 0), 0), 0) / nutrition.length) : null;

  const plan = ROUTINES.find((r) => r.slug === p.planSlug);
  return `DATOS DEL USUARIO (reales, de la app):
Nombre: ${p.name}. Objetivo: ${p.goal ?? "sin definir"}. Nivel: ${p.level ?? "sin definir"}. Lugar: ${p.place ?? "sin definir"}. Días/semana: ${p.weeklyWorkoutsGoal ?? "?"}. Minutos/sesión: ${p.sessionMinutes ?? "?"}.
Sexo: ${p.sex ?? "?"}. Año de nacimiento: ${p.birthYear ?? "?"}. Altura: ${p.heightCm ?? "?"} cm. Peso objetivo: ${p.targetWeight ?? "?"} kg. Zonas a mejorar: ${(p.focusAreas as string[] | undefined)?.join(", ") || "—"}. Alimentación: ${p.diet ?? "omnívora"}.
Objetivos nutricionales: ${p.calorieGoal ?? "?"} kcal, P ${p.proteinGoal ?? "?"} g, C ${p.carbsGoal ?? "?"} g, G ${p.fatGoal ?? "?"} g, agua ${p.waterGoal ?? "?"} ml.
Programa actual: ${plan ? `${plan.name} (${plan.days.map((d) => d.name).join(" / ")})` : "ninguno"}.
Entrenos registrados en total: ${workouts.length}${workouts.length === 60 ? "+" : ""}.

Últimos entrenos:
${recent.join("\n") || "- Ninguno todavía"}

Récords (1RM estimado):
${prs.join("\n") || "- Sin récords todavía"}

Volumen reciente:
${weeks.join("\n")}

Peso corporal (más reciente primero):
${weights.join("; ") || "sin registros"}

Nutrición hoy (${today}): ${nToday ? `${sum("kcal")} kcal, P ${sum("protein")} g, C ${sum("carbs")} g, G ${sum("fat")} g, agua ${nToday.waterMl} ml` : "sin registros"}. Media últimos ${nutrition.length} días con registro: ${avgKcal ?? "—"} kcal.
Fecha de hoy: ${today}.`;
}

/** Esquema JSON del entreno que propone la IA. */
export const WORKOUT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Título corto del entreno" },
    summary: { type: "string", description: "Por qué este entreno, en 1–2 frases usando sus datos" },
    items: {
      type: "array",
      minItems: 3,
      maxItems: 9,
      items: {
        type: "object",
        properties: {
          slug: { type: "string", description: "slug exacto del catálogo" },
          sets: { type: "integer", minimum: 1, maximum: 6 },
          reps: { type: "integer", minimum: 1, maximum: 30 },
          seconds: { type: "integer", minimum: 10, maximum: 300 },
          rest: { type: "integer", minimum: 0, maximum: 240 },
        },
        required: ["slug", "sets", "rest"],
      },
    },
  },
  required: ["title", "summary", "items"],
};

interface ProposedItem {
  slug: string;
  sets: number;
  reps?: number;
  seconds?: number;
  rest: number;
}

/** Valida la propuesta de la IA: descarta ejercicios inexistentes y normaliza valores. */
export function validateWorkout(raw: { title?: string; summary?: string; items?: ProposedItem[] }) {
  const items = (raw.items ?? [])
    .filter((i) => EXERCISE_BY_SLUG[i.slug])
    .slice(0, 9)
    .map((i) => {
      const e = EXERCISE_BY_SLUG[i.slug];
      const sets = Math.min(6, Math.max(1, Math.round(i.sets || 3)));
      const rest = Math.min(240, Math.max(0, Math.round(i.rest ?? 60)));
      return e.timed
        ? { slug: i.slug, sets, seconds: Math.min(300, Math.max(10, Math.round(i.seconds || 30))), rest }
        : { slug: i.slug, sets, reps: Math.min(30, Math.max(1, Math.round(i.reps || 10))), rest };
    });
  if (items.length < 2) return null;
  return { title: String(raw.title || "Entreno DNI AI Coach").slice(0, 80), summary: String(raw.summary || "").slice(0, 400), items };
}
