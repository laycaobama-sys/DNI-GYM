"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  ACTIVITY_FACTORS,
  GOAL_LABELS,
  bmi,
  bmiCategory,
  bmr,
  fmtNumber,
  goalCalories,
  macroSplit,
  oneRepMax,
  tdee,
} from "@/lib/fitness";
import type { Activity, Goal, Sex } from "@/lib/types";
import { buttonClass, cn } from "@/lib/cn";

export type CalculatorKind = "calorias" | "macros" | "imc" | "1rm";

function NumberInput({ label, value, onChange, unit, min, max, step = 1 }: { label: string; value: number; onChange: (v: number) => void; unit?: string; min?: number; max?: number; step?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-2">{label}</span>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          className="input pr-12 tabular-nums"
          value={Number.isFinite(value) ? value : ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{unit}</span>}
      </div>
    </label>
  );
}

function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[]; label: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink-2">{label}</span>
      <div className="grid gap-1 rounded-xl border border-line bg-surface-2 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={cn("rounded-lg px-2 py-2 text-sm font-medium transition-colors", value === o.v ? "bg-accent text-accent-ink" : "text-ink-2 hover:text-ink")}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Result({ label, value, unit, big }: { label: string; value: string; unit?: string; big?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface-2 p-5", big && "border-accent/30 bg-accent/[0.06]")}>
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("mt-1 font-display font-semibold tabular-nums tracking-tight", big ? "text-4xl text-accent" : "text-2xl")}>
        {value} {unit && <span className="text-base font-normal text-muted">{unit}</span>}
      </p>
    </div>
  );
}

