import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  Cloud,
  Flame,
  Laptop,
  ListChecks,
  PlayCircle,
  Salad,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Target,
  Trophy,
  SlidersHorizontal,
  WifiOff,
  BellRing,
} from "lucide-react";
import { EXERCISES, GROUPS } from "@/data/exercises";
import { ROUTINES } from "@/data/routines";
import { CHALLENGES, GROUP_COVER, ROUTINE_COVER } from "@/data/challenges";
import { JsonLd } from "@/components/json-ld";
import { ActivityRings } from "@/components/landing/phone";
import { Showcase } from "@/components/landing/showcase";
import { StickyCta } from "@/components/landing/sticky-cta";
import { buttonClass } from "@/lib/cn";
import { SITE, absoluteUrl } from "@/lib/site";
import { HOME_FAQ } from "./faq";

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function SectionTitle({ eyebrow, title, text, center }: { eyebrow: string; title: React.ReactNode; text?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">{eyebrow}</p>
      <h2 className="mt-4 text-balance font-athletic text-5xl font-extrabold uppercase italic leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl">{title}</h2>
      {text && <p className="mt-5 text-lg leading-relaxed text-ink-2">{text}</p>}
    </div>
  );
}

const FEATURES = [
  { icon: PlayCircle, title: "Entreno guiado", text: "Demostración, cuenta atrás, descansos y aviso sonoro." },
  { icon: Salad, title: "Qué comer cada día", text: "Menú diario según tu objetivo, calorías y tipo de dieta." },
  { icon: SlidersHorizontal, title: "Sesión adaptable", text: "Por tiempo, gym o casa y molestias de hombro, rodilla o espalda." },
  { icon: ListChecks, title: "Registro en 1 toque", text: "Pesos precargados de tu última sesión y sugeridos por tu 1RM." },
  { icon: Trophy, title: "Récords y rachas", text: "Aviso al batir tu marca y racha semanal con comodín." },
  { icon: BarChart3, title: "Progreso que se ve", text: "Gráficas de fuerza, volumen, peso y series por músculo." },
  { icon: Target, title: "Retos de 30 días", text: "Abdominales, glúteos, flexiones y cuerpo completo." },
  { icon: WifiOff, title: "Funciona sin cobertura", text: "Entrena en el gimnasio aunque no haya conexión." },
  { icon: BellRing, title: "Recordatorios", text: "Tus días y hora de entreno en el calendario del móvil." },
  { icon: Cloud, title: "Guardado para siempre", text: "Todo en tu cuenta de Google, en móvil, tablet y PC." },
];

