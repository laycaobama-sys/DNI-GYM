"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, ChefHat, Lightbulb, RefreshCw } from "lucide-react";
import { useAuth } from "./auth-provider";
import { Card, cn } from "./ui";
import { DIET_LABELS, dailyMealPlan, mealToEntries, nutritionTip, type Diet } from "@/lib/meals";
import { fmtNumber } from "@/lib/fitness";
import type { FoodEntry, NutritionDay } from "@/lib/types";

/** Menú recomendado del día, con opción de cambiar cada plato y añadirlo al diario. */
export function MealPlan({
  date,
  day,
  onAdd,
  compact,
  trainedToday,
}: {
  date: string;
  day?: NutritionDay | null;
  onAdd?: (entries: FoodEntry[]) => void;
  compact?: boolean;
  trainedToday?: boolean;
}) {
  const { profile } = useAuth();
  const [shuffle, setShuffle] = useState<Record<string, number>>({});
  const plan = useMemo(() => dailyMealPlan(profile, date, shuffle), [profile, date, shuffle]);
  const logged = new Set(day?.entries.map((e) => e.meal) ?? []);

  if (compact)
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-orange/10 text-orange">
              <ChefHat className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">Qué comer hoy</h2>
              <p className="text-xs text-muted">
                {fmtNumber(plan.totals.kcal)} kcal · {plan.totals.protein} g proteína · {DIET_LABELS[plan.diet as Diet]}
              </p>
            </div>
          </div>
          <Link href="/panel/nutricion" className="flex items-center gap-1 text-sm font-medium text-accent">
            Menú <ArrowRight className="size-4" />
          </Link>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {plan.meals.map((m) => (
            <li key={m.slot} className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/[0.03] p-3">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold", logged.has(m.slot) ? "bg-accent text-accent-ink" : "bg-white/5 text-muted")}>
                {logged.has(m.slot) ? <Check className="size-4" /> : m.time.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{m.label}</p>
                <p className="truncate text-sm font-medium">{m.name}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-athletic text-3xl font-extrabold uppercase italic">Tu menú de hoy</h2>
          <p className="text-sm text-muted">
            Ajustado a tu objetivo: {fmtNumber(plan.totals.kcal)} kcal · P {plan.totals.protein} g · C {plan.totals.carbs} g · G {plan.totals.fat} g ·{" "}
            <Link href="/panel/perfil" className="text-accent underline-offset-2 hover:underline">
              {DIET_LABELS[plan.diet as Diet]}
            </Link>
          </p>
        </div>
      </div>
      <div className="flex gap-3 rounded-2xl border border-accent/25 bg-accent/[0.05] p-4 text-sm text-ink-2">
        <Lightbulb className="size-5 shrink-0 text-accent" />
        {nutritionTip(profile, Boolean(trainedToday))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {plan.meals.map((m) => {
          const done = logged.has(m.slot);
          return (
            <Card key={m.slot} className={cn("flex flex-col p-5", done && "border-accent/30")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">
                    {m.label} · {m.time}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold leading-snug">{m.name}</h3>
                </div>
                <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-xs font-bold tabular-nums">{m.kcal} kcal</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-ink-2">
                {m.entries.map((e) => (
                  <li key={e.foodId} className="flex justify-between gap-3">
                    <span className="truncate">{e.name}</span>
                    <span className="shrink-0 tabular-nums text-muted">{e.grams} g</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs tabular-nums text-muted">
                Proteína {m.protein} g · Carbos {m.carbs} g · Grasas {m.fat} g
              </p>
              {m.tip && (
                <p className="mt-2 flex gap-1.5 text-xs text-ink-2">
                  <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-accent" /> {m.tip}
                </p>
              )}
              <div className="mt-auto flex gap-2 pt-4">
                <button
                  onClick={() => setShuffle((s) => ({ ...s, [m.slot]: (s[m.slot] ?? 0) + 1 }))}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium text-ink-2 hover:text-ink"
                  aria-label={`Otra opción para ${m.label}`}
                >
                  <RefreshCw className="size-4" /> Otra opción
                </button>
                {onAdd && (
                  <button
                    onClick={() => onAdd(mealToEntries(m))}
                    disabled={done}
                    className={cn("flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold", done ? "bg-accent/15 text-accent" : "bg-accent text-accent-ink")}
                  >
                    {done ? (
                      <>
                        <Check className="size-4" /> En tu diario
                      </>
                    ) : (
                      "Me lo he comido"
                    )}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
