"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Droplets, Flame, ListChecks, Play, Plus, Scale, Trophy, Utensils } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useData } from "@/components/data-provider";
import { usePlayer } from "@/components/workout-player";
import { AchievementIcon } from "@/components/achievement-icon";
import { MealPlan } from "@/components/meal-plan";
import { BarsChart, TrendChart } from "@/components/charts";
import { Card, CardHeader, EmptyState, LinkButton, Spinner, cn } from "@/components/ui";
import { getNutritionDay, saveNutritionDay } from "@/lib/db";
import { activeRoutine, achievements, nextRoutineDay, routineDaySession, weekDays } from "@/lib/plan";
import { addDays, bestSetByExercise, dayKey, fmtDate, fmtDuration, fmtNumber, parseDayKey, startOfWeek, weekStreak, weekStreakInfo } from "@/lib/fitness";
import type { NutritionDay } from "@/lib/types";
import { EXERCISE_BY_SLUG } from "@/data/exercises";
import { CHALLENGES, CHALLENGE_DAYS, ROUTINE_COVER, challengeDay } from "@/data/challenges";

function Ring({ pct, color, size, stroke = 10 }: { pct: number; color: string; size: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="absolute inset-0 m-auto -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity={0.15} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${Math.min(1, pct) * c} ${c}`} style={{ transition: "stroke-dasharray .8s ease" }} />
    </svg>
  );
}

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const { workouts, body, ready, latestWeight } = useData();
  const player = usePlayer();
  const [today, setToday] = useState<NutritionDay | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (user) getNutritionDay(user.uid, dayKey()).then(setToday).catch(() => {});
  }, [user]);

  const routine = activeRoutine(profile);
  const next = nextRoutineDay(routine, workouts);

  const s = useMemo(() => {
    const weekStart = startOfWeek().getTime();
    const thisWeek = workouts.filter((w) => w.date >= weekStart);
    const minutes = thisWeek.reduce((a, w) => a + w.durationSec, 0) / 60;
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = addDays(startOfWeek(), -7 * (7 - i)).getTime();
      const end = start + 7 * 864e5;
      return { label: fmtDate(start, { day: "numeric", month: "short" }), value: workouts.filter((w) => w.date >= start && w.date < end).reduce((a, w) => a + w.volume, 0), sub: `Semana del ${fmtDate(start, { day: "numeric", month: "long" })}` };
    });
    const weightSeries = body
      .filter((b) => b.weight && parseDayKey(b.date).getTime() >= now - 90 * 864e5)
      .map((b) => ({ label: fmtDate(b.date, { day: "numeric", month: "short" }), value: b.weight!, sub: fmtDate(b.date) }));
    const prs = Object.entries(bestSetByExercise(workouts)).sort((a, b) => b[1].date - a[1].date).slice(0, 4);
    return { thisWeek: thisWeek.length, minutes, weeks, weightSeries, prs, streak: weekStreak(workouts), streakInfo: weekStreakInfo(workouts), days: weekDays(workouts) };
  }, [workouts, body, now]);

  const ach = useMemo(() => achievements(workouts, body.filter((b) => b.weight).length, profile), [workouts, body, profile]);

  if (!ready)
    return (
      <div className="grid h-64 place-items-center">
        <Spinner className="size-8" />
      </div>
    );

  const firstName = profile?.name?.split(" ")[0] ?? "";
  const weeklyGoal = profile?.weeklyWorkoutsGoal ?? 3;
  const kcal = today?.entries.reduce((a, e) => a + e.kcal, 0) ?? 0;
  const kcalGoal = profile?.calorieGoal ?? 2000;
  const minutesGoal = weeklyGoal * 45;
  const doneToday = s.days.find((d) => d.today)?.done;
  const activeChallenges = CHALLENGES.map((c) => ({ c, days: profile?.challenges?.[c.slug] ?? [] })).filter((x) => x.days.length > 0);
  const nextAch = ach.filter((a) => !a.unlocked).sort((a, b) => b.progress - a.progress).slice(0, 3);
  const unlocked = ach.filter((a) => a.unlocked).length;

  const addWater = async () => {
    if (!user || !today) return;
    const d = { ...today, waterMl: today.waterMl + 250 };
    setToday(d);
    await saveNutritionDay(user.uid, d).catch(() => {});
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* saludo */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted first-letter:uppercase">{fmtDate(now, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-1 font-athletic text-4xl font-extrabold uppercase italic leading-none sm:text-5xl">
            {doneToday ? "¡Buen trabajo" : "A por ello"}
            {firstName ? `, ${firstName}` : ""}
            {doneToday ? "!" : ""}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-2 sm:text-base">
            {doneToday
              ? "Hoy ya has cumplido. Descansa, come bien y mañana seguimos."
              : `Hoy toca ${next.day.name}: ${next.day.focus.toLowerCase()}. Pulsa «Empezar» y te guío ejercicio a ejercicio.`}
          </p>
        </div>
        <span className="hidden sm:block">
          <LinkButton href="/panel/entrenar" variant="secondary">
            <ListChecks className="size-4" /> Registrar entreno
          </LinkButton>
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:gap-6">
        {/* entreno de hoy */}
        <div className="relative min-h-[300px] overflow-hidden rounded-3xl border border-white/10 bg-surface sm:min-h-[340px]">
          <Image src={ROUTINE_COVER(routine.slug)} alt="" fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
          <div className="relative flex h-full min-h-[inherit] flex-col justify-between p-5 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">{doneToday ? "Siguiente sesión" : "Tu entreno de hoy"}</span>
              <Link href="/panel/explorar#programas" className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur hover:text-white">
                Cambiar programa
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-white/70">{routine.name}</p>
              <h2 className="mt-1 font-athletic text-5xl font-extrabold uppercase italic leading-[0.9] sm:text-6xl">{next.day.name}</h2>
              <p className="mt-2 text-sm text-white/75">
                {next.day.focus} · {next.day.items.length} ejercicios · ~{routine.minutes} min
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => player.start(routineDaySession(routine, next.index))}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-accent px-6 font-athletic text-lg font-extrabold uppercase italic text-accent-ink shadow-[0_10px_40px_-10px_rgb(198_255_61/0.8)] active:scale-[0.98]"
                >
                  <Play className="size-4 fill-current" /> Empezar
                </button>
                <Link href={`/panel/entrenar?rutina=${routine.slug}&dia=${next.index}`} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur hover:bg-white/15">
                  Registrar con pesos
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* anillos */}
        <Card className="flex flex-col justify-between p-5 sm:p-6">
          <p className="text-sm font-semibold">Tu actividad</p>
          <div className="mt-4 flex items-center gap-5">
            <div className="relative size-36 shrink-0">
              <Ring pct={s.thisWeek / weeklyGoal} color="#c6ff3d" size={144} stroke={12} />
              <Ring pct={s.minutes / minutesGoal} color="#4cc3ff" size={110} stroke={12} />
              <Ring pct={kcal / kcalGoal} color="#ff8a3d" size={76} stroke={12} />
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted">Entrenos semana</dt>
                <dd className="font-display text-lg font-semibold text-accent tabular-nums">
                  {s.thisWeek}/{weeklyGoal}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Minutos semana</dt>
                <dd className="font-display text-lg font-semibold text-sky tabular-nums">
                  {fmtNumber(s.minutes)}/{minutesGoal}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Kcal comidas hoy</dt>
                <dd className="font-display text-lg font-semibold text-orange tabular-nums">
                  {fmtNumber(kcal)}/{fmtNumber(kcalGoal)}
                </dd>
              </div>
            </dl>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Link href="/panel/nutricion" className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.04] py-3 text-xs font-medium text-ink-2 hover:bg-white/[0.07]">
              <Utensils className="size-5 text-orange" /> Comida
            </Link>
            <button onClick={addWater} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.04] py-3 text-xs font-medium text-ink-2 hover:bg-white/[0.07]">
              <Droplets className="size-5 text-sky" /> +250 ml
              <span className="-mt-1 text-[10px] text-muted tabular-nums">{fmtNumber((today?.waterMl ?? 0) / 1000, 2)} L</span>
            </button>
            <Link href="/panel/cuerpo" className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.04] py-3 text-xs font-medium text-ink-2 hover:bg-white/[0.07]">
              <Scale className="size-5 text-accent" /> {latestWeight ? `${fmtNumber(latestWeight, 1)} kg` : "Peso"}
            </Link>
          </div>
        </Card>
      </div>

      {/* semana */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">
            Esta semana <span className="text-muted">· {s.thisWeek}/{weeklyGoal} entrenos</span>
          </p>
          <span className="flex items-center gap-1.5 rounded-full bg-orange/10 px-3 py-1 text-sm font-bold text-orange">
            <Flame className="size-4" /> {s.streak} {s.streak === 1 ? "semana" : "semanas"}
          </span>
        </div>
        {(s.streakInfo.atRisk || s.streakInfo.freezeUsed) && (
          <p className={cn("mt-3 rounded-xl px-3 py-2 text-xs", s.streakInfo.atRisk ? "bg-orange/10 text-orange" : "bg-sky/10 text-sky")}>
            {s.streakInfo.atRisk
              ? `Tu racha de ${s.streak} semanas está en juego: entrena esta semana para mantenerla.`
              : "Usaste tu comodín: una semana sin entrenar no rompe tu racha. ¡Sigue así!"}
          </p>
        )}
        <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-3">
          {s.days.map((d) => (
            <div
              key={d.label}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl py-2.5 transition-colors",
                d.today ? "bg-white/[0.06] ring-1 ring-accent/50" : "",
              )}
            >
              <span className={cn("text-xs font-semibold", d.today ? "text-accent" : "text-muted")}>{d.label}</span>
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-full text-sm font-bold sm:size-10",
                  d.done ? "bg-accent text-accent-ink" : d.future ? "text-muted" : "border border-line-strong text-ink-2",
                )}
              >
                {d.done ? <Check className="size-4" /> : d.date}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <MealPlan compact date={dayKey()} day={today} trainedToday={Boolean(doneToday)} />

      {/* retos */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{activeChallenges.length ? "Tus retos" : "Retos de 30 días"}</h2>
          <Link href="/panel/retos" className="text-sm font-medium text-accent">
            Ver todos
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
          {(activeChallenges.length ? activeChallenges : CHALLENGES.map((c) => ({ c, days: [] as number[] }))).map(({ c, days }) => {
            const nextDay = Math.min(CHALLENGE_DAYS, (days.length ? Math.max(...days) : 0) + 1);
            return (
              <div key={c.slug} className="relative aspect-[4/3] w-[78vw] max-w-sm shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 sm:w-auto">
                <Image src={c.cover} alt="" fill sizes="(max-width: 640px) 80vw, 25vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <Link href={`/panel/retos/${c.slug}`} className="absolute inset-0" aria-label={c.name} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
                  <p className="font-athletic text-2xl font-extrabold uppercase italic leading-none">{c.short}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(days.length / CHALLENGE_DAYS) * 100}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-white/70">{days.length ? `${days.length}/${CHALLENGE_DAYS} días completados` : `${c.level} · ${c.focus}`}</p>
                </div>
                <button
                  onClick={() => player.start(challengeDay(c, nextDay))}
                  className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-ink"
                >
                  <Play className="size-3 fill-current" /> Día {nextDay}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* logros */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Logros</h2>
            <p className="text-sm text-muted">
              {unlocked} de {ach.length} desbloqueados
            </p>
          </div>
          <Link href="/panel/progreso#logros" className="text-sm font-medium text-accent">
            Ver todos
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {nextAch.map((a) => {
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5 text-ink-2">
                  <AchievementIcon name={a.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.title}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${a.progress * 100}%` }} />
                  </div>
                  <p className="mt-1 truncate text-[11px] text-muted">{a.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader title="Volumen semanal" subtitle="Kilos totales levantados (peso × repeticiones)" />
          <div className="p-3 pt-4">
            {workouts.length ? <BarsChart data={s.weeks} unit="kg" /> : <EmptyState icon={<Play />} title="Tu primer entreno te espera" text="Pulsa «Empezar» arriba y verás aquí tu progreso." />}
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Evolución del peso"
            subtitle="Últimos 90 días"
            action={
              <Link href="/panel/cuerpo" className="text-sm font-medium text-accent">
                Ver todo
              </Link>
            }
          />
          <div className="p-3 pt-4">
            {s.weightSeries.length >= 2 ? (
              <TrendChart data={s.weightSeries} unit="kg" target={profile?.targetWeight} />
            ) : (
              <EmptyState icon={<Scale />} title="Registra tu peso" text="Con dos registros verás tu tendencia." action={<LinkButton href="/panel/cuerpo" size="sm"><Plus className="size-4" /> Añadir peso</LinkButton>} />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader title="Últimos entrenos" action={<Link href="/panel/historial" className="text-sm font-medium text-accent">Historial</Link>} />
          <ul className="divide-y divide-line px-5 pb-2 pt-2">
            {workouts.slice(0, 4).map((w) => (
              <li key={w.id} className="flex items-center gap-3 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                  <Check className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{w.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {fmtDate(w.date, { weekday: "short", day: "numeric", month: "short" })} · {fmtDuration(w.durationSec)} · {fmtNumber(w.volume)} kg
                  </p>
                </div>
              </li>
            ))}
            {!workouts.length && <li className="py-8 text-center text-sm text-muted">Todavía no has registrado entrenos.</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Récords personales" subtitle="1RM estimado" action={<Link href="/panel/progreso" className="text-sm font-medium text-accent">Progreso</Link>} />
          <ul className="divide-y divide-line px-5 pb-2 pt-2">
            {s.prs.map(([slug, pr]) => (
              <li key={slug} className="flex items-center gap-3 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning">
                  <Trophy className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{EXERCISE_BY_SLUG[slug]?.name ?? slug}</p>
                  <p className="text-xs text-muted">
                    {fmtNumber(pr.weight, 1)} kg × {pr.reps}
                  </p>
                </div>
                <span className="font-display font-semibold tabular-nums">{fmtNumber(pr.e1rm, 1)} kg</span>
              </li>
            ))}
            {!s.prs.length && (
              <li className="flex items-center justify-between gap-3 py-8 text-sm text-muted">
                Tus récords aparecerán aquí cuando registres pesos.
                <Link href="/panel/explorar" className="flex shrink-0 items-center gap-1 text-accent">
                  Explorar <ArrowUpRight className="size-4" />
                </Link>
              </li>
            )}
          </ul>
        </Card>
      </div>

      <Link href="/panel/explorar" className="flex items-center justify-between rounded-3xl border border-line bg-gradient-to-r from-accent/[0.12] to-transparent p-5 transition-colors hover:border-accent/40">
        <div>
          <p className="font-display text-lg font-semibold">¿Te apetece otra cosa?</p>
          <p className="text-sm text-muted">Entrenos rápidos por zona, programas y retos.</p>
        </div>
        <ArrowRight className="size-5 text-accent" />
      </Link>
    </div>
  );
}