function CTA() {
  return (
    <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface-2 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-2">Guarda tus objetivos y registra lo que comes y entrenas cada día.</p>
      <Link href="/login" className={buttonClass("primary", "sm")}>
        Crear cuenta gratis <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

export function Calculator({ kind }: { kind: CalculatorKind }) {
  const [sex, setSex] = useState<Sex>("hombre");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [activity, setActivity] = useState<Activity>("moderado");
  const [goal, setGoal] = useState<Goal>("mantener");
  const [liftW, setLiftW] = useState(80);
  const [liftR, setLiftR] = useState(6);

  const r = useMemo(() => {
    const valid = weight > 0 && height > 0 && age > 0;
    const b = valid ? bmr(sex, weight, height, age) : 0;
    const t = valid ? tdee(sex, weight, height, age, activity) : 0;
    const g = goalCalories(t, goal);
    const m = macroSplit(g, weight || 0, goal);
    const i = valid ? bmi(weight, height) : 0;
    return { b, t, g, m, i };
  }, [sex, age, weight, height, activity, goal]);

  if (kind === "1rm") {
    const orm = oneRepMax(liftW || 0, liftR || 0);
    return (
      <div className="card p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput label="Peso levantado" value={liftW} onChange={setLiftW} unit="kg" min={0} step={2.5} />
          <NumberInput label="Repeticiones completadas" value={liftR} onChange={setLiftR} unit="reps" min={1} max={20} />
        </div>
        <div className="mt-6">
          <Result label="Tu 1RM estimado (fórmula de Epley)" value={fmtNumber(orm, 1)} unit="kg" big />
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">% del 1RM</th>
                <th className="px-4 py-2.5 font-medium">Peso</th>
                <th className="px-4 py-2.5 font-medium">Reps aprox.</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Uso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                [100, 1, "Máximo"],
                [95, 2, "Fuerza máxima"],
                [90, 4, "Fuerza"],
                [85, 6, "Fuerza"],
                [80, 8, "Hipertrofia"],
                [75, 10, "Hipertrofia"],
                [70, 12, "Hipertrofia / resistencia"],
                [65, 15, "Resistencia"],
                [60, 20, "Resistencia / técnica"],
              ].map(([p, reps, use]) => (
                <tr key={String(p)}>
                  <td className="px-4 py-2.5 tabular-nums">{p}%</td>
                  <td className="px-4 py-2.5 font-semibold tabular-nums">{fmtNumber((orm * Number(p)) / 100, 1)} kg</td>
                  <td className="px-4 py-2.5 tabular-nums">{reps}</td>
                  <td className="hidden px-4 py-2.5 text-muted sm:table-cell">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CTA />
      </div>
    );
  }

  const bodyInputs = (
    <div className="grid gap-4 sm:grid-cols-2">
      {kind !== "imc" && (
        <Segmented label="Sexo" value={sex} onChange={setSex} options={[{ v: "hombre", l: "Hombre" }, { v: "mujer", l: "Mujer" }]} />
      )}
      {kind !== "imc" && <NumberInput label="Edad" value={age} onChange={setAge} unit="años" min={14} max={100} />}
      <NumberInput label="Peso" value={weight} onChange={setWeight} unit="kg" min={30} max={300} step={0.1} />
      <NumberInput label="Altura" value={height} onChange={setHeight} unit="cm" min={120} max={230} />
      {kind !== "imc" && (
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-ink-2">Nivel de actividad</span>
          <select className="input" value={activity} onChange={(e) => setActivity(e.target.value as Activity)}>
            {Object.entries(ACTIVITY_FACTORS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label} — {v.hint}
              </option>
            ))}
          </select>
        </label>
      )}
      {kind !== "imc" && (
        <div className="sm:col-span-2">
          <Segmented
            label="Objetivo"
            value={goal}
            onChange={setGoal}
            options={(Object.keys(GOAL_LABELS) as Goal[]).map((g) => ({ v: g, l: g === "perder" ? "Perder grasa" : g === "ganar" ? "Ganar músculo" : "Mantener" }))}
          />
        </div>
      )}
    </div>
  );

  if (kind === "imc") {
    const cat = bmiCategory(r.i);
    const minW = 18.5 * (height / 100) ** 2;
    const maxW = 24.9 * (height / 100) ** 2;
    const pct = Math.min(100, Math.max(0, ((r.i - 15) / (40 - 15)) * 100));
    return (
      <div className="card p-6 sm:p-8">
        {bodyInputs}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Result label="Tu IMC" value={fmtNumber(r.i, 1)} big />
          <Result label="Clasificación OMS" value={cat.label} />
        </div>
        <div className="mt-6">
          <div className="relative h-3 rounded-full" style={{ background: "linear-gradient(90deg,#3a96dc 0%,#3a96dc 14%,#3ddc84 14%,#3ddc84 40%,#ffb020 40%,#ffb020 60%,#ff5a5f 60%)" }}>
            <span className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-bg bg-white" style={{ left: `${pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>15</span>
            <span>18,5</span>
            <span>25</span>
            <span>30</span>
            <span>40</span>
          </div>
        </div>
        <p className="mt-6 text-sm text-ink-2">
          Para tu altura, el rango de peso considerado saludable es de{" "}
          <strong className="text-ink">
            {fmtNumber(minW, 1)} – {fmtNumber(maxW, 1)} kg
          </strong>
          . Recuerda que el IMC no distingue entre músculo y grasa: si entrenas fuerza, complementa con el % de grasa o el perímetro de cintura.
        </p>
        <CTA />
      </div>
    );
  }

  return (
    <div className="card p-6 sm:p-8">
      {bodyInputs}
      {kind === "calorias" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Result label="Metabolismo basal" value={fmtNumber(r.b)} unit="kcal" />
          <Result label="Mantenimiento (TDEE)" value={fmtNumber(r.t)} unit="kcal" />
          <Result label={`Para ${GOAL_LABELS[goal].toLowerCase()}`} value={fmtNumber(r.g)} unit="kcal/día" big />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <Result label={`Calorías objetivo (${GOAL_LABELS[goal].toLowerCase()})`} value={fmtNumber(r.g)} unit="kcal/día" big />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              ["Proteína", r.m.protein, 4, "var(--color-protein)"],
              ["Carbohidratos", r.m.carbs, 4, "var(--color-carbs)"],
              ["Grasas", r.m.fat, 9, "var(--color-fat)"],
            ].map(([l, g, k, c]) => (
              <div key={String(l)} className="rounded-2xl border border-line bg-surface-2 p-5">
                <p className="flex items-center gap-2 text-sm text-muted">
                  <span className="size-2.5 rounded-full" style={{ background: String(c) }} /> {l}
                </p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                  {fmtNumber(Number(g))} <span className="text-base font-normal text-muted">g</span>
                </p>
                <p className="text-xs text-muted tabular-nums">
                  {fmtNumber(Number(g) * Number(k))} kcal · {r.g ? fmtNumber(((Number(g) * Number(k)) / r.g) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>
        </>
      )}
      <CTA />
    </div>
  );
}
