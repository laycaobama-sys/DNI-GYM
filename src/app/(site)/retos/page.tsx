import { seoDesc } from "@/lib/site";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CHALLENGES } from "@/data/challenges";

export const metadata: Metadata = {
  title: "Retos de 30 días gratis",
  description: seoDesc("Retos fitness de 30 días gratis para hacer en casa: reto abdominales, reto glúteos, reto flexiones y reto cuerpo completo. Entreno guiado diario con progresión."),
  alternates: { canonical: "/retos" },
};

export default function ChallengesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Retos</p>
      <h1 className="mt-4 font-athletic text-6xl font-extrabold uppercase italic leading-[0.9] sm:text-7xl">
        Retos de <span className="text-accent">30 días</span>
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-2">Un entreno corto cada día, sin material, que aumenta de intensidad semana a semana. Elige tu reto y empieza hoy.</p>
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {CHALLENGES.map((c) => (
          <Link key={c.slug} href={`/retos/${c.slug}`} className="group relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/10">
            <Image src={c.cover} alt="" fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <span className="absolute left-5 top-5 rounded-full bg-accent px-3 py-1 text-xs font-bold capitalize text-accent-ink">{c.level}</span>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
              <div>
                <h2 className="font-athletic text-4xl font-extrabold uppercase italic leading-none">{c.name}</h2>
                <p className="mt-2 max-w-md text-sm text-white/75">{c.description}</p>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 backdrop-blur group-hover:bg-accent group-hover:text-accent-ink">
                <ArrowUpRight className="size-5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
