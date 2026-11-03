"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, Check, Clock, Home, Play } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { usePlayer } from "@/components/workout-player";
import { PageHeader, Tabs, cn } from "@/components/ui";
import { CHALLENGES, ROUTINE_COVER, quickWorkouts } from "@/data/challenges";
import { ROUTINES } from "@/data/routines";
import type { Level } from "@/data/exercises";
import { activeRoutine, routineDaySession } from "@/lib/plan";
import { dayKey } from "@/lib/fitness";

export default function ExplorePage() {
  const { profile, updateProfile } = useAuth();
  const player = usePlayer();
  const [place, setPlace] = useState<"gimnasio" | "casa">(profile?.place ?? "gimnasio");
  const [level, setLevel] = useState<Level>(profile?.level ?? "principiante");
  const [today] = useState(() => dayKey());
  const list = useMemo(() => quickWorkouts(place, today).filter((q) => q.level === level), [place, level, today]);
  const current = activeRoutine(profile);

  return (
    <div className="space-y-10">
      <PageHeader title="Explorar" subtitle="Entrenos rápidos, retos y programas completos" />

      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-athletic text-3xl font-extrabold uppercase italic">Entrenos por zona</h2>
            <p className="text-sm text-muted">Cambian cada día. {place === "casa" ? "Solo con tu peso corporal." : "Con barra, mancuernas, poleas y máquinas."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tabs
              value={place}
              onChange={setPlace}
              items={[
                { value: "gimnasio", label: <span className="flex items-center gap-1.5"><Building2 className="size-4" /> Gimnasio</span> },
                { value: "casa", label: <span className="flex items-center gap-1.5"><Home className="size-4" /> Casa</span> },
              ]}
            />
            <Tabs
              value={level}
              onChange={setLevel}
              items={[
                { value: "principiante", label: "Principiante" },
                { value: "intermedio", label: "Intermedio" },
                { value: "avanzado", label: "Avanzado" },
              ]}
            />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {list.map((q) => (
            <button key={q.id} onClick={() => player.start(q.session)} className="group relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 text-left">
              <Image src={q.cover} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <span className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-accent text-accent-ink opacity-90 transition group-hover:scale-110">
                <Play className="size-4 fill-current" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-athletic text-2xl font-extrabold uppercase italic leading-none sm:text-3xl">{q.title}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/75">
                  <Clock className="size-3.5" /> {q.minutes} min · {q.session.items.length} ejercicios
                </p>
              </div>
            </button>
          ))}
          {!list.length && <p className="col-span-full py-10 text-center text-sm text-muted">No hay entrenos para esta combinación.</p>}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-athletic text-3xl font-extrabold uppercase italic">Retos de 30 días</h2>
          <Link href="/panel/retos" className="text-sm font-medium text-accent">
            Ver todos
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
          {CHALLENGES.map((c) => {
            const done = profile?.challenges?.[c.slug]?.length ?? 0;
            return (
              <Link key={c.slug} href={`/panel/retos/${c.slug}`} className="group relative aspect-[4/3] w-[78vw] max-w-sm shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 sm:w-auto">
                <Image src={c.cover} alt="" fill sizes="(max-width: 640px) 80vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-athletic text-2xl font-extrabold uppercase italic leading-none">{c.short}</p>
                  <p className="mt-1 text-xs capitalize text-white/70">{done ? `${done}/30 días` : `${c.level} · sin material`}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="programas" className="scroll-mt-24">
        <h2 className="font-athletic text-3xl font-extrabold uppercase italic">Programas completos</h2>
        <p className="mt-1 text-sm text-muted">Elige tu programa: «Tu entreno de hoy» seguirá su orden automáticamente.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {ROUTINES.map((r) => {
            const active = r.slug === current.slug;
            return (
              <div key={r.slug} className={cn("overflow-hidden rounded-3xl border bg-surface", active ? "border-accent/50" : "border-line")}>
                <div className="relative aspect-[16/7]">
                  <Image src={ROUTINE_COVER(r.slug)} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-black/30 to-transparent" />
                  {active && (
                    <span className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">
                      <Check className="size-3.5" /> Tu programa
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="font-athletic text-3xl font-extrabold uppercase italic leading-none">{r.name}</p>
                    <p className="mt-1 text-sm capitalize text-white/70">
                      {r.daysPerWeek} días/sem · {r.level} · {r.place}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 p-5 pt-3">
                  <div className="flex flex-wrap gap-2">
                    {r.days.map((d, i) => (
                      <button key={d.name} onClick={() => player.start(routineDaySession(r, i))} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 hover:border-accent/50 hover:text-ink">
                        <Play className="size-3" /> {d.name}
                      </button>
                    ))}
                  </div>
                  {!active && (
                    <button onClick={() => updateProfile({ planSlug: r.slug })} className="h-10 w-full rounded-xl bg-white/5 text-sm font-semibold hover:bg-white/10">
                      Elegir como mi programa
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