export default function HomePage() {
  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE.name,
    url: SITE.url,
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Fitness",
    operatingSystem: "Web, Android, iOS",
    inLanguage: "es",
    description: SITE.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", availability: "https://schema.org/InStock" },
    featureList: FEATURES.map((f) => f.title),
    publisher: { "@id": absoluteUrl("/#organization") },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  const programs = [
    ...CHALLENGES.map((c) => ({ href: `/retos/${c.slug}`, cover: c.cover, tag: "Reto 30 días", title: c.name.replace("Reto ", "").replace(" 30 días", ""), meta: `${c.focus} · ${c.level}` })),
    ...ROUTINES.map((r) => ({ href: `/rutinas/${r.slug}`, cover: ROUTINE_COVER(r.slug), tag: `${r.daysPerWeek} días/semana`, title: r.name, meta: `${r.goal} · ${r.level}` })),
  ];

  return (
    <>
      <JsonLd data={[appLd, faqLd]} />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative -mt-16 overflow-hidden bg-black">
        <div className="absolute inset-0 lg:left-[30%]">
          <div className="grain absolute inset-0 lg:[mask-image:linear-gradient(to_right,transparent,black_35%)]">
            <Image src="/brand/hero.webp" alt="Atleta entrenando con disco en el gimnasio" fill priority sizes="(max-width: 1024px) 100vw, 62vw" className="animate-ken object-cover object-[30%_20%]" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-black/10 lg:via-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-black/30 to-black/60" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_40%,rgb(198_255_61/0.12),transparent_70%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[88svh] max-w-7xl items-end gap-10 px-4 pb-14 pt-32 sm:px-6 lg:min-h-[94svh] lg:grid-cols-[1.15fr_1fr] lg:items-center lg:pb-20 lg:pt-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              Entrenador personal 100% gratis · Gym y casa
            </span>
            <h1 className="mt-6 font-athletic text-[clamp(3.6rem,13vw,8.5rem)] font-extrabold uppercase italic leading-[0.86] tracking-tight">
              Tu entrenador
              <br />
              personal.
              <br />
              <span className="text-accent">Gratis.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
              Te decimos qué entrenar y qué comer cada día según tu objetivo: ganar músculo, perder grasa o ponerte en forma. En el gimnasio o en casa sin material, con entreno guiado paso a paso.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-white px-7 text-base font-semibold text-[#111] shadow-[0_10px_40px_-10px_rgba(255,255,255,0.5)] transition hover:bg-white/90 active:scale-[0.99]">
                <GoogleG /> Empezar gratis con Google
              </Link>
              <Link href="/ejercicios" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-7 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10">
                Ver ejercicios <ArrowRight className="size-4" />
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
              {["Sin tarjeta", "Sin anuncios", "Móvil, tablet y PC"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 text-accent" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* tarjetas flotantes de la app */}
          <div className="relative hidden h-[520px] lg:block">
            <div className="glass absolute right-0 top-6 w-64 animate-float rounded-3xl p-5 shadow-2xl shadow-black/60">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Actividad de hoy</p>
              <div className="mt-3 flex items-center gap-4">
                <ActivityRings size={96} />
                <div className="space-y-1.5 text-sm">
                  <p><span className="font-bold text-accent">3/4</span> <span className="text-white/60">entrenos</span></p>
                  <p><span className="font-bold text-sky">142</span> <span className="text-white/60">min</span></p>
                  <p><span className="font-bold text-orange">1.840</span> <span className="text-white/60">kcal</span></p>
                </div>
              </div>
            </div>
            <div className="glass absolute left-0 top-[44%] w-60 animate-float-slow rounded-3xl p-5 shadow-2xl shadow-black/60 [animation-delay:1s]">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning">
                <Trophy className="size-4" /> Récord personal
              </p>
              <p className="mt-2 font-athletic text-4xl font-extrabold italic leading-none">
                102,5 <span className="text-lg not-italic text-white/60">kg</span>
              </p>
              <p className="text-sm text-white/60">Sentadilla · +7,5 kg en 8 semanas</p>
            </div>
            <div className="glass absolute bottom-4 right-10 flex w-56 animate-float items-center gap-3 rounded-2xl p-4 shadow-2xl shadow-black/60 [animation-delay:2s]">
              <span className="grid size-11 place-items-center rounded-xl bg-orange/15 text-orange">
                <Flame className="size-6" />
              </span>
              <div>
                <p className="font-display text-xl font-semibold">6 semanas</p>
                <p className="text-xs text-white/60">de racha entrenando</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-black/40 backdrop-blur">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 divide-white/10 px-4 sm:px-6 md:grid-cols-4 md:divide-x">
            {[
              [String(EXERCISES.length), "Ejercicios con técnica"],
              [String(CHALLENGES.length), "Retos de 30 días"],
              [String(ROUTINES.length), "Programas completos"],
              ["0 €", "Gratis, sin tarjeta"],
            ].map(([v, l]) => (
              <div key={l} className="py-6 md:px-8 md:first:pl-0">
                <dd className="font-athletic text-5xl font-extrabold italic leading-none text-white">{v}</dd>
                <dt className="mt-1 text-sm text-white/60">{l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ═══════════ MARQUEE ═══════════ */}
      <section className="overflow-hidden border-b border-line bg-accent py-4 text-accent-ink" aria-label="Ejercicios">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
          {[...EXERCISES.slice(0, 24), ...EXERCISES.slice(0, 24)].map((e, i) => (
            <span key={i} className="flex items-center gap-8 font-athletic text-2xl font-extrabold uppercase italic">
              {e.name} <span className="size-2 rotate-45 bg-accent-ink" />
            </span>
          ))}
        </div>
      </section>

      {/* ═══════════ APP SHOWCASE ═══════════ */}
      <section id="funciones" className="relative scroll-mt-20 overflow-hidden py-24 sm:py-32">
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle
            eyebrow="La app"
            title={
              <>
                Todo tu entreno.
                <br />
                <span className="text-accent">En tu bolsillo.</span>
              </>
            }
            text="Diseñada para usarse en el gimnasio con una mano: rápida, clara y sin distracciones."
          />
          <div className="mt-16">
            <Showcase />
          </div>
        </div>
      </section>

      {/* ═══════════ PROGRAMAS Y RETOS ═══════════ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-end">
          <SectionTitle eyebrow="Programas" title={<>Elige tu <span className="text-accent">objetivo</span></>} text="Retos de 30 días y programas completos para gimnasio o casa, de principiante a avanzado." />
          <Link href="/rutinas" className={buttonClass("outline", "md", "shrink-0")}>
            Ver todos <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:scroll-px-6 sm:px-6 xl:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]">
          {programs.map((p) => (
            <Link key={p.href} href={p.href} className="group relative aspect-[3/4] w-[72vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-surface sm:w-[300px]">
              <Image src={p.cover} alt="" fill sizes="300px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">{p.tag}</span>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-athletic text-3xl font-extrabold uppercase italic leading-[0.95]">{p.title}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-white/70">{p.meta}</p>
                  <span className="grid size-9 place-items-center rounded-full bg-white/10 backdrop-blur transition group-hover:bg-accent group-hover:text-accent-ink">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════ GRUPOS MUSCULARES ═══════════ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle eyebrow="Biblioteca" title={<>Entrena cada <span className="text-accent">músculo</span></>} text="Técnica paso a paso, músculos implicados, consejos y errores comunes de cada ejercicio." />
          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {GROUPS.map((g, i) => (
              <Link
                key={g.id}
                href={`/ejercicios?grupo=${g.id}`}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-surface ${i === 0 ? "col-span-2 aspect-[16/10] md:col-span-4 md:aspect-[21/8] lg:col-span-2 lg:row-span-2 lg:aspect-auto" : "aspect-[4/5]"}`}
              >
                <Image src={GROUP_COVER(g.id)} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                  <div>
                    <h3 className={`font-athletic font-extrabold uppercase italic leading-none ${i === 0 ? "text-5xl" : "text-3xl"}`}>{g.label}</h3>
                    <p className="mt-1 text-xs text-white/70">{EXERCISES.filter((e) => e.group === g.id).length} ejercicios</p>
                  </div>
                  <ArrowUpRight className="size-5 text-white/60 transition group-hover:text-accent" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FUNCIONES ═══════════ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
            <SectionTitle eyebrow="Todo incluido" title={<>Nivel pro.<br /><span className="text-accent">Precio cero.</span></>} text="Las funciones que normalmente están detrás de una suscripción, gratis para todos." />
            <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="group bg-bg p-6 transition-colors hover:bg-surface">
                  <f.icon className="size-6 text-accent transition-transform group-hover:scale-110" />
                  <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CÓMO FUNCIONA ═══════════ */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionTitle center eyebrow="Cómo funciona" title={<>Tu plan en <span className="text-accent">60 segundos</span></>} />
          <ol className="mt-16 grid gap-4 md:grid-cols-3">
            {[
              { n: "1", icon: Sparkles, t: "Entra con Google", d: "Sin formularios ni contraseñas. Tu cuenta gratuita se crea al instante." },
              { n: "2", icon: Target, t: "Cuéntanos tu objetivo", d: "Nivel, días, tiempo, gimnasio o casa, zonas a mejorar y cómo comes. Creamos tu plan de entreno y tu menú." },
              { n: "3", icon: PlayCircle, t: "Entrena y progresa", d: "Sigue el entreno guiado de cada día y mira cómo suben tus récords semana a semana." },
            ].map((s) => (
              <li key={s.n} className="relative overflow-hidden rounded-3xl border border-line bg-surface p-7">
                <span className="pointer-events-none absolute -right-2 -top-6 font-athletic text-[9rem] font-extrabold italic leading-none text-white/[0.04]">{s.n}</span>
                <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-ink">
                  <s.icon className="size-6" />
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══════════ DISPOSITIVOS ═══════════ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface">
            <div className="grid items-center lg:grid-cols-2">
              <div className="p-8 sm:p-12">
                <SectionTitle eyebrow="Donde quieras" title={<>Móvil, tablet <span className="text-accent">y PC</span></>} text="Empieza en el ordenador, entrena con el móvil y revisa tu progreso en la tablet. Todo sincronizado al instante con tu cuenta de Google." />
                <div className="mt-8 flex flex-wrap gap-3">
                  {[[Smartphone, "Móvil"], [Tablet, "Tablet"], [Laptop, "Ordenador"], [ShieldCheck, "Datos privados"]].map(([I, l]) => {
                    const Icon = I as typeof Smartphone;
                    return (
                      <span key={String(l)} className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink-2">
                        <Icon className="size-4 text-accent" /> {String(l)}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="relative h-72 lg:h-full lg:min-h-[460px]">
                <Image src="/brand/climber.webp" alt="Persona haciendo escaladores junto a una ventana" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent lg:bg-gradient-to-r" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionTitle center eyebrow="Dudas" title="Preguntas frecuentes" />
          <div className="mt-12 divide-y divide-line border-y border-line">
            {HOME_FAQ.map((f) => (
              <details key={f.q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {f.q}
                  <ChevronDown className="size-5 shrink-0 text-accent transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 leading-relaxed text-ink-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA FINAL ═══════════ */}
      <section className="relative overflow-hidden">
        <div className="grain absolute inset-0">
          <Image src="/brand/athlete-woman.webp" alt="" fill sizes="100vw" className="object-cover object-[50%_25%]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36">
          <h2 className="max-w-3xl font-athletic text-6xl font-extrabold uppercase italic leading-[0.88] sm:text-8xl">
            El mejor momento
            <br />
            <span className="text-accent">es hoy.</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg text-white/80">Crea tu cuenta gratis, responde 8 preguntas y empieza tu primer entreno guiado en menos de un minuto.</p>
          <Link href="/login" className="mt-10 inline-flex h-14 items-center gap-3 rounded-2xl bg-accent px-8 text-base font-bold text-accent-ink shadow-[0_10px_50px_-10px_rgb(198_255_61/0.7)] transition hover:scale-[1.02]">
            Crear mi plan gratis <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      <StickyCta />
    </>
  );
}
