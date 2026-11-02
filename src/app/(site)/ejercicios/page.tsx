import type { Metadata } from "next";
import { ExerciseBrowser } from "@/components/exercise-browser";
import { JsonLd } from "@/components/json-ld";
import { EXERCISES, GROUPS } from "@/data/exercises";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ejercicios de gimnasio con imágenes y técnica paso a paso",
  description: `Biblioteca gratuita de ${EXERCISES.length} ejercicios de gimnasio y en casa con demostración visual, técnica correcta paso a paso, músculos trabajados, series recomendadas y errores comunes. Pecho, espalda, piernas, glúteos, hombros, brazos y abdomen.`,
  alternates: { canonical: "/ejercicios" },
  keywords: ["ejercicios de gimnasio", "ejercicios con imágenes", "técnica de ejercicios", "ejercicios para glúteos", "ejercicios de pecho", "ejercicios en casa"],
};

export default function ExercisesPage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Biblioteca de ejercicios DNI GYM",
    url: absoluteUrl("/ejercicios"),
    inLanguage: "es",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: EXERCISES.length,
      itemListElement: EXERCISES.map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/ejercicios/${e.slug}`),
        name: e.name,
      })),
    },
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={ld} />
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">Biblioteca</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Ejercicios de gimnasio</h1>
      <p className="mt-4 max-w-3xl text-lg text-ink-2">
        {EXERCISES.length} ejercicios con demostración visual y técnica explicada paso a paso. Filtra por grupo muscular,
        equipamiento o nivel y aprende a ejecutarlos de forma segura y eficaz.
      </p>
      <div className="mt-10">
        <ExerciseBrowser />
      </div>
      <section className="mt-20 grid gap-6 md:grid-cols-3">
        {GROUPS.map((g) => (
          <div key={g.id}>
            <h2 className="font-display text-lg font-semibold">Ejercicios de {g.label.toLowerCase()}</h2>
            <p className="mt-1 text-sm text-muted">{g.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
