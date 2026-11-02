"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Clock, Dumbbell, History, Layers, Trash2 } from "lucide-react";
import { useData } from "@/components/data-provider";
import { Button, Card, EmptyState, LinkButton, Modal, PageHeader } from "@/components/ui";
import { fmtDate, fmtDuration, fmtNumber, oneRepMax } from "@/lib/fitness";

export default function HistoryPage() {
  const { workouts, deleteWorkout } = useData();
  const [toDelete, setToDelete] = useState<string | null>(null);

  const byMonth = useMemo(() => {
    const m = new Map<string, typeof workouts>();
    for (const w of workouts) {
      const k = fmtDate(w.date, { month: "long", year: "numeric" });
      m.set(k, [...(m.get(k) ?? []), w]);
    }
    return [...m.entries()];
  }, [workouts]);

  return (
    <div>
      <PageHeader title="Historial" subtitle={`${workouts.length} entrenamientos registrados`} action={<LinkButton href="/panel/entrenar">Nuevo entreno</LinkButton>} />
      {!workouts.length && (
        <Card>
          <EmptyState icon={<History />} title="Sin entrenamientos todavía" text="Cuando termines tu primer entrenamiento aparecerá aquí con todos los detalles." action={<LinkButton href="/panel/entrenar">Empezar ahora</LinkButton>} />
        </Card>
      )}
      <div className="space-y-8">
        {byMonth.map(([month, list]) => (
          <section key={month}>
            <h2 className="mb-3 text-sm font-semibold capitalize text-muted">
              {month} · {list.length} entrenos
            </h2>
            <div className="space-y-3">
              {list.map((w) => (
                <details key={w.id} className="card group overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
                    <div className="grid w-12 shrink-0 place-items-center rounded-xl bg-surface-3 py-2 text-center">
                      <span className="text-[10px] uppercase text-muted">{fmtDate(w.date, { weekday: "short" })}</span>
                      <span className="font-display text-lg font-semibold leading-none">{new Date(w.date).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{w.name}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="flex items-center gap-1"><Clock className="size-3.5" /> {fmtDuration(w.durationSec)}</span>
                        <span className="flex items-center gap-1"><Layers className="size-3.5" /> {w.totalSets} series</span>
                        <span className="flex items-center gap-1"><Dumbbell className="size-3.5" /> {fmtNumber(w.volume)} kg</span>
                      </p>
                    </div>
                    <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-line p-4">
                    <div className="space-y-4">
                      {w.exercises.map((ex, i) => {
                        const best = Math.max(...ex.sets.map((s) => oneRepMax(s.weight, s.reps)));
                        return (
                          <div key={i}>
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="font-medium">{ex.name}</p>
                              {best > 0 && <p className="text-xs text-muted">1RM est. {fmtNumber(best, 1)} kg</p>}
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {ex.sets.map((s, j) => (
                                <span key={j} className="rounded-lg bg-surface-3 px-2.5 py-1 text-xs tabular-nums text-ink-2">
                                  {s.weight ? `${fmtNumber(s.weight, 1)} kg × ` : ""}
                                  {s.reps}
                                  {ex.timed ? " s" : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-5 flex justify-end">
                      <Button variant="ghost" size="sm" className="text-critical" onClick={() => setToDelete(w.id)}>
                        <Trash2 className="size-4" /> Eliminar
                      </Button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="¿Eliminar entrenamiento?">
        <p className="text-sm text-ink-2">Esta acción no se puede deshacer.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setToDelete(null)}>Cancelar</Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (toDelete) await deleteWorkout(toDelete);
              setToDelete(null);
            }}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
