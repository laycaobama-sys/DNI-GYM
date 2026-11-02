import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Moon } from "lucide-react";
import { CHALLENGES, CHALLENGE_DAYS, challengeDay, getChallenge, isRestDay } from "@/data/challenges";
import { EXERCISE_BY_SLUG, exerciseImages } from "@/data/exercises";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return CHALLENGES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/retos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = getChallenge(slug);
  if (!c) return {};
  return { title: `${c.name}: plan día a día gratis`, description: `${c.description} Calendario completo de 30 días con ejercicios, repeticiones y descansos.`, alternates: { canonical: `/retos/${c.slug}` } };
}

export default async function ChallengePage({ params }: PageProps<"/retos/[slug]">) {
  const { slug } = await params;
  const c = getChallenge(slug);
  if (!c) notFound();
  const day1 = challengeDay(c, 1);
  const ld = {
    "@context": "https://schema.org",
    "@type": "ExercisePlan",
    name: c.name,
    description: c.description,
    url: absoluteUrl(`/retos/${c.slug}`),
    inLanguage: "es",
    activityFrequency: "Diaria (30 días)",
    intensity: c.level,
  };
  return (
    <div>
      <JsonLd data={ld} />
      <section className="relative -mt-16 overflow-hidden">
        <div className="grain absolute inset-0">
          <Image src={c.cover} alt="" fill priority sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-black/60 to-black/40" />
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-32 sm:px-6">
          <Link href="/retos" className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="size-4" /> Retos
          </Link>
          <h1 className="mt-6 font-athletic text-6xl font-extrabold uppercase italic leading-[0.9] sm:text-8xl">{c.name}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">{c.description}</p>
          <Link href={`/panel/retos/${c.slug}`} className="mt-8 inline-flex h-14 items-center gap-2 rounded-2xl bg-accent px-7 font-bold text-accent-ink">
            Empezar el reto gratis <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-2xl font-semibold">Calendario del reto</h2>
        <p className="mt-1 text-muted">Cada 4 días hay un día de descanso para que tus músculos se recuperen.</p>
        <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: CHALLENGE_DAYS }, (_, i) => i + 1).map((d) => (
            <div key={d} className={`grid aspect-square place-items-center rounded-xl border text-sm font-semibold ${isRestDay(d) ? "border-line text-muted" : "border-line bg-surface"}`}>
              {isRestDay(d) ? <Moon className="size-4" aria-label="Descanso" /> : d}
            </div>
          ))}
        </div>
        <h2 className="mt-14 font-display text-2xl font-semibold">Día 1</h2>
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
          {day1.items.map((it) => {
            const e = EXERCISE_BY_SLUG[it.slug];
            return (
              <li key={it.slug}>
                <Link href={`/ejercicios/${e.slug}`} className="flex items-center gap-4 p-4 hover:bg-white/[0.02]">
                  <Image src={exerciseImages(e)[1]} alt={e.name} width={96} height={64} className="h-14 w-20 rounded-xl bg-white object-cover" />
                  <span className="flex-1 font-medium">{e.name}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {it.sets} × {it.seconds ? `${it.seconds} s` : it.reps}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
