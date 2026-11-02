import { ROUTINES, getRoutine, type Routine } from "@/data/routines";
import { routineItemsToPlan, ROUTINE_COVER, type GuidedSession } from "@/data/challenges";
import type { UserProfile, Workout } from "./types";
import { bestSetByExercise, startOfWeek, weekStreak } from "./fitness";

/** Programa recomendado según las respuestas del cuestionario. */
export function recommendRoutine(p: Partial<UserProfile>): Routine {
  const days = p.weeklyWorkoutsGoal ?? 3;
  const focus = p.focusAreas ?? [];
  let slug = "full-body-principiante";
  if (p.place === "casa") slug = p.goal === "perder" && p.level !== "principiante" ? "quema-grasa-hiit" : "entrenamiento-en-casa-sin-material";
  else if (p.goal === "perder" && days >= 4) slug = "quema-grasa-hiit";
  else if (focus.includes("gluteos") && days <= 4) slug = "gluteos-y-piernas";
  else if (p.level === "principiante") slug = "full-body-principiante";
  else if (days >= 5) slug = "push-pull-legs";
  else if (days >= 4) slug = "torso-pierna-4-dias";
  else slug = "full-body-principiante";
  return getRoutine(slug) ?? ROUTINES[0];
}

export function activeRoutine(p: Partial<UserProfile> | null | undefined): Routine {
  return (p?.planSlug && getRoutine(p.planSlug)) || recommendRoutine(p ?? {});
}

/** Próximo día del programa: rota según los entrenos ya hechos de ese programa. */
export function nextRoutineDay(r: Routine, workouts: Workout[]) {
  const done = workouts.filter((w) => w.routineSlug === r.slug);
  if (!done.length) return { index: 0, day: r.days[0] };
  const last = done[0];
  const lastIdx = r.days.findIndex((d) => last.name.endsWith(d.name));
  const index = lastIdx >= 0 ? (lastIdx + 1) % r.days.length : done.length % r.days.length;
  return { index, day: r.days[index] };
}

export function routineDaySession(r: Routine, index: number): GuidedSession {
  const d = r.days[index];
  return {
    title: `${r.name} · ${d.name}`,
    subtitle: d.focus,
    cover: ROUTINE_COVER(r.slug),
    items: routineItemsToPlan(d.items),
    routineSlug: r.slug,
  };
}

/** Estimación de kcal de una sesión (MET ~5–6 para fuerza, ~8 para HIIT). */
export function estimateKcal(durationSec: number, weightKg = 75, intense = false) {
  const met = intense ? 8 : 5.5;
  return Math.round(((met * 3.5 * weightKg) / 200) * (durationSec / 60));
}

// ───────────────────────── Logros y niveles ─────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number; // 0..1
}

export function achievements(workouts: Workout[], bodyLogs: number, profile: UserProfile | null): Achievement[] {
  const n = workouts.length;
  const volume = workouts.reduce((a, w) => a + w.volume, 0);
  const streak = weekStreak(workouts);
  const prs = Object.keys(bestSetByExercise(workouts)).length;
  const challengeDays = Object.values(profile?.challenges ?? {}).reduce((a, d) => a + d.length, 0);
  const longest = Math.max(0, ...workouts.map((w) => w.durationSec));
  const a = (id: string, title: string, description: string, icon: string, value: number, target: number): Achievement => ({
    id,
    title,
    description,
    icon,
    unlocked: value >= target,
    progress: Math.min(1, value / target),
  });
  return [
    a("first", "Primer paso", "Completa tu primer entrenamiento", "Flag", n, 1),
    a("ten", "Constancia", "Completa 10 entrenamientos", "Flame", n, 10),
    a("fifty", "Imparable", "Completa 50 entrenamientos", "Zap", n, 50),
    a("streak4", "Racha de un mes", "Entrena 4 semanas seguidas", "CalendarCheck", streak, 4),
    a("vol10k", "10 toneladas", "Levanta 10.000 kg en total", "Dumbbell", volume, 10000),
    a("vol100k", "100 toneladas", "Levanta 100.000 kg en total", "BicepsFlexed", volume, 100000),
    a("prs", "Coleccionista de récords", "Registra marcas en 10 ejercicios", "Trophy", prs, 10),
    a("body", "Datos que cuentan", "Registra tu peso 10 veces", "Scale", bodyLogs, 10),
    a("challenge", "Retador", "Completa 7 días de cualquier reto", "Target", challengeDays, 7),
    a("hour", "Sesión épica", "Entrena más de 60 minutos seguidos", "Timer", longest, 3600),
  ];
}

const LEVELS = ["Novato", "Iniciado", "Constante", "Atleta", "Avanzado", "Élite", "Leyenda"];

export function levelInfo(workouts: Workout[]) {
  const xp = workouts.reduce((a, w) => a + 50 + w.totalSets * 5, 0);
  // cada nivel requiere un 40% más de XP que el anterior
  let level = 0;
  let need = 500;
  let acc = 0;
  while (xp >= acc + need && level < LEVELS.length - 1) {
    acc += need;
    level++;
    need = Math.round(need * 1.4);
  }
  return { xp, level: level + 1, name: LEVELS[level], progress: Math.min(1, (xp - acc) / need), toNext: acc + need - xp };
}

export function weekDays(workouts: Workout[]) {
  const start = startOfWeek().getTime();
  const labels = ["L", "M", "X", "J", "V", "S", "D"];
  const today = (new Date().getDay() + 6) % 7;
  return labels.map((l, i) => {
    const s = start + i * 864e5;
    return { label: l, date: new Date(s).getDate(), done: workouts.some((w) => w.date >= s && w.date < s + 864e5), today: i === today, future: i > today };
  });
}
