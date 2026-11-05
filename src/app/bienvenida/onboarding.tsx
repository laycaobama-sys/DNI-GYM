"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, Droplets, Flame, Home, Minus, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useData } from "@/components/data-provider";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";
import { ACTIVITY_FACTORS, computeNutritionGoals, dayKey, fmtNumber } from "@/lib/fitness";
import { recommendRoutine } from "@/lib/plan";
import { ROUTINE_COVER } from "@/data/challenges";
import type { Activity, Goal, Sex, UserProfile } from "@/lib/types";
import { DIET_LABELS, type Diet } from "@/lib/meals";

type GoalChoice = "perder" | "ganar" | "tonificar" | "salud";
type LevelChoice = NonNullable<UserProfile["level"]>;

const GOALS: { id: GoalChoice; title: string; text: string; img: string }[] = [
  { id: "perder", title: "Perder grasa", text: "Adelgazar y marcar", img: "/brand/kettlebell.webp" },
  { id: "ganar", title: "Ganar músculo", text: "Más fuerza y volumen", img: "/brand/hero.webp" },
  { id: "tonificar", title: "Tonificar", text: "Definir y dar forma", img: "/brand/athlete-woman.webp" },
  { id: "salud", title: "Estar en forma", text: "Salud y energía", img: "/brand/jump.webp" },
];

const AREAS = [
  { id: "pecho", label: "Pecho" },
  { id: "espalda", label: "Espalda" },
  { id: "hombros", label: "Hombros" },
  { id: "brazos", label: "Brazos" },
  { id: "abdomen", label: "Abdomen" },
  { id: "gluteos", label: "Glúteos" },
  { id: "piernas", label: "Piernas" },
];

const LEVELS: { id: LevelChoice; title: string; text: string; bars: number }[] = [
  { id: "principiante", title: "Principiante", text: "Nunca he entrenado o hace mucho que no lo hago", bars: 1 },
  { id: "intermedio", title: "Intermedio", text: "Entreno de forma regular desde hace unos meses", bars: 2 },
  { id: "avanzado", title: "Avanzado", text: "Llevo más de un año entrenando con constancia", bars: 3 },
];

function Choice({ selected, onClick, children, className }: { selected: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative rounded-2xl border p-4 text-left transition-all active:scale-[0.99]",
        selected ? "border-accent bg-accent/[0.08] shadow-[0_0_0_1px_var(--color-accent)]" : "border-line bg-surface hover:border-line-strong",
        className,
      )}
    >
      {children}
      {selected && (
        <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-accent text-accent-ink">
          <Check className="size-4" />
        </span>
      )}
    </button>
  );
}

function BigNumber({ label, value, onChange, unit, step = 1, min, max }: { label: string; value: number; onChange: (v: number) => void; unit: string; step?: number; min: number; max: number }) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 10) / 10));
  return (
    <div className="rounded-3xl border border-line bg-surface p-5">
      <p className="text-center text-sm font-medium text-muted">{label}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button type="button" onClick={() => onChange(clamp(value - step))} className="grid size-12 place-items-center rounded-2xl bg-white/5 active:scale-95" aria-label={`Menos ${label}`}>
          <Minus className="size-5" />
        </button>
        <label className="flex items-baseline gap-1">
          <input
            type="number"
            inputMode="decimal"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            onBlur={() => onChange(clamp(value))}
            className="w-28 bg-transparent text-center font-athletic text-6xl font-extrabold italic tabular-nums outline-none"
            aria-label={label}
          />
          <span className="text-lg text-muted">{unit}</span>
        </label>
        <button type="button" onClick={() => onChange(clamp(value + step))} className="grid size-12 place-items-center rounded-2xl bg-white/5 active:scale-95" aria-label={`Más ${label}`}>
          <Plus className="size-5" />
        </button>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="mt-5 w-full accent-[var(--color-accent)]" aria-label={`${label} (deslizador)`} />
    </div>
  );
}

