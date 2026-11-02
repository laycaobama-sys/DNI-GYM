"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Droplets, Flame, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { BarsChart } from "@/components/charts";
import { Button, Card, CardHeader, Field, Modal, PageHeader, Progress, Spinner, Tabs, cn } from "@/components/ui";
import { FOODS, FOOD_CATEGORIES, type Food } from "@/data/foods";
import { getNutritionDay, listNutritionDays, saveNutritionDay } from "@/lib/db";
import { addDays, dayKey, fmtDate, fmtNumber, parseDayKey, uid as newId } from "@/lib/fitness";
import type { FoodEntry, Meal, NutritionDay } from "@/lib/types";

const MEALS: { id: Meal; label: string }[] = [
  { id: "desayuno", label: "Desayuno" },
  { id: "comida", label: "Comida" },
  { id: "merienda", label: "Merienda" },
  { id: "cena", label: "Cena" },
  { id: "snack", label: "Snacks" },
];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function NutritionPage() {
  const { user, profile } = useAuth();
  const [date, setDate] = useState(dayKey());
  const [day, setDay] = useState<NutritionDay | null>(null);
  const [week, setWeek] = useState<NutritionDay[]>([]);
  const [adding, setAdding] = useState<Meal | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDay(null);
    getNutritionDay(user.uid, date).then((d) => alive && setDay(d));
    return () => {
      alive = false;
    };
  }, [user, date]);

  const loadWeek = useCallback(() => {
    if (!user) return;
    listNutritionDays(user.uid, dayKey(addDays(new Date(), -13))).then(setWeek).catch(() => {});
  }, [user]);
  useEffect(loadWeek, [loadWeek]);

  const persist = (next: NutritionDay) => {
    setDay(next);
    setWeek((w) => [...w.filter((x) => x.id !== next.id), next]);
    if (!user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNutritionDay(user.uid, next).catch(() => alert("No se pudo guardar. Revisa tu conexión.")), 400);
  };

  const totals = useMemo(
    () => (day?.entries ?? []).reduce((a, e) => ({ kcal: a.kcal + e.kcal, p: a.p + e.protein, c: a.c + e.carbs, f: a.f + e.fat }), { kcal: 0, p: 0, c: 0, f: 0 }),
    [day],
  );

  const chart = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const k = dayKey(addDays(new Date(), -13 + i));
        const d = week.find((x) => x.id === k);
        return { label: fmtDate(k, { day: "numeric", month: "short" }), value: Math.round(d?.entries.reduce((a, e) => a + e.kcal, 0) ?? 0), sub: fmtDate(k, { weekday: "long", day: "numeric", month: "long" }) };
      }),
    [week],
  );

  const goal = profile?.calorieGoal;
  const remaining = goal ? goal - totals.kcal : null;
  const isToday = date === dayKey();
  const waterGoal = profile?.waterGoal ?? 2500;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nutrición"
        subtitle="Registra lo que comes y controla calorías y macros"
        action={
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
            <button className="rounded-lg p-2 text-ink-2 hover:bg-white/5" onClick={() => setDate(dayKey(addDays(parseDayKey(date), -1)))} aria-label="Día anterior">
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-36 text-center text-sm font-medium capitalize">{isToday ? "Hoy" : fmtDate(date, { weekday: "short", day: "numeric", month: "short" })}</span>
            <button className="rounded-lg p-2 text-ink-2 hover:bg-white/5 disabled:opacity-30" disabled={isToday} onClick={() => setDate(dayKey(addDays(parseDayKey(date), 1)))} aria-label="Día siguiente">
              <ChevronRight className="size-4" />
            </button>
          </div>
        }
      />

      {!goal && (
        <Card className="border-warning/30 bg-warning/[0.05] p-4 text-sm text-ink-2">
          Aún no tienes objetivos nutricionales.{" "}
          <Link href="/panel/perfil" className="font-semibold text-accent underline">
            Completa tu perfil
          </Link>{" "}
          y calcularemos tus calorías y macros.
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative mx-auto grid size-40 shrink-0 place-items-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke={remaining != null && remaining < 0 ? "var(--color-critical)" : "var(--color-accent)"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(1, totals.kcal / (goal || 2000)) * 276.5} 276.5`}
                  className="transition-[stroke-dasharray] duration-700"
                />
              </svg>
              <div className="text-center">
                <p className="font-display text-3xl font-semibold tabular-nums">{fmtNumber(totals.kcal)}</p>
                <p className="text-xs text-muted">de {goal ? fmtNumber(goal) : "—"} kcal</p>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <p className="flex items-center gap-2 text-sm">
                <Flame className="size-4 text-orange" />
                {remaining == null ? (
                  <span className="text-muted">Define tu objetivo para ver las calorías restantes</span>
                ) : remaining >= 0 ? (
                  <span>
                    Te quedan <strong className="tabular-nums">{fmtNumber(remaining)} kcal</strong>
                  </span>
                ) : (
                  <span className="text-critical">
                    Has superado tu objetivo en <strong className="tabular-nums">{fmtNumber(-remaining)} kcal</strong>
                  </span>
                )}
              </p>
              {[
                ["Proteína", totals.p, profile?.proteinGoal, "var(--color-protein)"],
                ["Carbohidratos", totals.c, profile?.carbsGoal, "var(--color-carbs)"],
                ["Grasas", totals.f, profile?.fatGoal, "var(--color-fat)"],
              ].map(([l, v, g, c]) => (
                <div key={String(l)}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink-2">
                      <span className="size-2.5 rounded-full" style={{ background: String(c) }} /> {l}
                    </span>
                    <span className="tabular-nums">
                      <strong>{fmtNumber(Number(v))}</strong>
                      <span className="text-muted"> / {g ? fmtNumber(Number(g)) : "—"} g</span>
                    </span>
                  </div>
                  <Progress value={Number(v)} max={Number(g) || 100} color={String(c)} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display font-semibold">
              <Droplets className="size-5 text-sky" /> Agua
            </h3>
            <span className="text-sm tabular-nums text-muted">
              {fmtNumber((day?.waterMl ?? 0) / 1000, 2)} / {fmtNumber(waterGoal / 1000, 1)} L
            </span>
          </div>
          <div className="mt-5 grid grid-cols-8 gap-1.5">
            {Array.from({ length: Math.max(8, Math.ceil(waterGoal / 250)) }).slice(0, 16).map((_, i) => (
              <span key={i} className={cn("h-8 rounded-md transition-colors", (day?.waterMl ?? 0) > i * 250 ? "bg-sky" : "bg-white/[0.06]")} />
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" className="flex-1" disabled={!day || !day.waterMl} onClick={() => day && persist({ ...day, waterMl: Math.max(0, day.waterMl - 250) })} aria-label="Quitar 250 ml">
              <Minus className="size-4" />
            </Button>
            <Button className="flex-[3]" disabled={!day} onClick={() => day && persist({ ...day, waterMl: day.waterMl + 250 })}>
              <Plus className="size-4" /> 250 ml
            </Button>
          </div>
        </Card>
      </div>

      {!day ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {MEALS.map((m) => {
            const entries = day.entries.filter((e) => e.meal === m.id);
            const kcal = entries.reduce((a, e) => a + e.kcal, 0);
            return (
              <Card key={m.id}>
                <div className="flex items-center justify-between px-5 pb-2 pt-4">
                  <div>
                    <h3 className="font-display font-semibold">{m.label}</h3>
                    <p className="text-xs tabular-nums text-muted">{fmtNumber(kcal)} kcal</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setAdding(m.id)}>
                    <Plus className="size-4" /> Añadir
                  </Button>
                </div>
                <ul className="divide-y divide-line px-5 pb-2">
                  {entries.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.name}</p>
                        <p className="text-xs tabular-nums text-muted">
                          {fmtNumber(e.grams)} g · P {fmtNumber(e.protein)} · C {fmtNumber(e.carbs)} · G {fmtNumber(e.fat)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">{fmtNumber(e.kcal)}</span>
                      <button onClick={() => persist({ ...day, entries: day.entries.filter((x) => x.id !== e.id) })} className="rounded-lg p-1.5 text-muted hover:bg-critical/10 hover:text-critical" aria-label={`Eliminar ${e.name}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                  {!entries.length && <li className="py-4 text-sm text-muted">Sin alimentos</li>}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader title="Calorías de los últimos 14 días" subtitle={goal ? `Línea discontinua: tu objetivo (${fmtNumber(goal)} kcal)` : undefined} />
        <div className="p-3 pt-4">
          <BarsChart data={chart} unit="kcal" target={goal} />
        </div>
      </Card>

      <AddFoodModal
        meal={adding}
        onClose={() => setAdding(null)}
        onAdd={(entry) => {
          if (!day) return;
          persist({ ...day, entries: [...day.entries, entry] });
        }}
      />
    </div>
  );
}

