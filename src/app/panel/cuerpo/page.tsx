"use client";

import { useMemo, useState } from "react";
import { Plus, Ruler, Scale, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useData } from "@/components/data-provider";
import { TrendChart } from "@/components/charts";
import { Button, Card, CardHeader, EmptyState, Field, Modal, PageHeader, Stat, Tabs } from "@/components/ui";
import { bmi, bmiCategory, dayKey, fmtDate, fmtNumber, parseDayKey } from "@/lib/fitness";
import type { BodyLog } from "@/lib/types";

const MEASURES: { key: keyof BodyLog; label: string; unit: string }[] = [
  { key: "bodyFat", label: "% grasa", unit: "%" },
  { key: "waist", label: "Cintura", unit: "cm" },
  { key: "chest", label: "Pecho", unit: "cm" },
  { key: "arm", label: "Brazo", unit: "cm" },
  { key: "hip", label: "Cadera", unit: "cm" },
  { key: "thigh", label: "Muslo", unit: "cm" },
];

type Range = "30" | "90" | "365" | "all";

export default function BodyPage() {
  const { profile } = useAuth();
  const { body, saveBodyLog, deleteBodyLog, latestWeight } = useData();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<Range>("90");
  const [metric, setMetric] = useState<keyof BodyLog>("weight");
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [now] = useState(() => Date.now());

  const openForm = () => {
    const today = body.find((b) => b.id === dayKey());
    setForm({
      date: dayKey(),
      weight: String(today?.weight ?? latestWeight ?? ""),
      ...Object.fromEntries(MEASURES.map((m) => [m.key, today?.[m.key] != null ? String(today[m.key]) : ""])),
    });
    setOpen(true);
  };

  const save = async () => {
    const num = (k: string) => (form[k] ? parseFloat(form[k].replace(",", ".")) : undefined);
    const date = form.date || dayKey();
    const existing = body.find((b) => b.id === date);
    const log: BodyLog = { ...existing, id: date, date, weight: num("weight") };
    for (const m of MEASURES) (log as unknown as Record<string, number | undefined>)[m.key] = num(m.key);
    setSaving(true);
    try {
      await saveBodyLog(log);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const since = range === "all" ? 0 : now - Number(range) * 864e5;
    return body.filter((b) => parseDayKey(b.date).getTime() >= since && b[metric] != null);
  }, [body, range, metric, now]);

  const series = filtered.map((b) => ({ label: fmtDate(b.date, { day: "numeric", month: "short" }), value: Number(b[metric]), sub: fmtDate(b.date) }));
  const weights = body.filter((b) => b.weight);
  const firstW = weights[0]?.weight;
  const change = firstW && latestWeight ? latestWeight - firstW : null;
  const toTarget = profile?.targetWeight && latestWeight ? latestWeight - profile.targetWeight : null;
  const imc = profile?.heightCm && latestWeight ? bmi(latestWeight, profile.heightCm) : null;
  const metricMeta = metric === "weight" ? { label: "Peso", unit: "kg" } : MEASURES.find((m) => m.key === metric)!;

  return (
    <div className="space-y-6">
      <PageHeader title="Peso y medidas" subtitle="Registra tu peso y perímetros para ver tu evolución real" action={<Button onClick={openForm}><Plus className="size-4" /> Registrar</Button>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Peso actual" value={latestWeight ? fmtNumber(latestWeight, 1) : "—"} unit={latestWeight ? "kg" : undefined} icon={<Scale className="size-4" />} />
        <Stat label="Cambio total" value={change != null ? `${change > 0 ? "+" : ""}${fmtNumber(change, 1)}` : "—"} unit={change != null ? "kg" : undefined} hint={firstW ? `desde ${fmtNumber(firstW, 1)} kg` : undefined} />
        <Stat label="Hasta el objetivo" value={toTarget != null ? fmtNumber(Math.abs(toTarget), 1) : "—"} unit={toTarget != null ? "kg" : undefined} hint={profile?.targetWeight ? `objetivo ${fmtNumber(profile.targetWeight, 1)} kg` : "Define tu objetivo en Perfil"} />
        <Stat label="IMC" value={imc ? fmtNumber(imc, 1) : "—"} hint={imc ? bmiCategory(imc).label : "Añade tu altura en Perfil"} />
      </div>

      <Card>
        <CardHeader
          title={`Evolución · ${metricMeta.label}`}
          action={<Tabs value={range} onChange={setRange} items={[{ value: "30", label: "30 d" }, { value: "90", label: "90 d" }, { value: "365", label: "1 año" }, { value: "all", label: "Todo" }]} />}
        />
        <div className="flex flex-wrap gap-2 px-5 pt-4">
          {[{ key: "weight" as keyof BodyLog, label: "Peso" }, ...MEASURES].map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${metric === m.key ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-2 hover:text-ink"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="p-3">
          {series.length >= 2 ? (
            <TrendChart data={series} unit={metricMeta.unit} height={280} target={metric === "weight" ? profile?.targetWeight : undefined} />
          ) : (
            <EmptyState icon={metric === "weight" ? <Scale /> : <Ruler />} title="Sin datos suficientes" text="Añade al menos dos registros para ver la gráfica." action={<Button size="sm" onClick={openForm}>Registrar ahora</Button>} />
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Registros" />
        <div className="overflow-x-auto p-2">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Peso</th>
                {MEASURES.map((m) => (
                  <th key={m.key} className="px-3 py-2 font-medium">{m.label}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...body].reverse().slice(0, 60).map((b) => (
                <tr key={b.id}>
                  <td className="px-3 py-2.5 text-ink-2">{fmtDate(b.date)}</td>
                  <td className="px-3 py-2.5 font-semibold tabular-nums">{b.weight ? `${fmtNumber(b.weight, 1)} kg` : "—"}</td>
                  {MEASURES.map((m) => (
                    <td key={m.key} className="px-3 py-2.5 tabular-nums text-ink-2">{b[m.key] != null ? fmtNumber(Number(b[m.key]), 1) : "—"}</td>
                  ))}
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => deleteBodyLog(b.id)} className="rounded-lg p-1.5 text-muted hover:bg-critical/10 hover:text-critical" aria-label="Eliminar registro">
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!body.length && (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-muted">Aún no hay registros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo registro">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha" className="col-span-2">
            <input type="date" className="input" value={form.date ?? ""} max={dayKey()} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Peso (kg)" className="col-span-2">
            <input type="number" inputMode="decimal" step="0.1" className="input text-lg font-semibold" value={form.weight ?? ""} onChange={(e) => setForm({ ...form, weight: e.target.value })} autoFocus />
          </Field>
          {MEASURES.map((m) => (
            <Field key={m.key} label={`${m.label} (${m.unit})`}>
              <input type="number" inputMode="decimal" step="0.1" className="input" value={form[m.key] ?? ""} onChange={(e) => setForm({ ...form, [m.key]: e.target.value })} placeholder="Opcional" />
            </Field>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">Consejo: pésate siempre en las mismas condiciones (por la mañana, en ayunas y tras ir al baño).</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !form.weight}>{saving ? "Guardando…" : "Guardar"}</Button>
        </div>
      </Modal>
    </div>
  );
}
