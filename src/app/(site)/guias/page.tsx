import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { GUIDES } from "@/data/guides";

export const metadata: Metadata = {
  title: "Guías de entrenamiento y nutrición: respuestas claras basadas en evidencia",
  description: "Guías gratuitas de gimnasio, entrenamiento en casa y nutrición: rutinas para principiantes, cuánta proteína tomar, cómo perder grasa sin perder músculo y qué comer antes y después de entrenar.",
  alternates: { canonical: "/guias" },
};

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Guías</p>
      <h1 className="mt-4 font-athletic text-5xl font-extrabold uppercase italic leading-[0.9] sm:text-7xl">
        Entrena y come <span className="text-accent">con criterio</span>
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-2">Respuestas directas a las dudas más comunes sobre gimnasio, entrenamiento en casa y nutrición.</p>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guias/${g.slug}`} className="group overflow-hidden rounded-3xl border border-line bg-surface transition-colors hover:border-accent/40">
            <div className="relative aspect-[16/9]">
              <Image src={g.cover} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">{g.category}</span>
            </div>
            <div className="p-5">
              <h2 className="font-display text-lg font-semibold leading-snug">{g.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{g.answer}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted">
                  <Clock className="size-4" /> {g.minutes} min
                </span>
                <ArrowUpRight className="size-5 text-accent" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
