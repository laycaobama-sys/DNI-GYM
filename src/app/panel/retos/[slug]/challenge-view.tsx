"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Lock, Moon, Play } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { usePlayer } from "@/components/workout-player";
import { cn } from "@/components/ui";
import { CHALLENGE_DAYS, challengeDay, getChallenge, isRestDay } from "@/data/challenges";
import { EXERCISE_BY_SLUG, exerciseImages } from "@/data/exercises";

export function ChallengeView({ slug }: { slug: string }) {
  const { profile, updateProfile } = useAuth();
  const player = usePlayer();
  const c = getChallenge(slug);
  const done = new Set(profile?.challenges?.[slug] ?? []);
  const nextDay = Array.from({ length: CHALLENGE_DAYS }, (_, i) => i + 1).find((d) => !done.has(d) && !isRestDay(d)) ?? CHALLENGE_DAYS;
  const [selected, setSelected] = useState(nextDay);
  if (!c) return <p className="text-muted">Reto no encontrado.</p>;
  const session = challengeDay(c, selected);
  const completed = [...done].length;
  const unlocked = (d: number) => d <= nextDay || done.has(d);

  const markRest = async (d: number) => {
    const prev = profile?.challenges ?? {};
    const s = new Set(prev[slug] ?? []);
    s.add(d);
    await updateProfile({ challenges: { ...prev, [slug]: [...s].sort((a, b) => a - b) } });
  };

  return (
    <div className="space-y-6">
      <div className="relative -mx-4 -mt-5 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-3xl">
        <div className="relative aspect-[16/9] max-h-80 w-full sm:aspect-[21/9]">
          <Image src={c.cover} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-black/40 to-black/20" />
        </div>
        <Link href="/panel/retos" className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur">
          <ArrowLeft className="size-4" /> Retos
        </Link>
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <h1 className="font-athletic text-5xl font-extrabold uppercase italic leading-none sm:text-6xl">{c.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(completed / CHALLENGE_DAYS) * 100}%` }} />
            </div>
            <span className="text-sm font-bold text-accent tabular-nums">
              {completed}/{CHALLENGE_DAYS}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="font-display text-lg font-semibold">Calendario</h2>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {Array.from({ length: CHALLENGE_DAYS }, (_, i) => i + 1).map((d) => {
              const isDone = done.has(d);
              const rest = isRestDay(d);
              const open = unlocked(d);
              return (
                <button
                  key={d}
                  disabled={!open}
                  onClick={() => setSelected(d)}
                  className={cn(
                    "relative grid aspect-square place-items-center rounded-xl text-sm font-bold transition",
                    isDone ? "bg-accent text-accent-ink" : open ? "border border-line-strong bg-surface text-ink" : "bg-white/[0.03] text-muted/60",
                    selected === d && "ring-2 ring-accent ring-offset-2 ring-offset-bg",
                  )}
                  aria-label={`Día ${d}${rest ? " (descanso)" : ""}`}
                >
                  {isDone ? <Check className="size-4" /> : rest ? <Moon className="size-4" /> : !open ? <Lock className="size-3.5" /> : d}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">Día {selected}</p>
          {isRestDay(selected) ? (
            <>
              <h2 className="mt-1 font-athletic text-4xl font-extrabold uppercase italic">Descanso activo</h2>
              <p className="mt-2 text-sm text-ink-2">Hoy toca recuperar: camina 20–30 minutos, estira y bebe agua. El músculo crece cuando descansas.</p>
              {!done.has(selected) && (
                <button onClick={() => markRest(selected)} className="mt-5 h-12 w-full rounded-2xl bg-accent font-semibold text-accent-ink">
                  Marcar como completado
                </button>
              )}
            </>
          ) : (
            <>
              <h2 className="mt-1 font-athletic text-4xl font-extrabold uppercase italic">{session.items.length} ejercicios</h2>
              <ul className="mt-4 divide-y divide-line">
                {session.items.map((it) => {
                  const e = EXERCISE_BY_SLUG[it.slug];
                  return (
                    <li key={it.slug} className="flex items-center gap-3 py-2.5">
                      <Image src={exerciseImages(e)[1]} alt="" width={96} height={64} className="h-12 w-[72px] rounded-lg bg-white object-cover" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.name}</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {it.sets} × {it.seconds ? `${it.seconds} s` : it.reps}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => player.start(session)}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent font-athletic text-xl font-extrabold uppercase italic text-accent-ink shadow-[0_10px_40px_-10px_rgb(255_107_26/0.7)]"
              >
                <Play className="size-5 fill-current" /> {done.has(selected) ? "Repetir día" : `Empezar día ${selected}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
