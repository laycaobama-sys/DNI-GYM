import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Calculator,
  Check,
  Cloud,
  Dumbbell,
  Flame,
  LineChart,
  ListChecks,
  PlayCircle,
  Salad,
  ShieldCheck,
  Smartphone,
  Timer,
  Trophy,
} from "lucide-react";
import { EXERCISES, GROUPS, getExercise } from "@/data/exercises";
import { ROUTINES } from "@/data/routines";
import { ExerciseDemo } from "@/components/exercise-demo";
import { JsonLd } from "@/components/json-ld";
import { buttonClass } from "@/lib/cn";
import { SITE, absoluteUrl } from "@/lib/site";
import { HOME_FAQ } from "./faq";

const FEATURES = [
  {
    icon: ListChecks,
    title: "Registro de entrenamientos",
    text: "Anota series, repeticiones y kilos en segundos. Temporizador de descanso automático y tu marca anterior siempre a la vista.",
  },
  {
    icon: LineChart,
    title: "Progreso y récords",
    text: "Gráficas de fuerza (1RM estimado), volumen semanal, series por grupo muscular y récords personales automáticos.",
  },
  {
    icon: Salad,
    title: "Nutrición y macros",
    text: "Contador de calorías con +100 alimentos, objetivos de proteína, carbohidratos y grasas calculados para ti y control de agua.",
  },
  {
    icon: PlayCircle,
    title: "Técnica de cada ejercicio",
    text: "84 ejercicios con demostración visual, pasos, músculos trabajados, consejos y errores comunes que debes evitar.",
  },
  {
    icon: Activity,
    title: "Peso y medidas",
    text: "Registra tu peso, % de grasa y perímetros. Visualiza la tendencia real y lo que te falta para tu objetivo.",
  },
  {
    icon: Cloud,
    title: "En la nube con Google",
    text: "Inicia sesión con Google en un clic. Tus datos se guardan de forma segura y los tienes en el móvil, la tablet o el ordenador.",
  },
];

const STEPS = [
  { n: "01", title: "Entra con Google", text: "Sin formularios ni contraseñas. Tu cuenta se crea al instante y es gratis." },
  { n: "02", title: "Configura tu objetivo", text: "Perder grasa, ganar músculo o mantenerte: calculamos tus calorías y macros." },
  { n: "03", title: "Entrena y registra", text: "Elige una rutina o crea la tuya y registra cada serie desde el móvil." },
  { n: "04", title: "Mide tu evolución", text: "Récords, gráficas y tendencias para saber si estás progresando de verdad." },
];

