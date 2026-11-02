import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MapPin, Play, Target } from "lucide-react";
import { ROUTINES, getRoutine } from "@/data/routines";
import { exerciseImages, getExercise } from "@/data/exercises";
import { JsonLd } from "@/components/json-ld";
import { buttonClass } from "@/lib/cn";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return ROUTINES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/rutinas/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = getRoutine(slug);
  if (!r) return {};
  return {
    title: `${r.name}: rutina completa gratis (${r.daysPerWeek} días)`,
    description: `${r.description} Nivel ${r.level}, objetivo ${r.goal}, ${r.daysPerWeek} días por semana, ~${r.minutes} minutos por sesión.`,
    alternates: { canonical: `/rutinas/${r.slug}` },
  };
}

export default async function RoutinePage({ params }: PageProps<"/rutinas/[slug]">) {
  const { slug } = await params;
  const r = getRoutine(slug);
  if (!r) notFound();

  const ld = {
    "@context": "https://schema.org",
    "@type": "ExercisePlan",
    name: r.name,
    description: r.description,
    url: absoluteUrl(`/rutinas/${r.slug}`),
    inLanguage: "es",
    activityFrequency: `${r.daysPerWeek} días por semana`,
    activityDuration: `PT${r.minutes}M`,
    intensity: r.level,
    exerciseType: r.goal,
    workload: r.days.map((d) => `${d.name}: ${d.items.map((i) => `${getExercise(i.slug)?.name} ${i.sets}x${i.reps}`).join(", ")}`).join(" | "),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={ld} />
      <Link href="/rutinas" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Rutinas
      </Link>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">{r.name}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-2">{r.description}</p>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        {[
          [CalendarDays, `${r.daysPerWeek} días/semana`],
          [Clock, `~${r.minutes} min/sesión`],
          [Target, r.goal],
          [MapPin, r.place],
        ].map(([Icon, t]) => {
          const I = Icon as typeof Clock;
          return (
            <span key={String(t)} className="flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 capitalize text-ink-2">
              <I className="size-4 text-accent" /> {String(t)}
            </span>
          );
        })}
      </div>

      <div className="mt-12 space-y-8">
        {r.days.map((d, di) => (
          <section key={d.name} className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">{d.name}</h2>
                <p className="text-sm text-muted">{d.focus}</p>
              </div>
              <Link href={`/panel/entrenar?rutina=${r.slug}&dia=${di}`} className={buttonClass("primary", "sm")}>
                <Play className="size-3.5" /> Empezar este día
              </Link>
            </div>
            <ol className="divide-y divide-line">
              {d.items.map((it, idx) => {
                const e = getExercise(it.slug)!;
                return (
                  <li key={it.slug + idx}>
                    <Link href={`/ejercicios/${e.slug}`} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.02]">
                      <span className="w-5 text-sm font-semibold text-muted tabular-nums">{idx + 1}</span>
                      <Image src={exerciseImages(e)[1]} alt={e.name} width={96} height={64} className="h-12 w-[72px] rounded-lg bg-white object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{e.name}</p>
                        <p className="truncate text-xs text-muted">{e.primary.join(", ")}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold tabular-nums">
                          {it.sets} × {it.reps}
                        </p>
                        {it.rest > 0 && <p className="text-xs text-muted">Descanso {it.rest} s</p>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      <div className="card mt-12 p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold">Cómo progresar con esta rutina</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-2">
          <li>• Usa un peso que te deje 1–3 repeticiones en reserva en cada serie.</li>
          <li>• Cuando completes todas las series en el tope del rango de repeticiones, sube el peso un 2,5–5%.</li>
          <li>• Registra cada sesión en DNI GYM: verás tu marca anterior y tus récords automáticamente.</li>
          <li>• Duerme 7–9 horas y come suficiente proteína (1,6–2,2 g/kg) para recuperarte.</li>
        </ul>
      </div>
    </div>
  );
}
