import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { ROUTINES } from "@/data/routines";

export const metadata: Metadata = {
  title: "Rutinas de gimnasio gratis: principiantes, torso-pierna, PPL, glúteos y en casa",
  description:
    "Rutinas de gimnasio gratuitas y completas: Full Body para principiantes, Torso/Pierna 4 días, Push Pull Legs, glúteos y piernas, entrenamiento en casa sin material y quema grasa con HIIT. Con series, repeticiones y descansos.",
  alternates: { canonical: "/rutinas" },
};

export default function RoutinesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">Programas</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Rutinas de entrenamiento</h1>
      <p className="mt-4 max-w-3xl text-lg text-ink-2">
        Programas completos con ejercicios, series, repeticiones y descansos. Ábrelos en la app con un clic y registra cada sesión para
        ver tu progreso semana a semana.
      </p>
      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
        {ROUTINES.map((r) => (
          <Link key={r.slug} href={`/rutinas/${r.slug}`} className="card group flex flex-col p-7 transition-colors hover:border-accent/40">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-accent/10 px-2.5 py-1 font-semibold capitalize text-accent">{r.level}</span>
              <span className="rounded-full bg-white/5 px-2.5 py-1 capitalize text-ink-2">{r.goal}</span>
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold">{r.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">{r.description}</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-1.5"><CalendarDays className="size-4" /> {r.daysPerWeek} días/semana</span>
              <span className="flex items-center gap-1.5"><Clock className="size-4" /> ~{r.minutes} min</span>
              <span className="flex items-center gap-1.5 capitalize"><MapPin className="size-4" /> {r.place}</span>
            </div>
            <span className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-accent">
              Ver programa completo <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
