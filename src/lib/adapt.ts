// Adaptación de sesiones: tiempo disponible, lugar (casa/gimnasio) y molestias del día.
import { EXERCISES, EXERCISE_BY_SLUG, type Exercise } from "@/data/exercises";
import type { PlanItem } from "@/data/challenges";

export type Pain = "hombro" | "rodilla" | "lumbar" | "muneca";

export const PAIN_LABELS: Record<Pain, string> = {
  hombro: "Hombro",
  rodilla: "Rodilla",
  lumbar: "Zona lumbar",
  muneca: "Muñeca",
};

/** Ejercicios a evitar con cada molestia (criterio conservador). */
const AVOID: Record<Pain, string[]> = {
  hombro: [
    "press-militar-con-barra", "press-arnold", "press-de-hombro-con-mancuernas", "elevaciones-laterales", "elevaciones-frontales",
    "remo-al-menton", "fondos-en-paralelas-pecho", "fondos-de-triceps", "fondos-en-banco", "press-banca-con-barra",
    "press-banca-inclinado-con-barra", "aperturas-con-mancuernas", "press-frances", "extension-de-triceps-sobre-la-cabeza",
    "dominadas", "thruster-con-kettlebell", "pullover-en-polea",
  ],
  rodilla: [
    "sentadilla-con-barra", "sentadilla-frontal", "sentadilla-goblet", "sentadilla-sin-peso", "sentadilla-hack", "prensa-de-piernas",
    "extension-de-cuadriceps", "zancadas-con-mancuernas", "sentadilla-bulgara", "subidas-al-banco", "salto-al-cajon",
    "sentadilla-con-salto", "saltos-de-estrella", "saltar-a-la-comba", "thruster-con-kettlebell", "correr-en-cinta", "escaladores",
  ],
  lumbar: [
    "peso-muerto", "peso-muerto-sumo", "peso-muerto-rumano", "remo-con-barra", "remo-en-t", "sentadilla-con-barra", "sentadilla-frontal",
    "hiperextensiones", "swing-con-kettlebell", "rueda-abdominal", "elevacion-de-piernas-colgado", "giros-rusos", "press-militar-con-barra",
    "pull-through-en-polea",
  ],
  muneca: [
    "flexiones", "fondos-en-banco", "fondos-de-triceps", "fondos-en-paralelas-pecho", "press-frances", "curl-de-biceps-con-barra",
    "plancha-abdominal", "plancha-lateral", "escaladores", "rueda-abdominal", "press-banca-con-barra", "press-banca-agarre-cerrado",
  ],
};

export interface AdaptOptions {
  minutes?: number | null;
  place?: "casa" | "gimnasio" | null;
  pains?: Pain[];
}

const avoided = (slug: string, pains: Pain[]) => pains.some((p) => AVOID[p].includes(slug));
const fitsPlace = (e: Exercise, place?: AdaptOptions["place"]) => place !== "casa" || e.equipment === "peso corporal";

/** Ejercicios equivalentes (mismo grupo muscular), priorizando otro equipamiento. */
export function substitutes(slug: string, opts: AdaptOptions = {}, exclude: string[] = []): Exercise[] {
  const e = EXERCISE_BY_SLUG[slug];
  if (!e) return [];
  const pains = opts.pains ?? [];
  return EXERCISES.filter(
    (x) => x.group === e.group && x.slug !== slug && !exclude.includes(x.slug) && !avoided(x.slug, pains) && fitsPlace(x, opts.place),
  )
    .sort((a, b) => {
      const sa = (a.primary.some((m) => e.primary.includes(m)) ? 0 : 2) + (a.equipment === e.equipment ? 1 : 0);
      const sb = (b.primary.some((m) => e.primary.includes(m)) ? 0 : 2) + (b.equipment === e.equipment ? 1 : 0);
      return sa - sb;
    })
    .slice(0, 6);
}

export function estimateSeconds(items: PlanItem[]) {
  return items.reduce((a, it) => a + it.sets * ((it.seconds ?? (it.reps ?? 10) * 3.5) + it.rest), 0);
}

export interface AdaptResult {
  items: PlanItem[];
  changes: string[];
}

/** Adapta una lista de ejercicios a tiempo, lugar y molestias. */
export function adaptItems(base: PlanItem[], opts: AdaptOptions): AdaptResult {
  const pains = opts.pains ?? [];
  const changes: string[] = [];
  const used = new Set(base.map((i) => i.slug));
  let items: PlanItem[] = [];

  for (const it of base) {
    const e = EXERCISE_BY_SLUG[it.slug];
    if (!e) continue;
    if (avoided(it.slug, pains) || !fitsPlace(e, opts.place)) {
      const alt = substitutes(it.slug, opts, [...used])[0];
      if (alt) {
        used.add(alt.slug);
        changes.push(`${e.name} → ${alt.name}`);
        items.push({ ...it, slug: alt.slug, seconds: alt.timed ? it.seconds ?? 30 : undefined, reps: alt.timed ? undefined : it.reps ?? 12 });
      } else changes.push(`Quitado: ${e.name}`);
    } else items.push(it);
  }

  if (opts.minutes) {
    const limit = opts.minutes * 60;
    // 1) reducir series de los accesorios (del final hacia el principio), mínimo 2
    for (let i = items.length - 1; i >= 0 && estimateSeconds(items) > limit; i--) {
      if (items[i].sets > 2) {
        items[i] = { ...items[i], sets: items[i].sets - 1 };
        i++; // vuelve a intentar con el mismo
      }
    }
    // 2) quitar los últimos ejercicios (mínimo 3)
    while (items.length > 3 && estimateSeconds(items) > limit) {
      const removed = items.pop()!;
      changes.push(`Sin tiempo: ${EXERCISE_BY_SLUG[removed.slug]?.name}`);
    }
    // 3) acortar descansos
    if (estimateSeconds(items) > limit) items = items.map((i) => ({ ...i, rest: Math.max(30, Math.round(i.rest * 0.66)) }));
  }
  return { items, changes };
}

/** Peso sugerido para un nº de repeticiones a partir del 1RM estimado (Epley inverso, con 1–2 reps en reserva). */
export function suggestedWeight(e1rm: number, reps: number) {
  if (!e1rm || !reps) return 0;
  const w = e1rm / (1 + (reps + 1.5) / 30);
  return Math.max(0, Math.round(w / 2.5) * 2.5);
}