export default function HomePage() {
  const showcase = ["sentadilla-con-barra", "hip-thrust", "press-banca-con-barra", "dominadas", "elevaciones-laterales", "peso-muerto-rumano"]
    .map((s) => getExercise(s)!)
    .filter(Boolean);
  const heroEx = getExercise("sentadilla-con-barra")!;

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

  return (
    <>
      <JsonLd data={[appLd, faqLd]} />

      {/* ─────────── HERO ─────────── */}
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
        <div className="glow pointer-events-none absolute inset-x-0 top-0 h-[600px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <span className="size-1.5 rounded-full bg-accent" /> 100% gratis · Sin tarjeta · Acceso con Google
            </span>
            <h1 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Entrena con método.
              <br />
              <span className="text-gradient">Mide cada progreso.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
              La app de gimnasio y fitness gratuita que reúne <strong className="text-ink">rutinas</strong>,{" "}
              <strong className="text-ink">84 ejercicios con técnica</strong>, registro de entrenamientos, seguimiento de peso y{" "}
              <strong className="text-ink">nutrición con macros</strong>. Todo en un único lugar, en tu móvil y en tu ordenador.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className={buttonClass("primary", "lg")}>
                Empezar gratis con Google <ArrowRight className="size-4" />
              </Link>
              <Link href="/ejercicios" className={buttonClass("outline", "lg")}>
                Ver ejercicios
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
              {["Sin anuncios", "Datos en la nube", "Funciona en móvil"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 text-accent" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Mockup de la app */}
          <div className="relative animate-fade-up [animation-delay:150ms]">
            <div className="absolute -inset-6 rounded-[2rem] bg-accent/10 blur-3xl" />
            <div className="card relative overflow-hidden rounded-3xl p-4 shadow-2xl shadow-black/60 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">Hoy · Pierna 1</p>
                  <p className="font-display text-lg font-semibold">Sentadilla con barra</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-surface-3 px-3 py-1 text-xs font-medium tabular-nums">
                  <Timer className="size-3.5 text-accent" /> 01:30
                </span>
              </div>
              <ExerciseDemo exercise={heroEx} priority className="mt-4 rounded-2xl" sizes="(max-width: 1024px) 100vw, 40vw" showLabels />
              <div className="mt-4 grid grid-cols-[auto_1fr_1fr_auto] items-center gap-x-3 gap-y-2 text-sm">
                <span className="text-xs text-muted">Serie</span>
                <span className="text-xs text-muted">Kg</span>
                <span className="text-xs text-muted">Reps</span>
                <span />
                {[
                  [1, 80, 8, true],
                  [2, 80, 8, true],
                  [3, 82.5, 6, false],
                ].map(([n, kg, r, done]) => (
                  <div key={String(n)} className="contents">
                    <span className="grid size-7 place-items-center rounded-lg bg-surface-3 text-xs font-semibold">{n}</span>
                    <span className="rounded-lg bg-surface-2 px-3 py-1.5 tabular-nums">{kg}</span>
                    <span className="rounded-lg bg-surface-2 px-3 py-1.5 tabular-nums">{r}</span>
                    <span
                      className={`grid size-7 place-items-center rounded-lg ${done ? "bg-accent text-accent-ink" : "border border-line-strong text-muted"}`}
                    >
                      <Check className="size-4" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card absolute -bottom-12 -left-8 hidden w-56 rounded-2xl p-4 shadow-xl shadow-black/50 sm:block">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Trophy className="size-3.5 text-warning" /> Nuevo récord personal
              </p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                102,5 <span className="text-sm text-muted">kg 1RM</span>
              </p>
              <p className="text-xs text-good">+7,5 kg en 8 semanas</p>
            </div>
            <div className="card absolute -right-8 top-[42%] hidden w-44 rounded-2xl p-4 shadow-xl shadow-black/50 sm:block">
              <p className="text-xs text-muted">Volumen semanal</p>
              <div className="mt-3 flex h-14 items-end gap-1.5">
                {[38, 52, 47, 60, 58, 71, 76, 88].map((h, i) => (
                  <span key={i} className="flex-1 rounded-t-[3px] bg-accent" style={{ height: `${h}%`, opacity: 0.35 + i * 0.08 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── MARQUEE ─────────── */}
      <section className="overflow-hidden border-y border-line bg-surface/50 py-5" aria-label="Grupos musculares">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
          {[...EXERCISES.slice(0, 30), ...EXERCISES.slice(0, 30)].map((e, i) => (
            <span key={i} className="flex items-center gap-3 font-display text-lg font-semibold text-ink-2/70">
              <Dumbbell className="size-4 text-accent" /> {e.name}
            </span>
          ))}
        </div>
      </section>

      {/* ─────────── CIFRAS ─────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            [String(EXERCISES.length), "ejercicios con técnica explicada"],
            [String(ROUTINES.length), "programas de entrenamiento listos"],
            ["+100", "alimentos con calorías y macros"],
            ["0 €", "gratis, sin tarjeta ni permanencia"],
          ].map(([v, l]) => (
            <div key={l} className="card p-6">
              <dt className="sr-only">{l}</dt>
              <dd className="font-display text-4xl font-bold tracking-tight text-accent">{v}</dd>
              <dd className="mt-1 text-sm text-muted">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ─────────── FUNCIONES ─────────── */}
      <section id="funciones" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Todo lo que necesitas</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">Una app profesional. Sin pagar nada.</h2>
          <p className="mt-4 text-lg text-ink-2">
            Herramientas de nivel profesional para entrenar mejor, comer mejor y ver resultados, tanto si empiezas hoy como si llevas
            años en el gimnasio.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="card group p-6 transition-colors hover:border-line-strong">
              <div className="grid size-11 place-items-center rounded-xl bg-accent/10 text-accent transition-transform group-hover:scale-110">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─────────── EJERCICIOS ─────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Biblioteca de ejercicios</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">Aprende la técnica correcta</h2>
            <p className="mt-4 text-lg text-ink-2">
              Cada ejercicio incluye demostración visual, ejecución paso a paso, músculos implicados, series recomendadas y los
              errores más comunes.
            </p>
          </div>
          <Link href="/ejercicios" className={buttonClass("outline", "md")}>
            Ver los {EXERCISES.length} ejercicios <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showcase.map((e) => (
            <Link key={e.slug} href={`/ejercicios/${e.slug}`} className="card group overflow-hidden transition-colors hover:border-accent/40">
              <ExerciseDemo exercise={e} />
              <div className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold">{e.name}</h3>
                  <p className="text-sm text-muted">{e.primary.join(", ")}</p>
                </div>
                <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <Link
              key={g.id}
              href={`/ejercicios?grupo=${g.id}`}
              className="rounded-full border border-line px-4 py-1.5 text-sm text-ink-2 transition-colors hover:border-accent/40 hover:text-ink"
            >
              {g.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────── CÓMO FUNCIONA ─────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="card relative overflow-hidden p-8 sm:p-12">
          <div className="glow pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Cómo funciona</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Empieza en menos de 1 minuto</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-4">
              {STEPS.map((s) => (
                <li key={s.n}>
                  <span className="font-display text-sm font-bold text-accent">{s.n}</span>
                  <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ─────────── RUTINAS ─────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Programas</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">Rutinas diseñadas para resultados</h2>
          <p className="mt-4 text-lg text-ink-2">Elige tu programa según tu nivel, objetivo y días disponibles, y empieza a registrarlo con un clic.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ROUTINES.map((r) => (
            <Link key={r.slug} href={`/rutinas/${r.slug}`} className="card group flex flex-col p-6 transition-colors hover:border-accent/40">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-accent capitalize">{r.level}</span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-ink-2 capitalize">{r.goal}</span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-ink-2 capitalize">{r.place}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{r.name}</h3>
              <p className="mt-1 text-sm text-muted">{r.tagline}</p>
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-2">{r.description}</p>
              <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-semibold text-accent">
                Ver rutina <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────── CALCULADORAS ─────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { href: "/calculadoras/calorias", icon: Flame, t: "Calorías diarias", d: "Gasto calórico (TDEE) y calorías para tu objetivo." },
            { href: "/calculadoras/macros", icon: BarChart3, t: "Macronutrientes", d: "Proteína, carbohidratos y grasas en gramos." },
            { href: "/calculadoras/imc", icon: Calculator, t: "IMC", d: "Índice de masa corporal y rango de peso saludable." },
            { href: "/calculadoras/1rm", icon: Dumbbell, t: "1RM", d: "Tu repetición máxima y tabla de porcentajes." },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="card group p-6 transition-colors hover:border-accent/40">
              <c.icon className="size-6 text-accent" />
              <h3 className="mt-4 font-display text-lg font-semibold">Calculadora de {c.t}</h3>
              <p className="mt-1 text-sm text-muted">{c.d}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────── CONFIANZA ─────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Tus datos, protegidos", d: "Acceso seguro con Google. Nadie más puede ver tus entrenos. Puedes exportarlos o borrarlos cuando quieras." },
            { icon: Smartphone, t: "Pensada para el móvil", d: "Diseñada para usarse en el gimnasio con una mano. También funciona perfecta en tablet y ordenador." },
            { icon: Trophy, t: "Basada en evidencia", d: "Fórmulas validadas (Mifflin-St Jeor, Epley) y recomendaciones de volumen y proteína actuales." },
          ].map((c) => (
            <div key={c.t} className="flex gap-4 p-2">
              <c.icon className="mt-0.5 size-6 shrink-0 text-accent" />
              <div>
                <h3 className="font-semibold">{c.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{c.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── FAQ ─────────── */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">Preguntas frecuentes</h2>
        <div className="mt-10 space-y-3">
          {HOME_FAQ.map((f) => (
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

      {/* ─────────── CTA FINAL ─────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-accent px-6 py-14 text-center text-accent-ink sm:px-12 sm:py-20">
          <div className="grid-bg absolute inset-0 opacity-40 mix-blend-multiply" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">Tu mejor versión empieza hoy.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg font-medium opacity-80">
              Crea tu cuenta gratuita con Google y registra tu primer entrenamiento en menos de un minuto.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-accent-ink px-7 font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              Empezar gratis <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
