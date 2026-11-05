import { seoDesc, seoTitle } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { EXERCISES, exerciseImages, getExercise, groupLabel } from "@/data/exercises";
import { ROUTINES } from "@/data/routines";
import { ExerciseDemo } from "@/components/exercise-demo";
import { ExerciseFacts, ExerciseMuscles, ExerciseSteps, YoutubeLink } from "@/components/exercise-detail";
import { ExerciseCard } from "@/components/exercise-browser";
import { JsonLd } from "@/components/json-ld";
import { buttonClass } from "@/lib/cn";
import { absoluteUrl } from "@/lib/site";
import { substitutes } from "@/lib/adapt";

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/ejercicios/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = getExercise(slug);
  if (!e) return {};
  const title = seoTitle(`${e.name}: técnica y errores`);
  const description = seoDesc(`Cómo hacer ${e.name.toLowerCase()} paso a paso: trabaja ${e.primary.join(", ").toLowerCase()}, series recomendadas ${e.prescription}, consejos, errores y variantes.`);
  return {
    title,
    description,
    alternates: { canonical: `/ejercicios/${e.slug}` },
    openGraph: { title, description, images: [{ url: exerciseImages(e)[1], width: 640, height: 427, alt: e.name }] },
  };
}

export default async function ExercisePage({ params }: PageProps<"/ejercicios/[slug]">) {
  const { slug } = await params;
  const e = getExercise(slug);
  if (!e) notFound();
  // Variantes: mismo grupo y mismo músculo principal, priorizando otro material (casa, máquina, polea…)
  const key = (m: string) => m.split(" ")[0].toLowerCase();
  const variants = EXERCISES.filter((x) => x.group === e.group && x.slug !== e.slug && x.primary.some((p) => e.primary.some((q) => key(p) === key(q))))
    .sort((a, b) => Number(a.equipment === e.equipment) - Number(b.equipment === e.equipment))
    .slice(0, 8);
  const related = EXERCISES.filter((x) => x.group === e.group && x.slug !== e.slug && !variants.includes(x)).slice(0, 4);
  const inRoutines = ROUTINES.filter((r) => r.days.some((d) => d.items.some((it) => it.slug === e.slug)));
  const [img0, img1] = exerciseImages(e);

  const alts = substitutes(e.slug).slice(0, 3);
  const faq = [
    { q: `¿Qué músculos trabaja ${e.name.toLowerCase()}?`, a: `Trabaja principalmente ${e.primary.join(", ").toLowerCase()}${e.secondary.length ? ` y, de forma secundaria, ${e.secondary.join(", ").toLowerCase()}` : ""}.` },
    { q: `¿Cuántas series y repeticiones de ${e.name.toLowerCase()} debo hacer?`, a: `Una recomendación general es ${e.prescription}, con 1–2 repeticiones en reserva. Es un ejercicio de nivel ${e.level}.` },
    { q: `¿Cuál es el error más común en ${e.name.toLowerCase()}?`, a: `${e.mistakes[0]} ${e.tips[0] ? `Consejo: ${e.tips[0]}` : ""}`.trim() },
    ...(alts.length ? [{ q: `¿Qué ejercicio puedo hacer en lugar de ${e.name.toLowerCase()}?`, a: `Alternativas para el mismo músculo: ${alts.map((x) => x.name).join(", ")}.` }] : []),
  ];

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `Cómo hacer ${e.name}`,
      description: `Técnica correcta de ${e.name}: músculos trabajados ${e.primary.join(", ")}.`,
      image: [absoluteUrl(img0), absoluteUrl(img1)],
      inLanguage: "es",
      tool: [{ "@type": "HowToTool", name: e.equipment }],
      step: e.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s, ...(i === 0 ? { image: absoluteUrl(img0) } : {}) })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Ejercicios", item: absoluteUrl("/ejercicios") },
        { "@type": "ListItem", position: 3, name: groupLabel(e.group), item: absoluteUrl(`/ejercicios?grupo=${e.group}`) },
        { "@type": "ListItem", position: 4, name: e.name, item: absoluteUrl(`/ejercicios/${e.slug}`) },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={ld} />
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Migas de pan">
        <Link href="/ejercicios" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="size-4" /> Ejercicios
        </Link>
        <span>/</span>
        <Link href={`/ejercicios?grupo=${e.group}`} className="hover:text-ink">
          {groupLabel(e.group)}
        </Link>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <ExerciseDemo exercise={e} priority className="rounded-3xl border border-line" sizes="(max-width: 1024px) 100vw, 55vw" showLabels />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[img0, img1].map((src, i) => (
              <figure key={src} className="overflow-hidden rounded-2xl border border-line bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${e.name} — ${i === 0 ? "posición inicial" : "posición final"}`} width={640} height={427} loading="lazy" className="aspect-[3/2] w-full object-cover" />
                <figcaption className="bg-surface px-3 py-2 text-xs text-muted">{i === 0 ? "1. Posición inicial" : "2. Posición final"}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">{groupLabel(e.group)}</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{e.name}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">
            Ejercicio de nivel <strong className="text-ink">{e.level}</strong> con {e.equipment} que trabaja principalmente{" "}
            {e.primary.join(", ").toLowerCase()}. Recomendación: <strong className="text-ink">{e.prescription}</strong>.
          </p>
          <div className="mt-6">
            <ExerciseFacts e={e} />
          </div>
          <div className="mt-6">
            <ExerciseMuscles e={e} map />
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/panel/entrenar" className={buttonClass("primary", "md")}>
              Registrar este ejercicio <ArrowRight className="size-4" />
            </Link>
            <YoutubeLink e={e} />
          </div>
        </div>
      </div>

      <div className="mt-14 max-w-4xl">
        <ExerciseSteps e={e} />
      </div>

      <section className="mt-14 max-w-4xl">
        <h2 className="font-display text-xl font-semibold">Preguntas frecuentes sobre {e.name.toLowerCase()}</h2>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {faq.map((f) => (
            <div key={f.q} className="py-4">
              <h3 className="font-semibold">{f.q}</h3>
              <p className="mt-1.5 leading-relaxed text-ink-2">{f.a}</p>
            </div>
          ))}
        </div>
        {alts.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {alts.map((x) => (
              <Link key={x.slug} href={`/ejercicios/${x.slug}`} className="rounded-full border border-line px-4 py-1.5 text-sm text-ink-2 hover:border-accent/40 hover:text-ink">
                {x.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {inRoutines.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold">Rutinas que incluyen este ejercicio</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {inRoutines.map((r) => (
              <Link key={r.slug} href={`/rutinas/${r.slug}`} className="rounded-full border border-line px-4 py-1.5 text-sm text-ink-2 hover:border-accent/40 hover:text-ink">
                {r.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {variants.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold">Variantes de {e.name.toLowerCase()}</h2>
          <p className="mt-1 text-sm text-muted">Mismo músculo principal con otro material o dificultad: ideales para cambiar el estímulo o entrenar en casa.</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {variants.map((r) => (
              <ExerciseCard key={r.slug} e={r} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold">Otros ejercicios de {groupLabel(e.group).toLowerCase()}</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <ExerciseCard key={r.slug} e={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
