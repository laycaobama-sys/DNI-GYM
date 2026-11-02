"use client";

import { useMemo, useState } from "react";
import { LineChart, Trophy } from "lucide-react";
import { useData } from "@/components/data-provider";
import { BarsChart, HBarList, TrendChart } from "@/components/charts";
import { Card, CardHeader, EmptyState, LinkButton, PageHeader, Stat, Tabs } from "@/components/ui";
import { EXERCISE_BY_SLUG, groupLabel, type MuscleGroup } from "@/data/exercises";
import { addDays, bestSetByExercise, fmtDate, fmtNumber, oneRepMax, setsByGroup, startOfWeek } from "@/lib/fitness";

type Range = "30" | "90" | "365";

export default function ProgressPage() {
  const { workouts } = useData();
  const [range, setRange] = useState<Range>("90");
  const [now] = useState(() => Date.now());
  const since = now - Number(range) * 864e5;
  const inRange = useMemo(() => workouts.filter((w) => w.date >= since), [workouts, since]);

  const exercisesDone = useMemo(() => {
    const count: Record<string, number> = {};
    for (const w of workouts) for (const e of w.exercises) if (e.sets.some((s) => s.weight > 0)) count[e.slug] = (count[e.slug] ?? 0) + 1;
    return Object.entries(count).sort((a, b) => b[1] - a[1]).map(([s]) => s);
  }, [workouts]);
  const [selected, setSelected] = useState<string>("");
  const ex = selected || exercisesDone[0] || "";

  const series = useMemo(() => {
    if (!ex) return [];
    return [...inRange]
      .reverse()
      .map((w) => {
        const e = w.exercises.find((x) => x.slug === ex);
        if (!e) return null;
        const best = Math.max(0, ...e.sets.map((s) => oneRepMax(s.weight, s.reps)));
        return best ? { label: fmtDate(w.date, { day: "numeric", month: "short" }), value: Math.round(best * 10) / 10, sub: fmtDate(w.date) } : null;
      })
      .filter(Boolean) as { label: string; value: number; sub: string }[];
  }, [inRange, ex]);

  const weekly = useMemo(() => {
    const weeks = Math.min(16, Math.ceil(Number(range) / 7));
    return Array.from({ length: weeks }, (_, i) => {
      const start = addDays(startOfWeek(), -7 * (weeks - 1 - i)).getTime();
      const end = start + 7 * 864e5;
      const ws = workouts.filter((w) => w.date >= start && w.date < end);
      return { label: fmtDate(start, { day: "numeric", month: "short" }), value: ws.length, sub: `Semana del ${fmtDate(start, { day: "numeric", month: "long" })}` };
    });
  }, [workouts, range]);

  const groups = useMemo(() => {
    const g = setsByGroup(inRange);
    const weeks = Math.max(1, Number(range) / 7);
    return Object.entries(g)
      .map(([k, v]) => ({ label: groupLabel(k as MuscleGroup), value: Math.round(((v ?? 0) / weeks) * 10) / 10 }))
      .sort((a, b) => b.value - a.value);
  }, [inRange, range]);

  const prs = useMemo(() => Object.entries(bestSetByExercise(workouts)).sort((a, b) => b[1].e1rm - a[1].e1rm), [workouts]);
  const totalVol = inRange.reduce((a, w) => a + w.volume, 0);
  const totalSets = inRange.reduce((a, w) => a + w.totalSets, 0);
  const totalMin = inRange.reduce((a, w) => a + w.durationSec, 0) / 60;

  if (!workouts.length)
    return (
      <div>
        <PageHeader title="Progreso" />
        <Card>
          <EmptyState icon={<LineChart />} title="Tu progreso aparecerá aquí" text="Registra entrenamientos para ver tu fuerza, volumen y récords." action={<LinkButton href="/panel/entrenar">Registrar entreno</LinkButton>} />
        </Card>
      </div>
    );

  const first = series[0]?.value;
  const last = series.at(-1)?.value;
  const gain = first && last ? ((last - first) / first) * 100 : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progreso"
        subtitle="Fuerza, volumen y constancia"
        action={<Tabs value={range} onChange={setRange} items={[{ value: "30", label: "30 días" }, { value: "90", label: "90 días" }, { value: "365", label: "1 año" }]} />}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Entrenamientos" value={inRange.length} hint={`en ${range} días`} />
        <Stat label="Volumen total" value={totalVol >= 10000 ? `${fmtNumber(totalVol / 1000, 1)}k` : fmtNumber(totalVol)} unit="kg" />
        <Stat label="Series efectivas" value={fmtNumber(totalSets)} />
        <Stat label="Tiempo entrenando" value={fmtNumber(totalMin / 60, 1)} unit="h" />
      </div>

      <Card>
        <CardHeader
          title="Evolución de fuerza"
          subtitle="1RM estimado (Epley) por sesión"
          action={
            <select className="input h-9 w-auto max-w-[55vw] py-1 text-sm sm:max-w-xs" value={ex} onChange={(e) => setSelected(e.target.value)} aria-label="Ejercicio">
              {exercisesDone.map((s) => (
                <option key={s} value={s}>
                  {EXERCISE_BY_SLUG[s]?.name ?? s}
                </option>
              ))}
            </select>
          }
        />
        <div className="px-5 pt-3">
          {gain != null && (
            <p className="text-sm text-muted">
              <span className={gain >= 0 ? "font-semibold text-good" : "font-semibold text-critical"}>
                {gain >= 0 ? "+" : ""}
                {fmtNumber(gain, 1)}%
              </span>{" "}
              en el periodo ({fmtNumber(first!, 1)} → {fmtNumber(last!, 1)} kg)
            </p>
          )}
        </div>
        <div className="p-3">
          {series.length >= 2 ? <TrendChart data={series} unit="kg" height={260} /> : <p className="py-16 text-center text-sm text-muted">Necesitas al menos 2 sesiones de este ejercicio en el periodo.</p>}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Constancia" subtitle="Entrenamientos por semana" />
          <div className="p-3 pt-4">
            <BarsChart data={weekly} unit="entrenos" target={undefined} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Series por grupo muscular" subtitle="Media semanal · recomendado 10–20 para hipertrofia" />
          <div className="p-5">{groups.length ? <HBarList items={groups} unit="series/sem" /> : <p className="text-sm text-muted">Sin datos.</p>}</div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Récords personales" subtitle="Mejor serie de cada ejercicio (1RM estimado)" />
        <div className="overflow-x-auto p-2">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Ejercicio</th>
                <th className="px-3 py-2 font-medium">Mejor serie</th>
                <th className="px-3 py-2 font-medium">1RM estimado</th>
                <th className="px-3 py-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {prs.map(([slug, pr]) => (
                <tr key={slug}>
                  <td className="px-3 py-2.5 font-medium">
                    <span className="flex items-center gap-2">
                      <Trophy className="size-3.5 text-warning" /> {EXERCISE_BY_SLUG[slug]?.name ?? slug}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-ink-2">
                    {fmtNumber(pr.weight, 1)} kg × {pr.reps}
                  </td>
                  <td className="px-3 py-2.5 font-semibold tabular-nums">{fmtNumber(pr.e1rm, 1)} kg</td>
                  <td className="px-3 py-2.5 text-muted">{fmtDate(pr.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
