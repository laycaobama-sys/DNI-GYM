import { seoDesc, seoTitle } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Calculator } from "@/components/calculators";
import { JsonLd } from "@/components/json-ld";
import { CALCULATORS, getCalculator } from "@/data/calculators";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/calculadoras/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = getCalculator(slug);
  if (!c) return {};
  return { title: seoTitle(c.title), description: seoDesc(c.description), alternates: { canonical: `/calculadoras/${c.slug}` } };
}

export default async function CalculatorPage({ params }: PageProps<"/calculadoras/[slug]">) {
  const { slug } = await params;
  const c = getCalculator(slug);
  if (!c) notFound();
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: c.name,
      url: absoluteUrl(`/calculadoras/${c.slug}`),
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      inLanguage: "es",
      description: c.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={ld} />
      <Link href="/calculadoras" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Calculadoras
      </Link>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">{c.name}</h1>
      <p className="mt-4 text-lg text-ink-2">{c.intro}</p>
      <div className="mt-8">
        <Calculator kind={c.slug} />
      </div>
      <div className="mt-14 space-y-8">
        {c.explain.map((e) => (
          <section key={e.h}>
            <h2 className="font-display text-2xl font-semibold">{e.h}</h2>
            <p className="mt-3 leading-relaxed text-ink-2">{e.p}</p>
          </section>
        ))}
      </div>
      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">Preguntas frecuentes</h2>
        <div className="mt-6 space-y-3">
          {c.faq.map((f) => (
            <details key={f.q} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
      <nav className="mt-14 flex flex-wrap gap-2" aria-label="Otras calculadoras">
        {CALCULATORS.filter((x) => x.slug !== c.slug).map((x) => (
          <Link key={x.slug} href={`/calculadoras/${x.slug}`} className="rounded-full border border-line px-4 py-1.5 text-sm text-ink-2 hover:border-accent/40 hover:text-ink">
            {x.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
