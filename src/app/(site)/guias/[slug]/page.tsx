import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Zap } from "lucide-react";
import { GUIDES, getGuide } from "@/data/guides";
import { getExercise } from "@/data/exercises";
import { getRoutine } from "@/data/routines";
import { getChallenge } from "@/data/challenges";
import { getCalculator } from "@/data/calculators";
import { JsonLd } from "@/components/json-ld";
import { SITE, absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guias/${g.slug}` },
    openGraph: { type: "article", title: g.title, description: g.description, images: [{ url: g.cover }] },
  };
}

export default async function GuidePage({ params }: PageProps<"/guias/[slug]">) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) notFound();
  const links = [
    ...(g.related.routines ?? []).map((s) => ({ href: `/rutinas/${s}`, label: getRoutine(s)?.name ?? s, tag: "Rutina" })),
    ...(g.related.challenges ?? []).map((s) => ({ href: `/retos/${s}`, label: getChallenge(s)?.name ?? s, tag: "Reto" })),
    ...(g.related.calculators ?? []).map((s) => ({ href: `/calculadoras/${s}`, label: getCalculator(s)?.name ?? s, tag: "Calculadora" })),
    ...(g.related.exercises ?? []).map((s) => ({ href: `/ejercicios/${s}`, label: getExercise(s)?.name ?? s, tag: "Ejercicio" })),
  ];
  const url = absoluteUrl(`/guias/${g.slug}`);
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.title,
      description: g.description,
      image: [absoluteUrl(g.cover)],
      inLanguage: "es",
      mainEntityOfPage: url,
      datePublished: "2026-11-03",
      dateModified: "2026-11-03",
      author: { "@type": "Organization", name: SITE.name, url: SITE.url },
      publisher: { "@id": absoluteUrl("/#organization") },
      abstract: g.answer,
      speakable: { "@type": "SpeakableSpecification", cssSelector: ["#respuesta-rapida"] },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [{ q: g.title.split(":")[0], a: g.answer }, ...g.faq].map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Guías", item: absoluteUrl("/guias") },
        { "@type": "ListItem", position: 3, name: g.title, item: url },
      ],
    },
  ];
  return (
    <article>
      <JsonLd data={ld} />
      <header className="relative -mt-16 overflow-hidden">
        <div className="grain absolute inset-0">
          <Image src={g.cover} alt="" fill priority sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-black/70 to-black/50" />
        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-32 sm:px-6">
          <Link href="/guias" className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="size-4" /> Guías
          </Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            {g.category} · {g.minutes} min de lectura
          </p>
          <h1 className="mt-3 text-balance font-display text-3xl font-bold leading-tight sm:text-5xl">{g.title}</h1>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div id="respuesta-rapida" className="rounded-3xl border border-accent/30 bg-accent/[0.06] p-6">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
            <Zap className="size-4" /> Respuesta rápida
          </p>
          <p className="mt-2 text-lg leading-relaxed">{g.answer}</p>
        </div>
        <div className="mt-10 space-y-10">
          {g.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-2xl font-semibold">{s.h}</h2>
              {s.p.map((p, i) => (
                <p key={i} className="mt-3 leading-relaxed text-ink-2">
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="mt-4 space-y-2">
                  {s.list.map((l) => (
                    <li key={l} className="flex gap-2.5 text-ink-2">
                      <Check className="mt-1 size-4 shrink-0 text-accent" /> {l}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">Preguntas frecuentes</h2>
          <div className="mt-5 divide-y divide-line border-y border-line">
            {g.faq.map((f) => (
              <div key={f.q} className="py-5">
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-2 leading-relaxed text-ink-2">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
        {links.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-xl font-semibold">Pásalo a la práctica</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 hover:border-accent/40">
                  <span>
                    <span className="block text-xs text-muted">{l.tag}</span>
                    <span className="font-medium">{l.label}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-accent" />
                </Link>
              ))}
            </div>
          </section>
        )}
        <div className="mt-14 rounded-3xl bg-accent p-8 text-accent-ink">
          <p className="font-athletic text-4xl font-extrabold uppercase italic leading-none">Tu plan, hecho para ti</p>
          <p className="mt-2 font-medium opacity-80">Responde 10 preguntas y DNI GYM te da tu plan de entreno y tu menú diario. Gratis.</p>
          <Link href="/login" className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-accent-ink px-6 font-semibold text-white">
            Crear mi plan gratis <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
