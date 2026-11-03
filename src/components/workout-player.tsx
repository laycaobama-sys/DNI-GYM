"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Info,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  SkipForward,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { useData } from "./data-provider";
import { ExerciseDemo } from "./exercise-demo";
import { ExerciseQuickView } from "./exercise-detail";
import { Modal, cn } from "./ui";
import { EXERCISE_BY_SLUG, exerciseImages } from "@/data/exercises";
import type { GuidedSession, PlanItem } from "@/data/challenges";
import { PAIN_LABELS, adaptItems, substitutes, suggestedWeight, type AdaptOptions, type Pain } from "@/lib/adapt";
import { estimateKcal } from "@/lib/plan";
import { bestSetByExercise, fmtDuration, fmtNumber, oneRepMax, uid as newId, workoutStats } from "@/lib/fitness";
import { logEvent } from "@/lib/db";
import type { Workout, WorkoutExercise } from "@/lib/types";

// ───────────────────────── contexto ─────────────────────────

interface PlayerCtx {
  start: (s: GuidedSession) => void;
}
const Ctx = createContext<PlayerCtx | null>(null);

export function usePlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer debe usarse dentro de <PlayerProvider>");
  return c;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<GuidedSession | null>(null);
  const value = useMemo(() => ({ start: (s: GuidedSession) => setSession(s) }), []);
  return (
    <Ctx.Provider value={value}>
      {children}
      {session && <WorkoutPlayer key={session.title + session.items.length} session={session} onClose={() => setSession(null)} />}
    </Ctx.Provider>
  );
}

// ───────────────────────── utilidades ─────────────────────────

let audioCtx: AudioContext | null = null;
function beep(freq = 880, ms = 160, vol = 0.15) {
  try {
    audioCtx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq;
    o.type = "sine";
    g.gain.value = vol;
    o.connect(g).connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
    o.stop(audioCtx.currentTime + ms / 1000);
  } catch {}
}
const vibrate = (p: number | number[]) => {
  try {
    navigator.vibrate?.(p);
  } catch {}
};
const mmss = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, Math.ceil(s)) % 60).padStart(2, "0")}`;

function Ring({ value, max, size = 220, stroke = 12, color = "var(--color-accent)", children }: { value: number; max: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${pct * c} ${c}`}
          style={{ transition: "stroke-dasharray 1s linear" }}
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}

