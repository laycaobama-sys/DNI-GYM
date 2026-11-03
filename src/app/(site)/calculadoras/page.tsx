import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CALCULATORS } from "@/data/calculators";

export const metadata: Metadata = {
  title: "Calculadoras fitness gratis: calorías, macros, IMC y 1RM",
  description: "Calculadoras de fitness gratuitas: calorías diarias (TDEE), macronutrientes, índice de masa corporal (IMC) y repetición máxima (1RM).",
  alternates: { canonical: "/calculadoras" },
};

export default function CalculatorsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">Herramientas</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Calculadoras fitness</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-2">Herramientas gratuitas basadas en fórmulas científicas para planificar tu entrenamiento y tu alimentación.</p>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CALCULATORS.map((c) => (
          <Link key={c.slug} href={`/calculadoras/${c.slug}`} className="card group p-6 transition-colors hover:border-accent/40">
            <h2 className="font-display text-xl font-semibold">{c.name}</h2>
            <p className="mt-2 text-sm text-muted">{c.intro}</p>
            <span className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-accent">
              Calcular <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
