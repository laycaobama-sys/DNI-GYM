"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock,
  Dumbbell,
  Info,
  Minus,
  MoreHorizontal,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Timer,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { usePlayer } from "@/components/workout-player";
import { activeRoutine, nextRoutineDay, routineDaySession } from "@/lib/plan";
import { ROUTINE_COVER } from "@/data/challenges";
import { useData } from "@/components/data-provider";
import { ExerciseBrowser } from "@/components/exercise-browser";
import { ExerciseQuickView } from "@/components/exercise-detail";
import { Badge, Button, Card, Modal, PageHeader, cn } from "@/components/ui";
import { EXERCISE_BY_SLUG, exerciseImages, type Exercise } from "@/data/exercises";
import { ROUTINES } from "@/data/routines";
import { logEvent } from "@/lib/db";
import { bestSetByExercise, fmtDate, fmtDuration, fmtNumber, oneRepMax, uid as newId, workoutStats } from "@/lib/fitness";
import type { Workout, WorkoutExercise } from "@/lib/types";

interface Draft {
  id: string;
  name: string;
  startedAt: number;
  routineSlug?: string;
  exercises: WorkoutExercise[];
}

const draftKey = (uid: string) => `dnigym:draft:${uid}`;

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

const mmss = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.max(0, Math.floor(sec % 60))).padStart(2, "0")}`;

export default function TrainPage() {
  const { user, profile } = useAuth();
  const { workouts, saveWorkout } = useData();
  const player = usePlayer();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [picker, setPicker] = useState(false);
  const [info, setInfo] = useState<Exercise | null>(null);
  const [rest, setRest] = useState<{ until: number; total: number } | null>(null);
  const [summary, setSummary] = useState<{ w: Workout; prs: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const now = useNow(Boolean(draft) || Boolean(rest));
  const restNotified = useRef(false);

  // últimas series por ejercicio (para mostrar "anterior" y precargar pesos)
  const lastSets = useMemo(() => {
    const map: Record<string, WorkoutExercise> = {};
    for (const w of workouts) for (const ex of w.exercises) if (!map[ex.slug]) map[ex.slug] = ex;
    return map;
  }, [workouts]);

  const makeExercise = useCallback(
    (slug: string, sets = 3, target?: string, restSec?: number): WorkoutExercise => {
      const e = EXERCISE_BY_SLUG[slug];
      const prev = lastSets[slug];
      const defReps = parseInt(target ?? "") || 10;
      return {
        slug,
        name: e?.name ?? slug,
        timed: e?.timed,
        rest: restSec ?? 90,
        target,
        sets: Array.from({ length: sets }, (_, i) => ({
          weight: prev?.sets[i]?.weight ?? prev?.sets[prev.sets.length - 1]?.weight ?? 0,
          reps: prev?.sets[i]?.reps ?? defReps,
          done: false,
        })),
      };
    },
    [lastSets],
  );

  // cargar borrador o iniciar desde ?rutina=&dia=
  useEffect(() => {
    if (!user) return;
    let d: Draft | null = null;
    try {
      const raw = localStorage.getItem(draftKey(user.uid));
      if (raw) d = JSON.parse(raw);
    } catch {}
    const p = new URLSearchParams(window.location.search);
    const rs = p.get("rutina");
    if (!d && rs) {
      const r = ROUTINES.find((x) => x.slug === rs);
      const day = r?.days[Number(p.get("dia") ?? 0)];
      if (r && day) {
        d = {
          id: newId(),
          name: `${r.name} · ${day.name}`,
          startedAt: Date.now(),
          routineSlug: r.slug,
          exercises: day.items.map((it) => makeExercise(it.slug, it.sets, it.reps, it.rest)),
        };
      }
      window.history.replaceState(null, "", "/panel/entrenar");
    }
    /* eslint-disable react-hooks/set-state-in-effect */
    setDraft(d);
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // persistir borrador
  useEffect(() => {
    if (!user || !loaded) return;
    try {
      if (draft) localStorage.setItem(draftKey(user.uid), JSON.stringify(draft));
      else localStorage.removeItem(draftKey(user.uid));
    } catch {}
  }, [draft, user, loaded]);

  // aviso fin de descanso
  const restLeft = rest ? Math.ceil((rest.until - now) / 1000) : 0;
  useEffect(() => {
    if (rest && restLeft <= 0 && !restNotified.current) {
      restNotified.current = true;
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {}
      const t = setTimeout(() => setRest(null), 2500);
      return () => clearTimeout(t);
    }
  }, [rest, restLeft]);

  const start = (d: Omit<Draft, "id" | "startedAt">) => setDraft({ ...d, id: newId(), startedAt: Date.now() });

  const update = (fn: (d: Draft) => Draft) => setDraft((d) => (d ? fn(structuredClone(d)) : d));

  const toggleSet = (ei: number, si: number) => {
    if (!draft) return;
    const willBeDone = !draft.exercises[ei].sets[si].done;
    const restSec = draft.exercises[ei].rest ?? 90;
    update((d) => {
      d.exercises[ei].sets[si].done = willBeDone;
      return d;
    });
    if (willBeDone && restSec > 0) {
      restNotified.current = false;
      setRest({ until: Date.now() + restSec * 1000, total: restSec });
    }
  };

  const finish = async () => {
    if (!draft || !user) return;
    const exercises = draft.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
      .filter((e) => e.sets.length > 0);
    if (!exercises.length) {
      alert("Marca al menos una serie como completada (✓) antes de terminar.");
      return;
    }
    setSaving(true);
    const prevBest = bestSetByExercise(workouts);
    const w: Workout = {
      id: draft.id,
      name: draft.name || "Entrenamiento",
      date: draft.startedAt,
      durationSec: Math.round((Date.now() - draft.startedAt) / 1000),
      routineSlug: draft.routineSlug,
      exercises,
      ...workoutStats({ exercises }),
    };
    try {
      const saved = await saveWorkout(w);
      const prs = exercises
        .filter((e) => {
          const best = Math.max(0, ...e.sets.map((s) => oneRepMax(s.weight, s.reps)));
          return best > 0 && best > (prevBest[e.slug]?.e1rm ?? 0) && prevBest[e.slug];
        })
        .map((e) => e.name);
      logEvent({ type: "workout_completed", uid: user.uid, email: user.email, message: `${w.name} · ${w.totalSets} series · ${w.volume} kg` });
      setDraft(null);
      setRest(null);
      setSummary({ w: saved, prs });
    } catch (e) {
      alert("No se pudo guardar el entrenamiento. Revisa tu conexión e inténtalo de nuevo. Tu progreso sigue guardado en este dispositivo.");
      logEvent({ type: "client_error", uid: user.uid, message: `save workout: ${String((e as Error).message ?? e)}` });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  // ───────────── Resumen tras terminar ─────────────
  if (summary)
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent text-accent-ink">
          <Trophy className="size-8" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">¡Entrenamiento completado!</h1>
        <p className="mt-2 text-muted">{summary.w.name}</p>
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            ["Duración", fmtDuration(summary.w.durationSec)],
            ["Series", String(summary.w.totalSets)],
            ["Volumen", `${fmtNumber(summary.w.volume)} kg`],
          ].map(([l, v]) => (
            <Card key={l} className="p-4">
              <p className="text-xs text-muted">{l}</p>
              <p className="mt-1 font-display text-xl font-semibold tabular-nums">{v}</p>
            </Card>
          ))}
        </div>
        {summary.prs.length > 0 && (
          <Card className="mt-4 border-warning/30 bg-warning/[0.06] p-5 text-left">
            <p className="flex items-center gap-2 font-semibold text-warning">
              <Trophy className="size-4" /> ¡Nuevos récords personales!
            </p>
            <ul className="mt-2 space-y-1 text-sm text-ink-2">
              {summary.prs.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
          </Card>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => router.push("/panel/historial")}>
            Ver historial
          </Button>
          <Button onClick={() => router.push("/panel")}>Ir al inicio</Button>
        </div>
      </div>
    );

  // ───────────── Selección de entrenamiento ─────────────
  if (!draft)
    return (
      <div>
        <PageHeader title="Entrenar" subtitle="Entreno guiado paso a paso o registro libre con pesos." />
        {(() => {
          const r = activeRoutine(profile);
          const n = nextRoutineDay(r, workouts);
          return (
            <button
              onClick={() => player.start(routineDaySession(r, n.index))}
              className="group relative mb-4 flex min-h-48 w-full overflow-hidden rounded-3xl border border-white/10 text-left"
            >
              <Image src={ROUTINE_COVER(r.slug)} alt="" fill sizes="(max-width: 1024px) 100vw, 70vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
              <span className="relative flex flex-col justify-end p-6">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">Entreno guiado · {r.name}</span>
                <span className="mt-1 font-athletic text-5xl font-extrabold uppercase italic leading-none">{n.day.name}</span>
                <span className="mt-1 text-sm text-white/70">{n.day.focus}</span>
                <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 font-athletic text-lg font-extrabold uppercase italic text-accent-ink">
                  <Play className="size-4 fill-current" /> Empezar
                </span>
              </span>
            </button>
          );
        })()}
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => start({ name: "Entrenamiento libre", exercises: [] })}
            className="card group flex items-center gap-4 border-accent/30 p-5 text-left transition-colors hover:bg-accent/[0.04]"
          >
            <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-ink">
              <Plus className="size-6" />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold">Entrenamiento libre</span>
              <span className="text-sm text-muted">Empieza vacío y añade los ejercicios que quieras.</span>
            </span>
          </button>
          {workouts[0] && (
            <button
              onClick={() =>
                start({
                  name: workouts[0].name,
                  routineSlug: workouts[0].routineSlug,
                  exercises: workouts[0].exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, done: false })) })),
                })
              }
              className="card flex items-center gap-4 p-5 text-left transition-colors hover:border-line-strong"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-surface-3 text-ink-2">
                <RotateCcw className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-lg font-semibold">Repetir último</span>
                <span className="block truncate text-sm text-muted">
                  {workouts[0].name} · {fmtDate(workouts[0].date, { day: "numeric", month: "short" })}
                </span>
              </span>
            </button>
          )}
        </div>

        <h2 className="mt-10 font-display text-xl font-semibold">Rutinas</h2>
        <div className="mt-4 space-y-3">
          {ROUTINES.map((r) => (
            <details key={r.slug} className="card group overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-sm text-muted">{r.tagline}</p>
                </div>
                <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="grid gap-3 border-t border-line p-4 sm:grid-cols-2">
                {r.days.map((d) => (
                  <button
                    key={d.name}
                    onClick={() =>
                      start({
                        name: `${r.name} · ${d.name}`,
                        routineSlug: r.slug,
                        exercises: d.items.map((it) => makeExercise(it.slug, it.sets, it.reps, it.rest)),
                      })
                    }
                    className="rounded-xl border border-line bg-surface-2 p-4 text-left transition-colors hover:border-accent/40"
                  >
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-xs text-muted">{d.focus}</p>
                    <p className="mt-2 text-xs text-ink-2">{d.items.length} ejercicios · registrar con pesos →</p>
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    );

  // ───────────── Entrenamiento activo ─────────────
  const elapsed = Math.round((now - draft.startedAt) / 1000);
  const doneSets = draft.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);
  const totalSets = draft.exercises.reduce((a, e) => a + e.sets.length, 0);

  return (
    <div className="pb-24">
      <div className="sticky top-14 z-20 -mx-4 mb-6 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <input
              value={draft.name}
              onChange={(e) => update((d) => ({ ...d, name: e.target.value }))}
              className="w-full truncate bg-transparent font-display text-lg font-semibold outline-none"
              aria-label="Nombre del entrenamiento"
            />
            <p className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="size-3.5 text-accent" /> {mmss(elapsed)}
              </span>
              <span className="tabular-nums">
                {doneSets}/{totalSets} series
              </span>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmDiscard(true)} aria-label="Descartar">
              <Trash2 className="size-4" />
            </Button>
            <Button size="sm" onClick={finish} disabled={saving}>
              <Check className="size-4" /> {saving ? "Guardando…" : "Terminar"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {draft.exercises.map((ex, ei) => {
          const e = EXERCISE_BY_SLUG[ex.slug];
          const prev = lastSets[ex.slug];
          return (
            <Card key={ex.slug + ei} className="overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <button onClick={() => e && setInfo(e)} className="shrink-0" aria-label={`Ver técnica de ${ex.name}`}>
                  {e ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={exerciseImages(e)[1]} alt="" className="h-12 w-[72px] rounded-lg bg-white object-cover" />
                  ) : (
                    <span className="grid h-12 w-[72px] place-items-center rounded-lg bg-surface-3">
                      <Dumbbell className="size-5 text-muted" />
                    </span>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <button onClick={() => e && setInfo(e)} className="flex max-w-full items-center gap-1.5 text-left font-semibold hover:text-accent">
                    <span className="truncate">{ex.name}</span> <Info className="size-3.5 shrink-0 text-muted" />
                  </button>
                  <p className="text-xs text-muted">
                    {ex.target ? `Objetivo ${ex.sets.length} × ${ex.target}` : `${ex.sets.length} series`} · descanso {ex.rest ?? 90} s
                  </p>
                </div>
                <ExerciseMenu
                  onRemove={() => update((d) => ({ ...d, exercises: d.exercises.filter((_, i) => i !== ei) }))}
                  onUp={ei > 0 ? () => update((d) => { [d.exercises[ei - 1], d.exercises[ei]] = [d.exercises[ei], d.exercises[ei - 1]]; return d; }) : undefined}
                  onRest={(r) => update((d) => { d.exercises[ei].rest = r; return d; })}
                />
              </div>
              <div className="px-4 pb-4">
                <div className="grid grid-cols-[2rem_1fr_4.5rem_4.5rem_2.5rem] items-center gap-2 px-1 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted sm:grid-cols-[2.5rem_1fr_6rem_6rem_2.75rem]">
                  <span>Serie</span>
                  <span>Anterior</span>
                  <span className="text-center">Kg</span>
                  <span className="text-center">{ex.timed ? "Seg" : "Reps"}</span>
                  <span />
                </div>
                <div className="space-y-1.5">
                  {ex.sets.map((s, si) => (
                    <div
                      key={si}
                      className={cn(
                        "grid grid-cols-[2rem_1fr_4.5rem_4.5rem_2.5rem] items-center gap-2 rounded-xl px-1 py-1 transition-colors sm:grid-cols-[2.5rem_1fr_6rem_6rem_2.75rem]",
                        s.done && "bg-accent/[0.07]",
                      )}
                    >
                      <span className="grid size-7 place-items-center rounded-lg bg-surface-3 text-xs font-semibold">{si + 1}</span>
                      <span className="truncate text-xs text-muted tabular-nums">
                        {prev?.sets[si] ? `${fmtNumber(prev.sets[si].weight, 1)} kg × ${prev.sets[si].reps}` : "—"}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min={0}
                        value={Number.isFinite(s.weight) ? s.weight : ""}
                        onChange={(ev) => update((d) => { d.exercises[ei].sets[si].weight = parseFloat(ev.target.value); return d; })}
                        className="input h-9 px-2 text-center tabular-nums"
                        aria-label={`Kg serie ${si + 1}`}
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={Number.isFinite(s.reps) ? s.reps : ""}
                        onChange={(ev) => update((d) => { d.exercises[ei].sets[si].reps = parseInt(ev.target.value); return d; })}
                        className="input h-9 px-2 text-center tabular-nums"
                        aria-label={`Repeticiones serie ${si + 1}`}
                      />
                      <button
                        onClick={() => toggleSet(ei, si)}
                        className={cn(
                          "grid size-9 place-items-center rounded-lg border transition-colors",
                          s.done ? "border-accent bg-accent text-accent-ink" : "border-line-strong text-muted hover:border-accent hover:text-accent",
                        )}
                        aria-label={s.done ? "Desmarcar serie" : "Marcar serie completada"}
                        aria-pressed={s.done}
                      >
                        <Check className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      update((d) => {
                        const last = d.exercises[ei].sets.at(-1);
                        d.exercises[ei].sets.push({ weight: last?.weight ?? 0, reps: last?.reps ?? 10, done: false });
                        return d;
                      })
                    }
                  >
                    <Plus className="size-4" /> Añadir serie
                  </Button>
                  {ex.sets.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => update((d) => { d.exercises[ei].sets.pop(); return d; })}
                      aria-label="Quitar última serie"
                    >
                      <Minus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Button variant="outline" size="lg" className="mt-4 w-full border-dashed" onClick={() => setPicker(true)}>
        <Plus className="size-5" /> Añadir ejercicio
      </Button>

      {/* Temporizador de descanso */}
      {rest && (
        <div className="fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 lg:bottom-6 lg:left-64">
          <div className="card flex w-full max-w-md items-center gap-4 border-accent/40 bg-surface-2 p-3 pl-4 shadow-2xl shadow-black/60">
            <Timer className={cn("size-5 shrink-0", restLeft <= 0 ? "text-good" : "text-accent")} />
            <div className="flex-1">
              <p className="text-xs text-muted">{restLeft <= 0 ? "¡A por la siguiente serie!" : "Descanso"}</p>
              <p className="font-display text-xl font-semibold tabular-nums">{mmss(Math.max(0, restLeft))}</p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-accent transition-[width] duration-1000 ease-linear" style={{ width: `${Math.max(0, (restLeft / rest.total) * 100)}%` }} />
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setRest((r) => (r ? { ...r, until: r.until + 15000, total: r.total + 15 } : r))}>
              +15 s
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRest(null)} aria-label="Saltar descanso">
              <SkipForward className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Modal open={picker} onClose={() => setPicker(false)} title="Añadir ejercicio" wide>
        <ExerciseBrowser
          syncUrl={false}
          compact
          onSelect={(e) => {
            update((d) => ({ ...d, exercises: [...d.exercises, makeExercise(e.slug, 3)] }));
            setPicker(false);
          }}
        />
      </Modal>

      <Modal open={Boolean(info)} onClose={() => setInfo(null)} title={info?.name ?? ""} wide>
        {info && <ExerciseQuickView e={info} />}
      </Modal>

      <Modal open={confirmDiscard} onClose={() => setConfirmDiscard(false)} title="¿Descartar entrenamiento?">
        <p className="text-sm text-ink-2">Se perderán las series de este entrenamiento que aún no has guardado.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setDraft(null);
              setRest(null);
              setConfirmDiscard(false);
            }}
          >
            Descartar
          </Button>
        </div>
      </Modal>

      {!draft.exercises.length && (
        <p className="mt-6 text-center text-sm text-muted">
          Añade tu primer ejercicio o{" "}
          <Link href="/panel/ejercicios" className="text-accent underline">
            explora la biblioteca
          </Link>
          .
        </p>
      )}
      <div className="mt-6 flex justify-center">
        <Badge tone="neutral">Tu entreno se guarda automáticamente en este dispositivo hasta que pulses «Terminar».</Badge>
      </div>
    </div>
  );
}

function ExerciseMenu({ onRemove, onUp, onRest }: { onRemove: () => void; onUp?: () => void; onRest: (s: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-ink" aria-label="Opciones del ejercicio">
        <MoreHorizontal className="size-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="card absolute right-0 z-20 mt-1 w-56 overflow-hidden bg-surface-2 p-1 shadow-xl">
            {onUp && (
              <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5" onClick={() => { onUp(); setOpen(false); }}>
                Subir en la lista
              </button>
            )}
            <p className="px-3 pt-2 text-xs text-muted">Descanso</p>
            <div className="grid grid-cols-4 gap-1 p-2">
              {[60, 90, 120, 180].map((s) => (
                <button key={s} className="rounded-md bg-surface-3 py-1 text-xs hover:bg-line" onClick={() => { onRest(s); setOpen(false); }}>
                  {s}s
                </button>
              ))}
            </div>
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-critical hover:bg-critical/10" onClick={() => { onRemove(); setOpen(false); }}>
              <X className="size-4" /> Quitar ejercicio
            </button>
          </div>
        </>
      )}
    </div>
  );
}
