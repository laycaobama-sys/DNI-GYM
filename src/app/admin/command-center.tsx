"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Dumbbell, HeartPulse, Sparkles, UserPlus, Users } from "lucide-react";
import { BarsChart, HBarList, TrendChart } from "@/components/charts";
import { Avatar } from "@/components/app-shell";
import { Badge, Card, CardHeader, Spinner, Tabs, cn } from "@/components/ui";
import { getMetrics, type KV, type Metrics } from "@/lib/admin-api";
import { fmtDate, fmtNumber, timeAgo } from "@/lib/fitness";

const GOALS: Record<string, string> = { perder: "Perder grasa", ganar: "Ganar músculo", tonificar: "Tonificar", forma: "Estar en forma", mantener: "Mantener" };

function Kpi({ label, value, hint, icon, delta }: { label: string; value: string; hint?: string; icon: React.ReactNode; delta?: number | null }) {
  return (
    <Card className="relative overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted">
        <span>{label}</span>
        <span className="grid size-8 place-items-center rounded-lg bg-accent/10 text-accent">{icon}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
        {delta != null && Number.isFinite(delta) && (
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", delta >= 0 ? "text-good" : "text-critical")}>
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {fmtNumber(Math.abs(delta))}%
          </span>
        )}
        {hint && <span>{hint}</span>}
      </div>
    </Card>
  );
}

const pts = (s: { d: string; v: number }[]) => s.map((x) => ({ label: fmtDate(x.d, { day: "numeric", month: "short" }), value: x.v, sub: fmtDate(x.d, { weekday: "long", day: "numeric", month: "long" }) }));
const sum = (s: { v: number }[]) => s.reduce((a, b) => a + b.v, 0);
const labelled = (items: KV[], map?: Record<string, string>) => items.map((i) => ({ ...i, label: map?.[i.label] ?? i.label }));

function Empty() {
  return <p className="text-sm text-muted">Aún no hay datos suficientes. Aparecerán en cuanto lleguen usuarios.</p>;
}

