import { EXERCISE_BY_SLUG, EXERCISES, GROUPS, type Exercise, type Level, type MuscleGroup } from "./exercises";

/** Un bloque de un entreno guiado: ejercicio + series + objetivo (reps o segundos) + descanso. */
export interface PlanItem {
  slug: string;
  sets: number;
  /** repeticiones objetivo (si `seconds` no está definido) */
  reps?: number;
  /** duración en segundos para ejercicios por tiempo */
  seconds?: number;
  rest: number;
}

export interface GuidedSession {
  title: string;
  subtitle?: string;
  cover?: string;
  items: PlanItem[];
  routineSlug?: string;
  challenge?: { slug: string; day: number };
}

// ───────────────────────── Retos de 30 días ─────────────────────────

export interface Challenge {
  slug: string;
  name: string;
  short: string;
  description: string;
  cover: string;
  level: Level;
  focus: string;
  /** ejercicios base del reto; se rotan y progresan día a día */
  pool: { slug: string; reps?: number; seconds?: number }[];
}

export const CHALLENGES: Challenge[] = [
  {
    slug: "abdominales-30-dias",
    name: "Reto abdominales 30 días",
    short: "Abdomen marcado",
    description: "Un core más fuerte y definido en 30 días con sesiones cortas de 8–15 minutos que aumentan de intensidad cada semana.",
    cover: "/brand/c-abdomen.webp",
    level: "principiante",
    focus: "Abdomen",
    pool: [
      { slug: "crunch-abdominal", reps: 12 },
      { slug: "plancha-abdominal", seconds: 20 },
      { slug: "crunch-bicicleta", reps: 16 },
      { slug: "crunch-inverso", reps: 10 },
      { slug: "giros-rusos", reps: 16 },
      { slug: "escaladores", seconds: 20 },
      { slug: "dead-bug", reps: 10 },
      { slug: "plancha-lateral", seconds: 15 },
    ],
  },
  {
    slug: "gluteos-30-dias",
    name: "Reto glúteos 30 días",
    short: "Glúteos firmes",
    description: "Activa, fortalece y da forma a tus glúteos con puentes, patadas y sentadillas. Sin material, desde casa.",
    cover: "/brand/c-gluteos.webp",
    level: "principiante",
    focus: "Glúteos y piernas",
    pool: [
      { slug: "puente-de-gluteo", reps: 15 },
      { slug: "sentadilla-sin-peso", reps: 15 },
      { slug: "patada-de-gluteo", reps: 12 },
      { slug: "sentadilla-con-salto", reps: 8 },
      { slug: "plancha-lateral", seconds: 15 },
    ],
  },
  {
    slug: "flexiones-30-dias",
    name: "Reto flexiones 30 días",
    short: "Pecho y brazos",
    description: "De pocas flexiones a series sólidas: pecho, hombros y tríceps más fuertes con progresión diaria.",
    cover: "/brand/c-flexiones.webp",
    level: "intermedio",
    focus: "Pecho y tríceps",
    pool: [
      { slug: "flexiones", reps: 8 },
      { slug: "fondos-en-banco", reps: 10 },
      { slug: "plancha-abdominal", seconds: 25 },
      { slug: "escaladores", seconds: 20 },
    ],
  },
  {
    slug: "cuerpo-completo-30-dias",
    name: "Reto cuerpo completo 30 días",
    short: "Quema grasa en casa",
    description: "Circuitos HIIT de cuerpo completo para quemar calorías, mejorar el cardio y tonificar sin salir de casa.",
    cover: "/brand/c-fullbody.webp",
    level: "intermedio",
    focus: "Cuerpo completo",
    pool: [
      { slug: "saltos-de-estrella", seconds: 30 },
      { slug: "sentadilla-sin-peso", reps: 15 },
      { slug: "flexiones", reps: 10 },
      { slug: "escaladores", seconds: 30 },
      { slug: "sentadilla-con-salto", reps: 10 },
      { slug: "puente-de-gluteo", reps: 15 },
      { slug: "plancha-abdominal", seconds: 30 },
    ],
  },
];

export const CHALLENGE_DAYS = 30;
export const isRestDay = (day: number) => day % 4 === 0 && day !== CHALLENGE_DAYS;