function AddFoodModal({ meal, onClose, onAdd }: { meal: Meal | null; onClose: () => void; onAdd: (e: FoodEntry) => void }) {
  const [tab, setTab] = useState<"buscar" | "manual">("buscar");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const [sel, setSel] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [manual, setManual] = useState({ name: "", kcal: "", protein: "", carbs: "", fat: "" });

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (meal) { setSel(null); setQ(""); setManual({ name: "", kcal: "", protein: "", carbs: "", fat: "" }); } }, [meal]);

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return FOODS.filter((f) => (cat === "Todas" || f.category === cat) && (!nq || norm(f.name).includes(nq))).slice(0, 60);
  }, [q, cat]);

  const k = grams / 100;
  const add = () => {
    if (!meal) return;
    if (tab === "buscar" && sel) {
      onAdd({
        id: newId(),
        foodId: sel.id,
        name: sel.name,
        grams,
        kcal: Math.round(sel.kcal * k),
        protein: Math.round(sel.protein * k * 10) / 10,
        carbs: Math.round(sel.carbs * k * 10) / 10,
        fat: Math.round(sel.fat * k * 10) / 10,
        meal,
      });
    } else if (tab === "manual" && manual.name && manual.kcal) {
      const n = (s: string) => parseFloat(s.replace(",", ".")) || 0;
      onAdd({ id: newId(), name: manual.name, grams: 0, kcal: n(manual.kcal), protein: n(manual.protein), carbs: n(manual.carbs), fat: n(manual.fat), meal });
    } else return;
    onClose();
  };

  return (
    <Modal open={Boolean(meal)} onClose={onClose} title={`Añadir a ${MEALS.find((m) => m.id === meal)?.label.toLowerCase() ?? ""}`}>
      <Tabs value={tab} onChange={setTab} items={[{ value: "buscar", label: "Buscar alimento" }, { value: "manual", label: "Entrada manual" }]} className="mb-4 w-full [&>button]:flex-1" />
      {tab === "buscar" ? (
        sel ? (
          <div>
            <button className="text-sm text-accent" onClick={() => setSel(null)}>
              ← Volver a la lista
            </button>
            <h3 className="mt-3 font-display text-xl font-semibold">{sel.name}</h3>
            <p className="text-xs text-muted">Por 100 g: {sel.kcal} kcal · P {sel.protein} · C {sel.carbs} · G {sel.fat}</p>
            <Field label="Cantidad (g)" className="mt-5">
              <input type="number" inputMode="decimal" className="input text-lg font-semibold" value={grams || ""} onChange={(e) => setGrams(parseFloat(e.target.value) || 0)} autoFocus />
            </Field>
            <div className="mt-2 flex flex-wrap gap-2">
              {[sel.portion, 50, 100, 150, 200].filter((v, i, a) => a.indexOf(v) === i).map((g) => (
                <button key={g} onClick={() => setGrams(g)} className={cn("rounded-full border px-3 py-1 text-xs", grams === g ? "border-accent text-accent" : "border-line text-ink-2")}>
                  {g === sel.portion && sel.portionLabel ? `${sel.portionLabel} (${g} g)` : `${g} g`}
                </button>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2 text-center">
              {[
                ["kcal", sel.kcal * k],
                ["Prot.", sel.protein * k],
                ["Carb.", sel.carbs * k],
                ["Grasa", sel.fat * k],
              ].map(([l, v]) => (
                <div key={String(l)} className="rounded-xl bg-surface-2 p-3">
                  <p className="font-display text-lg font-semibold tabular-nums">{fmtNumber(Number(v))}</p>
                  <p className="text-xs text-muted">{l}</p>
                </div>
              ))}
            </div>
            <Button className="mt-6 w-full" size="lg" onClick={add} disabled={!grams}>
              Añadir
            </Button>
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input className="input pl-9" placeholder="Buscar (pollo, arroz, plátano…)" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            </div>
            <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {["Todas", ...FOOD_CATEGORIES].map((c) => (
                <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-full border px-3 py-1 text-xs", cat === c ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-2")}>
                  {c}
                </button>
              ))}
            </div>
            <ul className="mt-3 max-h-[45vh] divide-y divide-line overflow-y-auto">
              {list.map((f) => (
                <li key={f.id}>
                  <button
                    className="flex w-full items-center justify-between gap-3 px-1 py-2.5 text-left hover:bg-white/[0.03]"
                    onClick={() => {
                      setSel(f);
                      setGrams(f.portion);
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{f.name}</span>
                      <span className="text-xs text-muted">{f.category} · P {f.protein} · C {f.carbs} · G {f.fat} (100 g)</span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-ink-2">{f.kcal} kcal</span>
                  </button>
                </li>
              ))}
              {!list.length && <li className="py-8 text-center text-sm text-muted">Sin resultados. Prueba la entrada manual.</li>}
            </ul>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre" className="col-span-2">
            <input className="input" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} placeholder="Ej. Menú del día" autoFocus />
          </Field>
          <Field label="Calorías (kcal)" className="col-span-2">
            <input type="number" inputMode="decimal" className="input" value={manual.kcal} onChange={(e) => setManual({ ...manual, kcal: e.target.value })} />
          </Field>
          <Field label="Proteína (g)">
            <input type="number" inputMode="decimal" className="input" value={manual.protein} onChange={(e) => setManual({ ...manual, protein: e.target.value })} />
          </Field>
          <Field label="Carbohidratos (g)">
            <input type="number" inputMode="decimal" className="input" value={manual.carbs} onChange={(e) => setManual({ ...manual, carbs: e.target.value })} />
          </Field>
          <Field label="Grasas (g)">
            <input type="number" inputMode="decimal" className="input" value={manual.fat} onChange={(e) => setManual({ ...manual, fat: e.target.value })} />
          </Field>
          <Button className="col-span-2 mt-2" size="lg" onClick={add} disabled={!manual.name || !manual.kcal}>
            Añadir
          </Button>
        </div>
      )}
    </Modal>
  );
}