function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-balance font-athletic text-5xl font-extrabold uppercase italic leading-[0.92] sm:text-6xl">{children}</h1>
      {sub && <p className="mt-3 text-ink-2">{sub}</p>}
    </div>
  );
}

export function Onboarding() {
  const { profile, updateProfile } = useAuth();
  const { saveBodyLog, latestWeight } = useData();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<GoalChoice[]>([]);
  const goal: GoalChoice | null = goals[0] ?? null;
  const [sex, setSex] = useState<Sex | null>(profile?.sex ?? null);
  const [age, setAge] = useState(profile?.birthYear ? new Date().getFullYear() - profile.birthYear : 28);
  const [height, setHeight] = useState(profile?.heightCm ?? 172);
  const [weight, setWeight] = useState(latestWeight ?? 72);
  const [target, setTarget] = useState(profile?.targetWeight ?? latestWeight ?? 68);
  const [level, setLevel] = useState<LevelChoice | null>(profile?.level ?? null);
  const [places, setPlaces] = useState<("gimnasio" | "casa")[]>(profile?.places ?? (profile?.place ? [profile.place] : []));
  const place = places[0] ?? null;
  const [days, setDays] = useState(profile?.weeklyWorkoutsGoal ?? 3);
  const [areas, setAreas] = useState<string[]>(profile?.focusAreas ?? []);
  const [activity, setActivity] = useState<Activity>(profile?.activity ?? "ligero");
  const [diet, setDiet] = useState<Diet>((profile?.diet as Diet) ?? "omnivora");
  const [minutes, setMinutes] = useState(profile?.sessionMinutes ?? 45);
  const [genStep, setGenStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const g: Goal = goal === "perder" ? "perder" : goal === "ganar" ? "ganar" : "mantener";
  const partial: Partial<UserProfile> = { sex: sex ?? "hombre", birthYear: new Date().getFullYear() - age, heightCm: height, activity, goal: g, level: level ?? "principiante", place: place ?? "gimnasio", weeklyWorkoutsGoal: days, focusAreas: areas, diet, sessionMinutes: minutes, goals, places };
  const nutrition = useMemo(() => computeNutritionGoals(partial, weight), [sex, age, height, activity, g, weight]); // eslint-disable-line react-hooks/exhaustive-deps
  const routine = useMemo(() => recommendRoutine(partial), [g, level, place, days, areas]); // eslint-disable-line react-hooks/exhaustive-deps

  const STEPS = ["goal", "sex", "body", "target", "level", "place", "days", "areas", "activity", "diet", "generating", "result"] as const;
  const key = STEPS[step];
  const progress = Math.min(1, step / (STEPS.length - 2));

  const canNext =
    (key === "goal" && goal) ||
    (key === "sex" && sex) ||
    key === "body" ||
    key === "target" ||
    (key === "level" && level) ||
    (key === "place" && place) ||
    key === "days" ||
    key === "areas" ||
    key === "activity" ||
    key === "diet";

  // animación "creando tu plan"
  useEffect(() => {
    if (key !== "generating") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGenStep(0);
    const ts = [600, 1300, 2000, 2700].map((ms, i) => setTimeout(() => setGenStep(i + 1), ms));
    const done = setTimeout(() => setStep((s) => s + 1), 3300);
    return () => {
      ts.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [key]);


  const finish = async () => {
    setSaving(true);
    try {
      await updateProfile({
        ...partial,
        targetWeight: target,
        planSlug: routine.slug,
        onboarded: true,
        ...(nutrition ? { calorieGoal: nutrition.calorieGoal, proteinGoal: nutrition.proteinGoal, carbsGoal: nutrition.carbsGoal, fatGoal: nutrition.fatGoal, waterGoal: nutrition.waterGoal } : {}),
      });
      await saveBodyLog({ id: dayKey(), date: dayKey(), weight });
      router.replace("/panel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 bg-bg/90 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-4 pb-3">
          {step > 0 && key !== "generating" && key !== "result" ? (
            <button onClick={() => setStep((s) => s - 1)} className="grid size-10 place-items-center rounded-full bg-white/5" aria-label="Atrás">
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <Logo />
          )}
          {key !== "result" && (
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </div>
      </header>

      <main key={key} className="mx-auto w-full max-w-2xl flex-1 animate-fade-up px-4 pb-36 pt-6 sm:px-6">
        {key === "goal" && (
          <>
            <Title sub={`Hola${profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}. Responde unas preguntas rápidas y crearemos tu plan personalizado. Puedes elegir hasta 2 objetivos.`}>¿Cuál es tu objetivo?</Title>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setGoals((gs) => (gs.includes(o.id) ? gs.filter((x) => x !== o.id) : [...gs, o.id].slice(-2)))}
                  aria-pressed={goals.includes(o.id)}
                  className={cn("group relative aspect-[4/5] overflow-hidden rounded-3xl border text-left transition-all", goals.includes(o.id) ? "border-accent shadow-[0_0_0_2px_var(--color-accent)]" : "border-white/10")}
                >
                  <Image src={o.img} alt="" fill sizes="(max-width: 640px) 50vw, 320px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-athletic text-3xl font-extrabold uppercase italic leading-none">{o.title}</p>
                    <p className="mt-1 text-sm text-white/70">{o.text}</p>
                  </div>
                  {goals.includes(o.id) && (
                    <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-ink">
                      {goals.length > 1 ? goals.indexOf(o.id) + 1 : <Check className="size-4" />}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {key === "sex" && (
          <>
            <Title sub="Lo usamos para calcular tu metabolismo y tus calorías.">¿Cuál es tu sexo?</Title>
            <div className="grid grid-cols-2 gap-3">
              {(["hombre", "mujer"] as Sex[]).map((v) => (
                <Choice key={v} selected={sex === v} onClick={() => setSex(v)} className="py-10 text-center">
                  <span className="font-athletic text-4xl font-extrabold uppercase italic">{v === "hombre" ? "Hombre" : "Mujer"}</span>
                </Choice>
              ))}
            </div>
          </>
        )}

        {key === "body" && (
          <>
            <Title sub="Puedes cambiarlo cuando quieras desde tu perfil.">Tus datos</Title>
            <div className="space-y-4">
              <BigNumber label="Edad" value={age} onChange={setAge} unit="años" min={14} max={90} />
              <BigNumber label="Altura" value={height} onChange={setHeight} unit="cm" min={130} max={220} />
              <BigNumber label="Peso actual" value={weight} onChange={setWeight} unit="kg" step={0.5} min={35} max={200} />
            </div>
          </>
        )}

        {key === "target" && (
          <>
            <Title sub="Una meta clara multiplica tus probabilidades de conseguirla.">¿Cuál es tu peso objetivo?</Title>
            <BigNumber label="Peso objetivo" value={target} onChange={setTarget} unit="kg" step={0.5} min={35} max={200} />
            <p className="mt-4 rounded-2xl border border-line bg-surface p-4 text-sm text-ink-2">
              {target === weight
                ? "Mantener tu peso mientras ganas fuerza y definición es un objetivo excelente."
                : `Objetivo: ${target < weight ? "perder" : "ganar"} ${fmtNumber(Math.abs(weight - target), 1)} kg. A un ritmo saludable (~${target < weight ? "0,5" : "0,25"} kg/semana) son unas ${Math.ceil(Math.abs(weight - target) / (target < weight ? 0.5 : 0.25))} semanas.`}
            </p>
          </>
        )}

        {key === "level" && (
          <>
            <Title>¿Cuál es tu nivel?</Title>
            <div className="space-y-3">
              {LEVELS.map((l) => (
                <Choice key={l.id} selected={level === l.id} onClick={() => setLevel(l.id)} className="flex w-full items-center gap-4 p-5">
                  <span className="flex h-8 items-end gap-1">
                    {[1, 2, 3].map((b) => (
                      <span key={b} className={cn("w-2 rounded-sm", b <= l.bars ? "bg-accent" : "bg-white/10")} style={{ height: `${b * 33}%` }} />
                    ))}
                  </span>
                  <span>
                    <span className="block font-display text-lg font-semibold">{l.title}</span>
                    <span className="text-sm text-muted">{l.text}</span>
                  </span>
                </Choice>
              ))}
            </div>
          </>
        )}

        {key === "place" && (
          <>
            <Title sub="Puedes elegir los dos: te prepararemos entrenos para el gimnasio y para casa.">¿Dónde vas a entrenar?</Title>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "gimnasio" as const, label: "Gimnasio", text: "Máquinas, barras y mancuernas", icon: Building2 },
                { id: "casa" as const, label: "En casa", text: "Sin material o con poco equipo", icon: Home },
              ].map((o) => (
                <Choice key={o.id} selected={places.includes(o.id)} onClick={() => setPlaces((ps) => (ps.includes(o.id) ? ps.filter((x) => x !== o.id) : [...ps, o.id]))} className="p-6">
                  <o.icon className="size-8 text-accent" />
                  <p className="mt-4 font-athletic text-3xl font-extrabold uppercase italic">{o.label}</p>
                  <p className="text-sm text-muted">{o.text}</p>
                </Choice>
              ))}
            </div>
          </>
        )}

        {key === "days" && (
          <>
            <Title sub="Sé realista: la constancia gana a la intensidad.">¿Cuántos días por semana?</Title>
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map((d) => (
                <Choice key={d} selected={days === d} onClick={() => setDays(d)} className="py-6 text-center">
                  <span className="font-athletic text-5xl font-extrabold italic">{d}</span>
                </Choice>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-muted">{days <= 3 ? "Ideal para empezar o con poco tiempo." : days === 4 ? "El equilibrio perfecto entre resultados y descanso." : "Alto volumen: asegúrate de dormir y comer bien."}</p>
          </>
        )}

        {key === "areas" && (
          <>
            <Title sub="Elige una o varias. Daremos prioridad a estas zonas.">¿Qué zonas quieres mejorar?</Title>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAreas(areas.length === AREAS.length ? [] : AREAS.map((a) => a.id))}
                className={cn("rounded-full border px-5 py-3 text-sm font-semibold", areas.length === AREAS.length ? "border-accent bg-accent text-accent-ink" : "border-line")}
              >
                Todo el cuerpo
              </button>
              {AREAS.map((a) => {
                const on = areas.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => setAreas(on ? areas.filter((x) => x !== a.id) : [...areas, a.id])}
                    aria-pressed={on}
                    className={cn("rounded-full border px-5 py-3 text-sm font-semibold transition-colors", on ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-2 hover:border-line-strong")}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {key === "activity" && (
          <>
            <Title sub="Fuera del entreno: trabajo, pasos, desplazamientos…">¿Cómo de activo es tu día?</Title>
            <div className="space-y-3">
              {(Object.entries(ACTIVITY_FACTORS) as [Activity, (typeof ACTIVITY_FACTORS)[Activity]][]).map(([k, v]) => (
                <Choice key={k} selected={activity === k} onClick={() => setActivity(k)} className="w-full p-4">
                  <span className="block font-semibold">{v.label}</span>
                  <span className="text-sm text-muted">{v.hint}</span>
                </Choice>
              ))}
            </div>
          </>
        )}

        {key === "diet" && (
          <>
            <Title sub="Cada día te recomendaremos qué comer según tu objetivo y tus calorías.">¿Cómo comes?</Title>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(DIET_LABELS) as [Diet, string][]).map(([k, v]) => (
                <Choice key={k} selected={diet === k} onClick={() => setDiet(k)} className="py-7 text-center">
                  <span className="font-athletic text-2xl font-extrabold uppercase italic sm:text-3xl">{v}</span>
                </Choice>
              ))}
            </div>
            <p className="mb-3 mt-8 text-sm font-semibold text-ink-2">¿Cuánto tiempo tienes por sesión?</p>
            <div className="grid grid-cols-4 gap-2">
              {[20, 30, 45, 60].map((m) => (
                <Choice key={m} selected={minutes === m} onClick={() => setMinutes(m)} className="py-4 text-center">
                  <span className="font-athletic text-3xl font-extrabold italic">{m}</span>
                  <span className="block text-xs text-muted">min</span>
                </Choice>
              ))}
            </div>
          </>
        )}

        {key === "generating" && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="relative grid size-28 place-items-center">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent/40" />
              <span className="relative grid size-24 place-items-center rounded-full bg-accent text-accent-ink">
                <Sparkles className="size-10" />
              </span>
            </div>
            <h1 className="mt-10 font-athletic text-5xl font-extrabold uppercase italic">Creando tu plan</h1>
            <ul className="mt-8 space-y-3 text-left">
              {["Analizando tu perfil", "Calculando calorías y macros", "Eligiendo tu programa", "Preparando tu menú y tus entrenos"].map((t, i) => (
                <li key={t} className={cn("flex items-center gap-3 transition-opacity duration-300", genStep > i ? "opacity-100" : "opacity-30")}>
                  <span className={cn("grid size-6 place-items-center rounded-full", genStep > i ? "bg-accent text-accent-ink" : "bg-white/10")}>
                    <Check className="size-4" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {key === "result" && (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Tu plan está listo</p>
            <h1 className="mt-3 font-athletic text-5xl font-extrabold uppercase italic leading-[0.92] sm:text-6xl">Hecho a tu medida</h1>
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl border border-white/10">
              <Image src={ROUTINE_COVER(routine.slug)} alt="" fill sizes="700px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">Tu programa</p>
                <p className="font-athletic text-4xl font-extrabold uppercase italic leading-none">{routine.name}</p>
                <p className="mt-1 text-sm text-white/70">
                  {routine.days.length} sesiones distintas · ~{routine.minutes} min · {routine.place}
                </p>
              </div>
            </div>
            {nutrition && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  [<Flame key="f" className="size-5 text-orange" />, fmtNumber(nutrition.calorieGoal), "kcal / día"],
                  [<span key="p" className="size-3 rounded-full bg-protein" />, `${nutrition.proteinGoal} g`, "proteína"],
                  [<span key="c" className="size-3 rounded-full bg-carbs" />, `${nutrition.carbsGoal} g`, "carbohidratos"],
                  [<Droplets key="w" className="size-5 text-sky" />, `${fmtNumber(nutrition.waterGoal / 1000, 1)} L`, "agua / día"],
                ].map(([icon, v, l], i) => (
                  <div key={i} className="rounded-2xl border border-line bg-surface p-4">
                    <div className="flex h-5 items-center">{icon}</div>
                    <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{v}</p>
                    <p className="text-xs text-muted">{l}</p>
                  </div>
                ))}
              </div>
            )}
            <ul className="mt-6 space-y-2 text-sm text-ink-2">
              {[`${days} entrenos por semana`, place === "casa" ? "Entrenos sin material" : "Entrenos de gimnasio", `Sesiones de ~${minutes} minutos`, `Menú diario: ${DIET_LABELS[diet].toLowerCase()}`, `Objetivo de peso: ${fmtNumber(target, 1)} kg`].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 text-accent" /> {t}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      {key !== "generating" && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 sm:px-6">
          <div className="pointer-events-auto mx-auto max-w-2xl">
            {key === "result" ? (
              <button onClick={finish} disabled={saving} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent font-athletic text-xl font-extrabold uppercase italic text-accent-ink shadow-[0_10px_40px_-10px_rgb(255_107_26/0.7)] disabled:opacity-60">
                {saving ? "Guardando…" : "Empezar ahora"} <ArrowRight className="size-5" />
              </button>
            ) : (
              <button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent font-semibold text-accent-ink transition disabled:bg-white/10 disabled:text-muted">
                Continuar <ArrowRight className="size-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
