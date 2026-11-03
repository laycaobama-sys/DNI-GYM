import { AlertTriangle, CheckCircle2, Lightbulb, CirclePlay } from "lucide-react";
import { groupLabel, youtubeSearchUrl, type Exercise } from "@/data/exercises";
import { ExerciseDemo } from "./exercise-demo";
import { MuscleMap } from "./muscle-map";

export function ExerciseFacts({ e }: { e: Exercise }) {
  const facts = [
    ["Grupo", groupLabel(e.group)],
    ["Equipamiento", e.equipment],
    ["Nivel", e.level],
    ["Series × reps", e.prescription],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3">
      {facts.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-line bg-surface-2 px-4 py-3">
          <dt className="text-xs text-muted">{k}</dt>
          <dd className="mt-0.5 font-semibold capitalize">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ExerciseMuscles({ e, map }: { e: Exercise; map?: boolean }) {
  return (
    <div className="space-y-3">
      {map && <MuscleMap primary={e.primary} secondary={e.secondary} className="mx-auto max-w-sm" />}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Músculos principales</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {e.primary.map((m) => (
            <span key={m} className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
              {m}
            </span>
          ))}
        </div>
      </div>
      {e.secondary.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Músculos secundarios</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {e.secondary.map((m) => (
              <span key={m} className="rounded-full border border-line px-3 py-1 text-sm text-ink-2">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ExerciseSteps({ e, headingLevel = 2 }: { e: Exercise; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className="space-y-8">
      <section>
        <H className="font-display text-xl font-semibold">Cómo hacer {e.name.toLowerCase()} paso a paso</H>
        <ol className="mt-4 space-y-3">
          {e.steps.map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent font-display text-sm font-bold text-accent-ink">
                {i + 1}
              </span>
              <p className="pt-0.5 leading-relaxed text-ink-2">{s}</p>
            </li>
          ))}
        </ol>
      </section>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-good/20 bg-good/[0.05] p-5">
          <H className="flex items-center gap-2 font-semibold text-good">
            <Lightbulb className="size-4" /> Consejos
          </H>
          <ul className="mt-3 space-y-2">
            {e.tips.map((t) => (
              <li key={t} className="flex gap-2 text-sm leading-relaxed text-ink-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-good" /> {t}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-critical/20 bg-critical/[0.05] p-5">
          <H className="flex items-center gap-2 font-semibold text-critical">
            <AlertTriangle className="size-4" /> Errores comunes
          </H>
          <ul className="mt-3 space-y-2">
            {e.mistakes.map((t) => (
              <li key={t} className="flex gap-2 text-sm leading-relaxed text-ink-2">
                <span className="mt-0.5 text-critical">✕</span> {t}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export function YoutubeLink({ e }: { e: Exercise }) {
  return (
    <a
      href={youtubeSearchUrl(e)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink"
    >
      <CirclePlay className="size-4 text-critical" /> Ver vídeos de la técnica en YouTube
    </a>
  );
}

/** Versión compacta para usar dentro de la app (modal). */
export function ExerciseQuickView({ e }: { e: Exercise }) {
  return (
    <div className="space-y-6">
      <ExerciseDemo exercise={e} className="rounded-2xl" sizes="(max-width: 768px) 100vw, 700px" showLabels />
      <ExerciseFacts e={e} />
      <ExerciseMuscles e={e} map />
      <ExerciseSteps e={e} headingLevel={3} />
      <YoutubeLink e={e} />
    </div>
  );
}
