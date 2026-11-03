import type { Activity, Goal, Sex, UserProfile, Workout } from "./types";
import { EXERCISE_BY_SLUG, type MuscleGroup } from "@/data/exercises";

export const ACTIVITY_FACTORS: Record<Activity, { factor: number; label: string; hint: string }> = {
  sedentario: { factor: 1.2, label: "Sedentario", hint: "Trabajo de oficina, sin ejercicio" },
  ligero: { factor: 1.375, label: "Ligero", hint: "1–3 entrenos por semana" },
  moderado: { factor: 1.55, label: "Moderado", hint: "3–5 entrenos por semana" },
  alto: { factor: 1.725, label: "Alto", hint: "6–7 entrenos por semana" },
  muy_alto: { factor: 1.9, label: "Muy alto", hint: "Trabajo físico + entreno diario" },
};

export const GOAL_LABELS: Record<Goal, string> = {
  perder: "Perder grasa",
  mantener: "Mantener / recomposición",
  ganar: "Ganar músculo",
};

export function bmi(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

export function bmiCategory(v: number) {
  if (v < 18.5) return { label: "Bajo peso", tone: "warning" as const };
  if (v < 25) return { label: "Peso normal", tone: "good" as const };
  if (v < 30) return { label: "Sobrepeso", tone: "warning" as const };
  return { label: "Obesidad", tone: "critical" as const };
}

/** Tasa metabólica basal — Mifflin-St Jeor */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "hombre" ? base + 5 : base - 161;
}

export function tdee(sex: Sex, weightKg: number, heightCm: number, age: number, activity: Activity) {
  return bmr(sex, weightKg, heightCm, age) * ACTIVITY_FACTORS[activity].factor;
}

export function goalCalories(maintenance: number, goal: Goal) {
  if (goal === "perder") return maintenance * 0.8;
  if (goal === "ganar") return maintenance * 1.1;
  return maintenance;
}

export function macroSplit(kcal: number, weightKg: number, goal: Goal) {
  const proteinPerKg = goal === "perder" ? 2.2 : goal === "ganar" ? 1.8 : 2.0;
  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round(Math.max((kcal * 0.25) / 9, weightKg * 0.7));
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { protein, fat, carbs };
}

export function computeNutritionGoals(p: Partial<UserProfile>, weightKg?: number) {
  if (!p.sex || !p.heightCm || !p.birthYear || !p.activity || !p.goal || !weightKg) return null;
  const age = new Date().getFullYear() - p.birthYear;
  const maint = tdee(p.sex, weightKg, p.heightCm, age, p.activity);
  const kcal = Math.round(goalCalories(maint, p.goal) / 10) * 10;
  const m = macroSplit(kcal, weightKg, p.goal);
  return {
    maintenance: Math.round(maint),
    calorieGoal: kcal,
    proteinGoal: m.protein,
    carbsGoal: m.carbs,
    fatGoal: m.fat,
    waterGoal: Math.round((weightKg * 35) / 250) * 250,
  };
}

/** 1RM estimado — fórmula de Epley */
export function oneRepMax(weight: number, reps: number) {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function workoutStats(w: Pick<Workout, "exercises">) {
  let volume = 0;
  let totalSets = 0;
  for (const ex of w.exercises) {
    for (const s of ex.sets) {
      if (!s.done) continue;
      totalSets++;
      volume += (s.weight || 0) * (s.reps || 0);
    }
  }
  return { volume: Math.round(volume), totalSets };
}

export function bestSetByExercise(workouts: Workout[]) {
  const best: Record<string, { e1rm: number; weight: number; reps: number; date: number }> = {};
  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (!s.done || !s.weight || !s.reps) continue;
        const v = oneRepMax(s.weight, s.reps);
        if (!best[ex.slug] || v > best[ex.slug].e1rm) best[ex.slug] = { e1rm: v, weight: s.weight, reps: s.reps, date: w.date };
      }
    }
  }
  return best;
}

export function setsByGroup(workouts: Workout[]) {
  const out: Partial<Record<MuscleGroup, number>> = {};
  for (const w of workouts)
    for (const ex of w.exercises) {
      const g = EXERCISE_BY_SLUG[ex.slug]?.group;
      if (!g) continue;
      out[g] = (out[g] ?? 0) + ex.sets.filter((s) => s.done).length;
    }
  return out;
}

// ───────── fechas ─────────
export const dayKey = (d: Date | number = new Date()) => {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const parseDayKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const startOfWeek = (d: Date | number = new Date()) => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // lunes = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
};

export const addDays = (d: Date | number, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/**
 * Racha semanal «que perdona»: cuenta semanas seguidas con al menos un entreno
 * y permite un comodín (una semana sin entrenar) sin romper la racha.
 */
export function weekStreakInfo(workouts: Workout[]) {
  if (!workouts.length) return { streak: 0, freezeUsed: false, atRisk: false };
  const weeks = new Set(workouts.map((w) => startOfWeek(w.date).getTime()));
  let streak = 0;
  let freezeUsed = false;
  let cursor = startOfWeek();
  const thisWeekDone = weeks.has(cursor.getTime());
  // si esta semana aún no hay entreno, empezamos a contar desde la anterior
  if (!thisWeekDone) cursor = addDays(cursor, -7);
  for (;;) {
    if (weeks.has(cursor.getTime())) {
      streak++;
    } else if (!freezeUsed && streak > 0 && weeks.has(addDays(cursor, -7).getTime())) {
      freezeUsed = true;
    } else break;
    cursor = addDays(cursor, -7);
  }
  return { streak, freezeUsed, atRisk: !thisWeekDone && streak > 0 };
}

export function weekStreak(workouts: Workout[]) {
  return weekStreakInfo(workouts).streak;
}

export const fmtNumber = (n: number, digits = 0) =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n);

export const fmtDate = (d: number | Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
  new Intl.DateTimeFormat("es-ES", opts).format(typeof d === "string" ? parseDayKey(d) : new Date(d));

export const fmtDateTime = (d: number) =>
  new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

export const fmtDuration = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h) return `${h} h ${m} min`;
  if (m) return `${m} min${s && m < 10 ? ` ${s} s` : ""}`;
  return `${s} s`;
};

export const timeAgo = (ts?: number) => {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} d`;
  return fmtDate(ts);
};

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 20)
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