function Stepper({ label, value, onChange, step = 1, unit }: { label: string; value: number; onChange: (v: number) => void; step?: number; unit?: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
      <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-1">
        <button onClick={() => onChange(Math.max(0, +(value - step).toFixed(2)))} className="grid size-10 place-items-center rounded-xl bg-white/[0.06] text-ink active:scale-95" aria-label={`Restar ${label}`}>
          <Minus className="size-4" />
        </button>
        <span className="font-display text-2xl font-semibold tabular-nums">
          {fmtNumber(value, 1)}
          {unit && <span className="ml-0.5 text-sm text-muted">{unit}</span>}
        </span>
        <button onClick={() => onChange(+(value + step).toFixed(2))} className="grid size-10 place-items-center rounded-xl bg-white/[0.06] text-ink active:scale-95" aria-label={`Sumar ${label}`}>
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ───────────────────────── reproductor ─────────────────────────

type Phase = "intro" | "ready" | "work" | "rest" | "done";
interface Step {
  item: number;
  set: number;
}
interface Result {
  weight: number;
  reps: number;
  done: boolean;
}

function WorkoutPlayer({ session, onClose }: { session: GuidedSession; onClose: () => void }) {
  const { user, profile, updateProfile } = useAuth();
  const { workouts, saveWorkout, latestWeight } = useData();
  // ajustes de la sesión (tiempo, lugar y molestias)
  const [adapt, setAdapt] = useState<AdaptOptions>(() => ({
    // por defecto, la sesión se adapta a lo que el cliente indicó en su perfil
    minutes: profile?.sessionMinutes && profile.sessionMinutes <= 45 ? profile.sessionMinutes : null,
    place: profile?.place === "casa" ? "casa" : null,
    pains: [],
  }));
  const adapted = useMemo(() => adaptItems(session.items, adapt), [session.items, adapt]);
  const [items, setItems] = useState<PlanItem[]>(session.items);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(adapted.items);
  }, [adapted]);
  const steps = useMemo<Step[]>(() => items.flatMap((it, item) => Array.from({ length: it.sets }, (_, set) => ({ item, set }))), [items]);

  // última sesión y mejor marca por ejercicio
  const lastSets = useMemo(() => {
    const m: Record<string, WorkoutExercise> = {};
    for (const w of workouts) for (const e of w.exercises) if (!m[e.slug]) m[e.slug] = e;
    return m;
  }, [workouts]);
  const bestPrev = useMemo(() => bestSetByExercise(workouts), [workouts]);
  const [prToast, setPrToast] = useState<string | null>(null);
  const [swap, setSwap] = useState(false);
  const [feeling, setFeeling] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const initialResult = (it: PlanItem, set: number): Result => {
    const prev = lastSets[it.slug];
    const prevSet = prev?.sets[set] ?? prev?.sets[prev.sets.length - 1];
    const reps = it.reps ?? it.seconds ?? 10;
    const weight = prevSet?.weight || suggestedWeight(bestPrev[it.slug]?.e1rm ?? 0, reps);
    return { weight, reps, done: false };
  };

  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [endedAt, setEndedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [deadline, setDeadline] = useState(0); // fin de la cuenta atrás actual (ready/rest/timed)
  const [total, setTotal] = useState(0);
  const [paused, setPaused] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const [info, setInfo] = useState(false);
  const [saved, setSaved] = useState<Workout | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const lastBeep = useRef(-1);
  const wake = useRef<{ release: () => Promise<void> } | null>(null);

  const step = steps[idx];
  const item = step ? items[step.item] : undefined;
  const ex = item ? EXERCISE_BY_SLUG[item.slug] : undefined;
  const timed = item?.seconds != null;
  const bodyweight = ex?.equipment === "peso corporal" || timed;
  const left = paused != null ? (deadline - paused) / 1000 : (deadline - now) / 1000;

  // reloj
  useEffect(() => {
    if (phase === "intro" || phase === "done") return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [phase]);

  // bloqueo de pantalla y bloqueo de scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    (navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock
      ?.request("screen")
      .then((l) => (wake.current = l))
      .catch(() => {});
    return () => {
      document.body.style.overflow = "";
      wake.current?.release().catch(() => {});
    };
  }, []);

  const countdown = (seconds: number) => {
    const t = Date.now();
    setNow(t);
    setDeadline(t + seconds * 1000);
    setTotal(seconds);
    setPaused(null);
    lastBeep.current = -1;
  };

  const startWork = (i: number) => {
    setIdx(i);
    setPhase("work");
    const it = items[steps[i].item];
    if (it.seconds != null) countdown(it.seconds);
  };

  const begin = () => {
    setResults(steps.map((s) => initialResult(items[s.item], s.set)));
    beep(660, 80, 0.001); // desbloquea el audio en iOS
    setStartedAt(Date.now());
    setPhase("ready");
    countdown(5);
  };

  const finish = async () => {
    setPhase("done");
    setEndedAt(Date.now());
    vibrate([100, 60, 100, 60, 300]);
    if (sound) [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 180), i * 160));
    if (!user) return;
    const byItem = new Map<number, WorkoutExercise>();
    steps.forEach((s, i) => {
      const r = results[i];
      if (!r.done) return;
      const it = items[s.item];
      const e = EXERCISE_BY_SLUG[it.slug];
      if (!byItem.has(s.item)) byItem.set(s.item, { slug: it.slug, name: e?.name ?? it.slug, timed: e?.timed, rest: it.rest, target: it.seconds ? `${it.seconds} s` : `${it.reps}`, sets: [] });
      byItem.get(s.item)!.sets.push({ weight: r.weight || 0, reps: r.reps || 0, done: true });
    });
    const exercises = [...byItem.values()];
    if (!exercises.length) return;
    const w: Workout = {
      id: newId(),
      name: session.title,
      date: startedAt || Date.now(),
      durationSec: Math.round((Date.now() - (startedAt || Date.now())) / 1000),
      routineSlug: session.routineSlug,
      exercises,
      ...workoutStats({ exercises }),
    };
    try {
      const s = await saveWorkout(w);
      setSaved(s);
      logEvent({ type: "workout_completed", uid: user.uid, email: user.email, message: `${w.name} · guiado · ${w.totalSets} series` });
      if (session.challenge) {
        const prev = profile?.challenges ?? {};
        const days = new Set(prev[session.challenge.slug] ?? []);
        days.add(session.challenge.day);
        await updateProfile({ challenges: { ...prev, [session.challenge.slug]: [...days].sort((a, b) => a - b) } });
      }
    } catch {
      setSaved({ ...w, id: "" });
    }
  };

  const next = () => {
    if (idx >= steps.length - 1) {
      finish();
      return;
    }
    const rest = items[steps[idx].item].rest;
    if (rest > 0) {
      setPhase("rest");
      countdown(rest);
    } else startWork(idx + 1);
  };

  const completeSet = () => {
    const r = results[idx];
    if (r && item && r.weight > 0 && r.reps > 0) {
      const e1 = oneRepMax(r.weight, r.reps);
      const prevBest = Math.max(
        bestPrev[item.slug]?.e1rm ?? 0,
        ...results.filter((x, i) => i < idx && x.done && steps[i].item === step.item).map((x) => oneRepMax(x.weight, x.reps)),
      );
      if (bestPrev[item.slug] && e1 > prevBest) {
        setPrToast(`¡Nuevo récord en ${ex?.name}! ${fmtNumber(r.weight, 1)} kg × ${r.reps}`);
        if (sound) [784, 988, 1319].forEach((f, i) => setTimeout(() => beep(f, 140), i * 120));
        vibrate([80, 40, 80, 40, 200]);
        setTimeout(() => setPrToast(null), 3500);
      }
    }
    setResults((rs) => rs.map((x, i) => (i === idx ? { ...x, done: true } : x)));
    vibrate(40);
    next();
  };

  /** sustituye el ejercicio actual (y sus series pendientes) por otro equivalente */
  const swapExercise = (slug: string) => {
    if (!step) return;
    const target = items[step.item];
    const alt = EXERCISE_BY_SLUG[slug];
    setItems((list) =>
      list.map((it, i) => (i === step.item ? { ...it, slug, seconds: alt?.timed ? it.seconds ?? 30 : undefined, reps: alt?.timed ? undefined : it.reps ?? 12 } : it)),
    );
    setResults((rs) =>
      rs.map((x, i) => (steps[i].item === step.item && !x.done ? initialResult({ ...target, slug }, steps[i].set) : x)),
    );
    setSwap(false);
  };

  // fin de cuenta atrás + pitidos de 3-2-1
  useEffect(() => {
    if (paused != null || !(phase === "ready" || phase === "rest" || (phase === "work" && timed))) return;
    const s = Math.ceil(left);
    if (s <= 3 && s >= 1 && lastBeep.current !== s) {
      lastBeep.current = s;
      if (sound) beep(s === 1 ? 990 : 660, 120);
    }
    if (left <= 0) {
      if (phase === "ready") {
        if (sound) beep(1200, 250);
        vibrate(200);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        startWork(idx);
      } else if (phase === "rest") {
        if (sound) beep(1200, 250);
        vibrate(200);
        startWork(idx + 1);
      } else if (phase === "work" && timed) {
        if (sound) beep(1200, 300);
        completeSet();
      }
    }
    // las funciones se recrean en cada render; solo nos interesa reaccionar al reloj y a la fase
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase, paused, timed, sound, idx]);

  const togglePause = () => {
    if (paused != null) {
      const shift = Date.now() - paused;
      setDeadline((d) => d + shift);
      setPaused(null);
    } else setPaused(Date.now());
  };

  const setResult = (patch: Partial<Result>) => setResults((r) => r.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const estMinutes = Math.max(1, Math.round(items.reduce((a, it) => a + it.sets * ((it.seconds ?? (it.reps ?? 10) * 3) + it.rest), 0) / 60));
  const elapsed = startedAt ? Math.max(0, Math.round(((phase === "done" ? endedAt : now) - startedAt) / 1000)) : 0;
  const doneCount = results.filter((r) => r.done).length;

  const exitButton = (
    <button
      onClick={() => (phase === "intro" || phase === "done" ? onClose() : setConfirmExit(true))}
      className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
      aria-label="Cerrar entreno"
    >
      <X className="size-5" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-[#050506] text-ink" role="dialog" aria-modal="true" aria-label={session.title}>
      {/* ───── INTRO ───── */}
      {phase === "intro" && (
        <div className="mx-auto w-full max-w-3xl pb-32">
          <div className="relative h-[42vh] min-h-64 overflow-hidden lg:rounded-b-3xl">
            {session.cover && <Image src={session.cover} alt="" fill priority sizes="100vw" className="object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-[#050506]/50 to-black/20" />
            <div className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))]">{exitButton}</div>
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              {session.subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-accent">{session.subtitle}</p>}
              <h2 className="mt-2 font-athletic text-4xl font-extrabold uppercase italic leading-[0.95] sm:text-5xl">{session.title}</h2>
            </div>
          </div>
          <div className="px-5 sm:px-8">
            <div className="mt-2 grid grid-cols-3 gap-3">
              {[
                [Clock, `${estMinutes} min`, "Duración"],
                [Dumbbell, String(items.length), "Ejercicios"],
                [Flame, `~${estimateKcal(estMinutes * 60, latestWeight, !session.routineSlug)}`, "kcal"],
              ].map(([I, v, l]) => {
                const Icon = I as typeof Clock;
                return (
                  <div key={String(l)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                    <Icon className="mx-auto size-5 text-accent" />
                    <p className="mt-1 font-display text-xl font-semibold tabular-nums">{String(v)}</p>
                    <p className="text-xs text-muted">{String(l)}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="size-4 text-accent" /> Ajusta la sesión a tu día
              </p>
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Tiempo disponible</p>
                <div className="flex flex-wrap gap-2">
                  {[null, 20, 30, 45].map((m) => (
                    <button key={String(m)} onClick={() => setAdapt((a) => ({ ...a, minutes: m }))} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", adapt.minutes === m ? "border-accent bg-accent text-accent-ink" : "border-white/15 text-ink-2")}>
                      {m ? `${m} min` : "Completa"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Dónde entrenas hoy</p>
                <div className="flex flex-wrap gap-2">
                  {([[null, "Como está"], ["gimnasio", "Gimnasio"], ["casa", "Casa sin material"]] as const).map(([v, l]) => (
                    <button key={l} onClick={() => setAdapt((a) => ({ ...a, place: v }))} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", adapt.place === v ? "border-accent bg-accent text-accent-ink" : "border-white/15 text-ink-2")}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted">¿Alguna molestia hoy?</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(PAIN_LABELS) as [Pain, string][]).map(([k, l]) => {
                    const on = adapt.pains?.includes(k);
                    return (
                      <button
                        key={k}
                        onClick={() => setAdapt((a) => ({ ...a, pains: on ? a.pains!.filter((x) => x !== k) : [...(a.pains ?? []), k] }))}
                        className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", on ? "border-warning bg-warning/15 text-warning" : "border-white/15 text-ink-2")}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>
              {adapted.changes.length > 0 && (
                <ul className="space-y-1 rounded-2xl bg-black/30 p-3 text-xs text-ink-2">
                  {adapted.changes.map((c) => (
                    <li key={c} className="flex gap-2">
                      <RefreshCw className="mt-0.5 size-3 shrink-0 text-accent" /> {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <ol className="mt-6 divide-y divide-white/[0.06]">
              {items.map((it, i) => {
                const e = EXERCISE_BY_SLUG[it.slug];
                if (!e) return null;
                return (
                  <li key={i} className="flex items-center gap-4 py-3">
                    <Image src={exerciseImages(e)[1]} alt="" width={96} height={64} className="h-14 w-20 shrink-0 rounded-xl bg-white object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{e.name}</p>
                      <p className="text-sm text-muted">
                        {it.sets} × {it.seconds ? `${it.seconds} s` : `${it.reps} reps`} · descanso {it.rest} s
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="pointer-events-none fixed inset-x-0 bottom-0 bg-gradient-to-t from-[#050506] via-[#050506]/90 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-10">
            <button onClick={begin} className="pointer-events-auto mx-auto flex h-14 w-full max-w-3xl items-center justify-center gap-2 rounded-2xl bg-accent font-athletic text-xl font-extrabold uppercase italic tracking-wide text-accent-ink shadow-[0_10px_40px_-10px_rgb(198_255_61/0.7)] active:scale-[0.99]">
              <Play className="size-5 fill-current" /> Empezar
            </button>
          </div>
        </div>
      )}

      {/* ───── EN CURSO ───── */}
      {(phase === "ready" || phase === "work" || phase === "rest") && item && ex && (
        <div className="flex min-h-full flex-1 flex-col">
          {/* barra superior */}
          <div className="sticky top-0 z-10 bg-[#050506]/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              {exitButton}
              <div className="min-w-0 flex-1">
                <p className="truncate text-center text-xs font-medium text-muted">{session.title}</p>
                <p className="text-center font-display text-sm font-semibold tabular-nums">{mmss(elapsed)}</p>
              </div>
              <button onClick={() => setSound((s) => !s)} className="grid size-10 place-items-center rounded-full bg-white/10" aria-label={sound ? "Silenciar" : "Activar sonido"}>
                {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
              </button>
            </div>
            <div className="mx-auto mt-3 flex max-w-5xl gap-1">
              {steps.map((_, i) => (
                <span key={i} className={cn("h-1 flex-1 rounded-full", i < idx || results[i].done ? "bg-accent" : i === idx ? "bg-white/60" : "bg-white/10")} />
              ))}
            </div>
          </div>

          {phase === "rest" ? (
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-8 px-5 py-8 lg:flex-row lg:gap-16">
              <div className="flex flex-col items-center">
                <p className="font-athletic text-3xl font-extrabold uppercase italic tracking-wide text-accent">Descansa</p>
                <div className="mt-6">
                  <Ring value={left} max={total} size={240}>
                    <p className="font-display text-6xl font-semibold tabular-nums">{mmss(left)}</p>
                    {paused != null && <p className="text-sm text-muted">En pausa</p>}
                  </Ring>
                </div>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setDeadline((d) => d + 20000)} className="h-12 rounded-2xl bg-white/10 px-5 font-semibold">
                    +20 s
                  </button>
                  <button onClick={togglePause} className="grid size-12 place-items-center rounded-2xl bg-white/10" aria-label="Pausa">
                    {paused != null ? <Play className="size-5" /> : <Pause className="size-5" />}
                  </button>
                  <button onClick={() => startWork(idx + 1)} className="flex h-12 items-center gap-2 rounded-2xl bg-accent px-5 font-semibold text-accent-ink">
                    Saltar <SkipForward className="size-4" />
                  </button>
                </div>
              </div>
              {(() => {
                const ns = steps[idx + 1];
                const nit = items[ns.item];
                const ne = EXERCISE_BY_SLUG[nit.slug];
                return (
                  <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                    <ExerciseDemo exercise={ne} sizes="(max-width: 1024px) 100vw, 450px" />
                    <div className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Siguiente · serie {ns.set + 1} de {nit.sets}
                      </p>
                      <p className="mt-1 font-display text-xl font-semibold">{ne.name}</p>
                      <p className="text-sm text-accent">{nit.seconds ? `${nit.seconds} segundos` : `${nit.reps} repeticiones`}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="mx-auto grid w-full max-w-5xl flex-1 gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-10 lg:px-6">
              <div className="relative">
                <ExerciseDemo exercise={ex} priority className="rounded-3xl" sizes="(max-width: 1024px) 100vw, 600px" />
                {phase === "ready" && (
                  <div className="absolute inset-0 grid place-items-center rounded-3xl bg-black/70 backdrop-blur-sm">
                    <div className="text-center">
                      <p className="font-athletic text-2xl font-extrabold uppercase italic tracking-wide text-accent">Prepárate</p>
                      <p className="font-display text-8xl font-bold tabular-nums">{Math.max(1, Math.ceil(left))}</p>
                    </div>
                  </div>
                )}
                <div className="absolute right-3 top-3 flex gap-2">
                  <button onClick={() => setSwap(true)} className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                    <RefreshCw className="size-3.5" /> Cambiar
                  </button>
                  <button onClick={() => setInfo(true)} className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                    <Info className="size-3.5" /> Técnica
                  </button>
                </div>
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                  Ejercicio {step.item + 1}/{items.length} · Serie {step.set + 1}/{item.sets}
                </p>
                <h2 className="mt-1 font-athletic text-4xl font-extrabold uppercase italic leading-none sm:text-5xl">{ex.name}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-ink-2">{ex.steps[0]}</p>
                {(() => {
                  const prev = lastSets[item.slug];
                  const ps = prev?.sets[step.set] ?? prev?.sets[prev.sets.length - 1];
                  const best = bestPrev[item.slug];
                  if (!ps && !best) return null;
                  return (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {ps && (
                        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-ink-2">
                          Última vez: <strong className="text-ink">{ps.weight ? `${fmtNumber(ps.weight, 1)} kg × ` : ""}{ps.reps}</strong>
                        </span>
                      )}
                      {best && (
                        <span className="rounded-full bg-warning/10 px-3 py-1 text-warning">
                          Récord: {fmtNumber(best.weight, 1)} kg × {best.reps}
                        </span>
                      )}
                    </div>
                  );
                })()}

                <div className="my-6 flex justify-center lg:justify-start">
                  {timed ? (
                    <Ring value={phase === "ready" ? item.seconds! : left} max={item.seconds!} size={200}>
                      <p className="font-display text-5xl font-semibold tabular-nums">{phase === "ready" ? mmss(item.seconds!) : mmss(left)}</p>
                      <p className="text-xs uppercase tracking-wider text-muted">{paused != null ? "En pausa" : "Tiempo"}</p>
                    </Ring>
                  ) : (
                    <p className="font-athletic text-8xl font-extrabold italic leading-none tabular-nums">
                      ×{results[idx].reps}
                      <span className="ml-2 text-2xl not-italic text-muted">reps</span>
                    </p>
                  )}
                </div>

                {!timed && (
                  <div className="flex gap-3">
                    {!bodyweight && <Stepper label="Peso" unit="kg" step={2.5} value={results[idx].weight} onChange={(v) => setResult({ weight: v })} />}
                    <Stepper label="Repeticiones" value={results[idx].reps} onChange={(v) => setResult({ reps: Math.round(v) })} />
                  </div>
                )}

                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => idx > 0 && startWork(idx - 1)}
                    disabled={idx === 0 || phase === "ready"}
                    className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 disabled:opacity-30"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  {timed ? (
                    <button onClick={togglePause} disabled={phase === "ready"} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 font-semibold disabled:opacity-40">
                      {paused != null ? <Play className="size-5" /> : <Pause className="size-5" />} {paused != null ? "Reanudar" : "Pausa"}
                    </button>
                  ) : (
                    <button
                      onClick={completeSet}
                      disabled={phase === "ready"}
                      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent font-athletic text-xl font-extrabold uppercase italic text-accent-ink disabled:opacity-40"
                    >
                      <Check className="size-5" /> Hecho
                    </button>
                  )}
                  <button onClick={completeSet} disabled={phase === "ready"} className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 disabled:opacity-30" aria-label="Siguiente">
                    <ChevronRight className="size-6" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───── FIN ───── */}
      {phase === "done" && (
        <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className="absolute top-0 block h-3 w-1.5 animate-confetti rounded-sm"
                style={{
                  left: `${(i * 37) % 100}%`,
                  background: ["#c6ff3d", "#4cc3ff", "#ff8a3d", "#ffffff"][i % 4],
                  animationDelay: `${(i % 7) * 0.15}s`,
                  animationDuration: `${2.2 + (i % 5) * 0.3}s`,
                }}
              />
            ))}
          </div>
          <div className="grid size-20 place-items-center rounded-3xl bg-accent text-accent-ink shadow-[0_0_60px_-10px_rgb(198_255_61/0.8)]">
            <Trophy className="size-10" />
          </div>
          <h2 className="mt-6 font-athletic text-5xl font-extrabold uppercase italic leading-none">¡Entreno completado!</h2>
          <p className="mt-2 text-ink-2">{session.title}</p>
          <div className="mt-8 grid w-full grid-cols-3 gap-3">
            {[
              ["Tiempo", fmtDuration(elapsed)],
              ["Series", String(doneCount)],
              ["kcal", `~${estimateKcal(elapsed, latestWeight, !session.routineSlug)}`],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-display text-2xl font-semibold tabular-nums">{v}</p>
                <p className="text-xs text-muted">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted">
            {!doneCount ? "No completaste ninguna serie, así que no se ha guardado." : saved ? (saved.id ? "Guardado en tu historial ✓" : "No se pudo guardar. Revisa tu conexión.") : "Guardando…"}
          </p>
          {saved?.id && (
            <div className="mt-8 w-full text-left">
              <p className="text-sm font-semibold">¿Cómo te has sentido?</p>
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {["Muy duro", "Duro", "Bien", "Muy bien", "Genial"].map((l, i) => (
                  <button key={l} onClick={() => setFeeling(i + 1)} className={cn("rounded-xl border px-1 py-2 text-[11px] font-semibold leading-tight", feeling === i + 1 ? "border-accent bg-accent text-accent-ink" : "border-white/15 text-ink-2")}>
                    {l}
                  </button>
                ))}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas para tu diario (opcional): cómo has dormido, molestias, sensaciones…"
                rows={2}
                className="input mt-3 resize-none"
                aria-label="Notas del entreno"
              />
            </div>
          )}
          <button
            onClick={async () => {
              if (saved?.id && (feeling || notes.trim())) await saveWorkout({ ...saved, feeling: feeling ?? undefined, notes: notes.trim() || undefined }).catch(() => {});
              onClose();
            }}
            className="mt-6 h-14 w-full rounded-2xl bg-accent font-athletic text-xl font-extrabold uppercase italic text-accent-ink"
          >
            Continuar
          </button>
        </div>
      )}

      {prToast && (
        <div className="fixed inset-x-0 top-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))] z-[65] flex justify-center px-4" role="status">
          <div className="flex animate-fade-up items-center gap-3 rounded-2xl border border-warning/40 bg-[#1d1606] px-5 py-3 text-sm font-semibold text-warning shadow-2xl">
            <Trophy className="size-5" /> {prToast}
          </div>
        </div>
      )}
      <Modal open={swap} onClose={() => setSwap(false)} title="Cambiar ejercicio">
        <p className="mb-4 text-sm text-ink-2">¿Máquina ocupada o te molesta? Elige un ejercicio equivalente para el mismo músculo:</p>
        <ul className="space-y-2">
          {item &&
            substitutes(item.slug, adapt, items.map((i) => i.slug)).map((alt) => (
              <li key={alt.slug}>
                <button onClick={() => swapExercise(alt.slug)} className="flex w-full items-center gap-3 rounded-2xl border border-line p-2 text-left hover:border-accent/50">
                  <Image src={exerciseImages(alt)[1]} alt="" width={96} height={64} className="h-14 w-20 rounded-xl bg-white object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{alt.name}</span>
                    <span className="text-xs capitalize text-muted">{alt.equipment} · {alt.primary.join(", ")}</span>
                  </span>
                </button>
              </li>
            ))}
        </ul>
      </Modal>
      <Modal open={info} onClose={() => setInfo(false)} title={ex?.name ?? ""} wide>
        {ex && <ExerciseQuickView e={ex} />}
      </Modal>
      <Modal open={confirmExit} onClose={() => setConfirmExit(false)} title="¿Salir del entreno?">
        <p className="text-sm text-ink-2">Puedes terminar ahora y guardar las series completadas, o salir sin guardar.</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button className="h-11 rounded-xl border border-line px-4 text-sm font-semibold" onClick={() => setConfirmExit(false)}>
            Seguir entrenando
          </button>
          <button className="h-11 rounded-xl border border-critical/40 px-4 text-sm font-semibold text-critical" onClick={onClose}>
            Salir sin guardar
          </button>
          <button
            className="h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
            onClick={() => {
              setConfirmExit(false);
              finish();
            }}
          >
            Terminar y guardar
          </button>
        </div>
      </Modal>
    </div>
  );
}