export function CommandCenter() {
  const [days, setDays] = useState<"7" | "30" | "90">("30");
  const [m, setM] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setM(await getMetrics(Number(days)));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [days]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, 60_000); // panel en vivo: se refresca cada minuto
    return () => clearInterval(id);
  }, [load]);

  if (error) return <p className="rounded-xl border border-critical/30 bg-critical/10 p-4 text-sm text-critical">No se pudieron cargar las métricas: {error}</p>;
  if (!m) return <div className="grid h-64 place-items-center"><Spinner className="size-8" /></div>;

  const t = m.totals;
  const growth = t.newPrev ? ((t.newRange - t.newPrev) / t.newPrev) * 100 : null;
  const activation = t.users ? (t.onboarded / t.users) * 100 : 0;
  const funnel = m.funnel.map((f, i) => ({ ...f, label: `${f.label}${i > 0 && m.funnel[i - 1].value ? ` · ${fmtNumber((f.value / m.funnel[i - 1].value) * 100)}%` : ""}` }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-athletic text-4xl font-extrabold uppercase italic leading-none">Centro de control</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-good opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-good" /></span>
            En vivo · actualizado {timeAgo(m.generatedAt)} · {m.catalog.exercises} ejercicios y {m.catalog.routines} rutinas publicadas
          </p>
        </div>
        <Tabs value={days} onChange={setDays} items={[{ value: "7", label: "7 días" }, { value: "30", label: "30 días" }, { value: "90", label: "90 días" }]} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Usuarios" value={fmtNumber(t.users)} hint={`+${fmtNumber(t.newRange)} en ${days} d`} delta={growth} icon={<Users className="size-4" />} />
        <Kpi label="Activos 7 d" value={fmtNumber(t.active7)} hint={`${fmtNumber(t.active1)} hoy · ${fmtNumber(t.active30)} en 30 d`} icon={<Activity className="size-4" />} />
        <Kpi label="Retención D7" value={m.retention.d7 == null ? "—" : `${fmtNumber(m.retention.d7)}%`} hint={m.retention.d30 == null ? "D30 sin datos" : `D30 ${fmtNumber(m.retention.d30)}%`} icon={<HeartPulse className="size-4" />} />
        <Kpi label="Activación" value={`${fmtNumber(activation)}%`} hint="completan el cuestionario" icon={<UserPlus className="size-4" />} />
        <Kpi label="Entrenos" value={fmtNumber(sum(m.series.workouts))} hint={`${fmtNumber(t.withWorkouts)} usuarios han entrenado`} icon={<Dumbbell className="size-4" />} />
        <Kpi label="Visitas" value={fmtNumber(sum(m.series.visits))} hint={`en ${days} días`} icon={<Activity className="size-4" />} />
        <Kpi label="Consultas IA" value={fmtNumber(sum(m.series.ai))} hint="Gemini 2.5 Flash" icon={<Sparkles className="size-4" />} />
        <Kpi label="Errores 7 d" value={fmtNumber(t.errors7)} hint={t.errors7 ? "revisa la pestaña Errores" : "todo en orden"} icon={<AlertTriangle className="size-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Nuevos registros" subtitle={`Por día · ${days} días`} />
          <div className="p-3 pt-4"><BarsChart data={pts(m.series.signups)} unit="registros" /></div>
        </Card>
        <Card>
          <CardHeader title="Usuarios activos" subtitle="Usuarios distintos con actividad cada día" />
          <div className="p-3 pt-4"><TrendChart data={pts(m.series.active)} unit="usuarios" digits={0} domainPad={0} /></div>
        </Card>
        <Card>
          <CardHeader title="Entrenos completados" subtitle="Por día" />
          <div className="p-3 pt-4"><BarsChart data={pts(m.series.workouts)} unit="entrenos" color="#f5b83d" /></div>
        </Card>
        <Card>
          <CardHeader title="Embudo de conversión" subtitle={`Usuarios registrados en ${days} días · % sobre el paso anterior`} />
          <div className="p-5">{m.funnel[0].value || m.funnel[1].value ? <HBarList items={funnel} /> : <Empty />}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Dispositivos" subtitle="Desde dónde se conectan" />
          <div className="p-5">{m.devices.length ? <HBarList items={m.devices} unit="accesos" /> : <Empty />}</div>
        </Card>
        <Card>
          <CardHeader title="Método de acceso" />
          <div className="p-5">{t.users ? <HBarList items={m.providers} unit="usuarios" /> : <Empty />}</div>
        </Card>
        <Card>
          <CardHeader title="Objetivos" subtitle="Lo que buscan tus usuarios" />
          <div className="p-5">{t.users ? <HBarList items={labelled(m.goals, GOALS)} unit="usuarios" /> : <Empty />}</div>
        </Card>
        <Card>
          <CardHeader title="De dónde llegan" subtitle="Origen de las visitas" />
          <div className="p-5">{m.referrers.length ? <HBarList items={m.referrers} /> : <Empty />}</div>
        </Card>
        <Card>
          <CardHeader title="Páginas de entrada" />
          <div className="p-5">{m.pages.length ? <HBarList items={m.pages} /> : <Empty />}</div>
        </Card>
        <Card>
          <CardHeader title="Ejercicios más entrenados" />
          <div className="p-5">{m.topExercises.length ? <HBarList items={m.topExercises} unit="veces" /> : <Empty />}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Horas de más actividad" subtitle="Hora UTC · ideal para programar avisos" />
          <div className="p-3 pt-4"><BarsChart data={m.hours} unit="acciones" height={200} color="#4cc3ff" /></div>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader title="Últimos registros" subtitle="Quién ha llegado a DNI GYM" action={<Badge tone="accent">{fmtNumber(t.newRange)} nuevos</Badge>} />
          <ul className="divide-y divide-line">
            {m.recent.length === 0 && <li className="p-5"><Empty /></li>}
            {m.recent.map((u) => (
              <li key={u.uid} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={u.name || u.email} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name || "Sin nombre"}</p>
                  <p className="truncate text-xs text-muted">{u.email}</p>
                </div>
                <div className="hidden flex-col items-end gap-1 sm:flex">
                  <Badge tone={u.onboarded ? "good" : "neutral"}>{u.onboarded ? "Activado" : "Sin cuestionario"}</Badge>
                  <span className="text-[11px] text-muted">{u.provider === "google" ? "Google" : "Correo"} · {u.workouts} entrenos</span>
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-muted">{timeAgo(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
