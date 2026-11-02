"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarCheck, Dumbbell, Flame, Play, Scale, Sparkles, Trophy, Zap } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useData } from "@/components/data-provider";
import { BarsChart, TrendChart } from "@/components/charts";
import { Card, CardHeader, EmptyState, LinkButton, Progress, Spinner, Stat } from "@/components/ui";
import { getNutritionDay } from "@/lib/db";
import {
  addDays,
  bestSetByExercise,
  dayKey,
  fmtDate,
  fmtDuration,
  fmtNumber,
  parseDayKey,
  startOfWeek,
  weekStreak,
} from "@/lib/fitness";
import type { NutritionDay } from "@/lib/types";
import { EXERCISE_BY_SLUG } from "@/data/exercises";

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const { workouts, body, ready, latestWeight } = useData();
  const [today, setToday] = useState<NutritionDay | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (user) getNutritionDay(user.uid, dayKey()).then(setToday).catch(() => {});
  }, [user]);

  const s = useMemo(() => {
    const weekStart = startOfWeek().getTime();
    const thisWeek = workouts.filter((w) => w.date >= weekStart).length;
    const last7 = workouts.filter((w) => w.date >= now - 7 * 864e5).reduce((a, w) => a + w.volume, 0);
    const prev7 = workouts.filter((w) => w.date >= now - 14 * 864e5 && w.date < now - 7 * 864e5).reduce((a, w) => a + w.volume, 0);
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = addDays(startOfWeek(), -7 * (7 - i)).getTime();
      const end = start + 7 * 864e5;
      const vol = workouts.filter((w) => w.date >= start && w.date < end).reduce((a, w) => a + w.volume, 0);
      return { label: fmtDate(start, { day: "numeric", month: "short" }), value: vol, sub: `Semana del ${fmtDate(start, { day: "numeric", month: "long" })}` };
    });
    const weightSeries = body
      .filter((b) => b.weight && parseDayKey(b.date).getTime() >= now - 90 * 864e5)
      .map((b) => ({ label: fmtDate(b.date, { day: "numeric", month: "short" }), value: b.weight!, sub: fmtDate(b.date) }));
    const w30 = body.filter((b) => b.weight && parseDayKey(b.date).getTime() >= now - 30 * 864e5);
    const weightDelta = w30.length >= 2 ? w30[w30.length - 1].weight! - w30[0].weight! : null;
    const best = bestSetByExercise(workouts);
    const prs = Object.entries(best)
      .sort((a, b) => b[1].date - a[1].date)
      .slice(0, 5);
    return { thisWeek, last7, prev7, weeks, weightSeries, weightDelta, prs, streak: weekStreak(workouts) };
  }, [workouts, body, now]);

  if (!ready)
    return (
      <div className="grid h-64 place-items-center">
        <Spinner className="size-8" />
      </div>
    );

  const firstName = profile?.name?.split(" ")[0] ?? "";
  const weeklyGoal = profile?.weeklyWorkoutsGoal ?? 3;
  const kcal = today?.entries.reduce((a, e) => a + e.kcal, 0) ?? 0;
  const macros = today?.entries.reduce((a, e) => ({ p: a.p + e.protein, c: a.c + e.carbs, f: a.f + e.fat }), { p: 0, c: 0, f: 0 }) ?? { p: 0, c: 0, f: 0 };
  const volTrend = s.prev7 > 0 ? ((s.last7 - s.prev7) / s.prev7) * 100 : null;
  const goalLosing = profile?.goal === "perder";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted first-letter:uppercase">{fmtDate(now, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Hola{firstName ? `, ${firstName}` : ""} 👋</h1>
        </div>
        <LinkButton href="/panel/entrenar" size="lg">
          <Play className="size-4" /> Empezar entrenamiento
        </LinkButton>
      </div>

      {!profile?.onboarded && (
        <Card className="flex flex-col gap-4 border-accent/30 bg-accent/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Completa tu perfil en 30 segundos</h2>
              <p className="text-sm text-muted">Calcularemos tus calorías, macros y objetivo de agua personalizados.</p>
            </div>
          </div>
          <LinkButton href="/panel/perfil" variant="secondary">
            Completar perfil <ArrowRight className="size-4" />
          </LinkButton>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Entrenos esta semana"
          icon={<CalendarCheck className="size-4" />}
          value={s.thisWeek}
          unit={`/ ${weeklyGoal}`}
          hint={<Progress value={s.thisWeek} max={weeklyGoal} className="mt-1" />}
        />
        <Stat label="Racha" icon={<Zap className="size-4" />} value={s.streak} unit={s.streak === 1 ? "semana" : "semanas"} hint="seguidas entrenando" />
        <Stat
          label="Volumen (7 días)"
          icon={<Dumbbell className="size-4" />}
          value={s.last7 >= 10000 ? fmtNumber(s.last7 / 1000, 1) + "k" : fmtNumber(s.last7)}
          unit="kg"
          trend={volTrend != null ? { value: `${volTrend >= 0 ? "▲" : "▼"} ${fmtNumber(Math.abs(volTrend))}%`, good: volTrend >= 0 } : null}
          hint="vs. 7 días anteriores"
        />
        <Stat
          label="Peso actual"
          icon={<Scale className="size-4" />}
          value={latestWeight ? fmtNumber(latestWeight, 1) : "—"}
          unit={latestWeight ? "kg" : undefined}
          trend={
            s.weightDelta != null
              ? { value: `${s.weightDelta > 0 ? "+" : ""}${fmtNumber(s.weightDelta, 1)} kg`, good: profile?.goal ? (goalLosing ? s.weightDelta <= 0 : profile.goal === "ganar" ? s.weightDelta >= 0 : undefined) : undefined }
              : null
          }
          hint={s.weightDelta != null ? "en 30 días" : <Link href="/panel/cuerpo" className="text-accent">Registrar peso</Link>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Volumen semanal" subtitle="Kilos totales levantados por semana (peso × repeticiones)" />
          <div className="p-3 pt-4">
            {workouts.length ? <BarsChart data={s.weeks} unit="kg" /> : <EmptyState icon={<Dumbbell />} title="Aún no hay entrenos" text="Registra tu primer entrenamiento para ver tu volumen." />}
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
              <EmptyState icon={<Scale />} title="Registra tu peso" text="Añade al menos dos registros para ver la tendencia." action={<LinkButton href="/panel/cuerpo" size="sm">Añadir peso</LinkButton>} />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader
            title="Nutrición de hoy"
            action={
              <Link href="/panel/nutricion" className="text-sm font-medium text-accent">
                Abrir
              </Link>
            }
          />
          <div className="space-y-4 p-5">
            <div className="flex items-baseline gap-2">
              <Flame className="size-5 self-center text-orange" />
              <span className="font-display text-3xl font-semibold tabular-nums">{fmtNumber(kcal)}</span>
              <span className="text-sm text-muted">/ {profile?.calorieGoal ? fmtNumber(profile.calorieGoal) : "—"} kcal</span>
            </div>
            <Progress value={kcal} max={profile?.calorieGoal ?? 2000} color="var(--color-accent)" />
            {[
              ["Proteína", macros.p, profile?.proteinGoal, "var(--color-protein)"],
              ["Carbohidratos", macros.c, profile?.carbsGoal, "var(--color-carbs)"],
              ["Grasas", macros.f, profile?.fatGoal, "var(--color-fat)"],
            ].map(([l, v, g, c]) => (
              <div key={String(l)}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-ink-2">
                    <span className="size-2 rounded-full" style={{ background: String(c) }} /> {l}
                  </span>
                  <span className="tabular-nums text-muted">
                    {fmtNumber(Number(v))} / {g ? fmtNumber(Number(g)) : "—"} g
                  </span>
                </div>
                <Progress value={Number(v)} max={Number(g) || 100} color={String(c)} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader
            title="Últimos entrenos"
            action={
              <Link href="/panel/historial" className="text-sm font-medium text-accent">
                Historial
              </Link>
            }
          />
          <ul className="divide-y divide-line px-5 pb-2 pt-2">
            {workouts.slice(0, 4).map((w) => (
              <li key={w.id} className="py-3">
                <p className="truncate text-sm font-medium">{w.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {fmtDate(w.date, { weekday: "short", day: "numeric", month: "short" })} · {fmtDuration(w.durationSec)} · {fmtNumber(w.volume)} kg
                </p>
              </li>
            ))}
            {!workouts.length && <li className="py-8 text-center text-sm text-muted">Todavía no has registrado entrenos.</li>}
          </ul>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader
            title="Récords personales"
            subtitle="1RM estimado"
            action={
              <Link href="/panel/progreso" className="text-sm font-medium text-accent">
                Progreso
              </Link>
            }
          />
          <ul className="divide-y divide-line px-5 pb-2 pt-2">
            {s.prs.map(([slug, pr]) => (
              <li key={slug} className="flex items-center gap-3 py-3">
                <Trophy className="size-4 shrink-0 text-warning" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{EXERCISE_BY_SLUG[slug]?.name ?? slug}</p>
                  <p className="text-xs text-muted">
                    {fmtNumber(pr.weight, 1)} kg × {pr.reps}
                  </p>
                </div>
                <span className="font-display font-semibold tabular-nums">{fmtNumber(pr.e1rm, 1)} kg</span>
              </li>
            ))}
            {!s.prs.length && <li className="py-8 text-center text-sm text-muted">Tus récords aparecerán aquí.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