/** Genera el entreno del día `day` (1–30) con progresión de volumen. */
export function challengeDay(c: Challenge, day: number): GuidedSession {
  const week = Math.floor((day - 1) / 7); // 0..4
  const factor = 1 + week * 0.2 + ((day - 1) % 7) * 0.03;
  const count = Math.min(c.pool.length, 4 + Math.floor(week / 2));
  const start = (day - 1) % c.pool.length;
  const items: PlanItem[] = Array.from({ length: count }, (_, i) => {
    const p = c.pool[(start + i) % c.pool.length];
    return {
      slug: p.slug,
      sets: week >= 2 ? 3 : 2,
      reps: p.reps ? Math.round(p.reps * factor) : undefined,
      seconds: p.seconds ? Math.round((p.seconds * factor) / 5) * 5 : undefined,
      rest: 30,
    };
  });
  return {
    title: `${c.name} · Día ${day}`,
    subtitle: c.focus,
    cover: c.cover,
    items,
    challenge: { slug: c.slug, day },
  };
}

export const getChallenge = (slug: string) => CHALLENGES.find((c) => c.slug === slug);

// ───────────────────────── Entrenos rápidos (explorar) ─────────────────────────

export interface QuickWorkout {
  id: string;
  group: MuscleGroup;
  level: Level;
  title: string;
  minutes: number;
  cover: string;
  session: GuidedSession;
}

const LEVEL_SETS: Record<Level, number> = { principiante: 2, intermedio: 3, avanzado: 4 };
const LEVEL_EX: Record<Level, number> = { principiante: 4, intermedio: 5, avanzado: 6 };

function parseTarget(e: Exercise): { reps?: number; seconds?: number } {
  const m = e.prescription.match(/(\d+)\s*(?:–|-)?\s*(\d+)?\s*(s|min)?/);
  if (e.timed) {
    const s = e.prescription.includes("min") ? 60 : Number(m?.[1] ?? 30);
    return { seconds: Math.min(60, s) };
  }
  const reps = e.prescription.match(/×\s*(\d+)(?:–(\d+))?/);
  return { reps: reps ? Number(reps[2] ?? reps[1]) : 12 };
}

/** Entrenos generados por grupo muscular y nivel (casa y gimnasio). */
export function quickWorkouts(place: "casa" | "gimnasio" = "gimnasio"): QuickWorkout[] {
  const out: QuickWorkout[] = [];
  for (const g of GROUPS) {
    const pool = EXERCISES.filter(
      (e) => e.group === g.id && (place === "gimnasio" || e.equipment === "peso corporal"),
    );
    if (pool.length < 2) continue;
    for (const level of ["principiante", "intermedio", "avanzado"] as Level[]) {
      const ranked = [...pool].sort((a, b) => {
        const score = (e: Exercise) => (e.level === level ? 0 : 1) + (level === "principiante" && e.level === "avanzado" ? 2 : 0);
        return score(a) - score(b);
      });
      const chosen = ranked.slice(0, Math.min(LEVEL_EX[level], ranked.length));
      const sets = LEVEL_SETS[level];
      const items: PlanItem[] = chosen.map((e) => ({ slug: e.slug, sets, ...parseTarget(e), rest: e.group === "cardio" ? 30 : level === "avanzado" ? 75 : 60 }));
      const minutes = Math.round(items.reduce((a, it) => a + it.sets * ((it.seconds ?? (it.reps ?? 10) * 3) + it.rest), 0) / 60);
      const title = `${g.label} ${place === "casa" ? "en casa" : ""}`.trim();
      out.push({
        id: `${g.id}-${level}-${place}`,
        group: g.id,
        level,
        title,
        minutes,
        cover: `/brand/g-${g.id}.webp`,
        session: { title: `${title} · ${level}`, subtitle: `${minutes} min · ${items.length} ejercicios`, cover: `/brand/g-${g.id}.webp`, items },
      });
    }
  }
  return out;
}

/** Convierte un día de rutina (series × "8–12") en sesión guiada. */
export function routineItemsToPlan(items: { slug: string; sets: number; reps: string; rest: number }[]): PlanItem[] {
  return items.map((it) => {
    const e = EXERCISE_BY_SLUG[it.slug];
    const secMatch = it.reps.match(/(\d+)\s*s/);
    const minMatch = it.reps.match(/(\d+)\s*min/);
    if (e?.timed || secMatch || minMatch) {
      const seconds = minMatch ? Number(minMatch[1]) * 60 : Number(secMatch?.[1] ?? 30);
      return { slug: it.slug, sets: it.sets, seconds, rest: it.rest };
    }
    const r = it.reps.match(/(\d+)(?:–(\d+))?/);
    return { slug: it.slug, sets: it.sets, reps: r ? Number(r[2] ?? r[1]) : 10, rest: it.rest };
  });
}

export const GROUP_COVER = (g: MuscleGroup) => `/brand/g-${g}.webp`;
export const ROUTINE_COVER = (slug: string) => `/brand/p-${slug}.webp`;
