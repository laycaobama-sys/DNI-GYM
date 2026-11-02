"use client";

import { Lock } from "lucide-react";
import { useAuth } from "./auth-provider";
import { useData } from "./data-provider";
import { AchievementIcon } from "./achievement-icon";
import { cn } from "./ui";
import { achievements, levelInfo } from "@/lib/plan";
import { fmtNumber } from "@/lib/fitness";

export function AchievementsSection() {
  const { profile } = useAuth();
  const { workouts, body } = useData();
  const list = achievements(workouts, body.filter((b) => b.weight).length, profile);
  const lvl = levelInfo(workouts);
  return (
    <section id="logros" className="scroll-mt-24 space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/[0.14] via-surface to-surface p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Nivel {lvl.level}</p>
            <p className="font-athletic text-5xl font-extrabold uppercase italic leading-none">{lvl.name}</p>
          </div>
          <p className="font-display text-2xl font-semibold tabular-nums">
            {fmtNumber(lvl.xp)} <span className="text-sm text-muted">XP</span>
          </p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${lvl.progress * 100}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted">{fmtNumber(lvl.toNext)} XP para el siguiente nivel · ganas XP con cada entreno y cada serie</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {list.map((a) => (
          <div key={a.id} className={cn("relative rounded-2xl border p-4 text-center", a.unlocked ? "border-accent/40 bg-accent/[0.06]" : "border-line bg-surface")}>
            <span className={cn("mx-auto grid size-14 place-items-center rounded-2xl", a.unlocked ? "bg-accent text-accent-ink shadow-[0_0_30px_-8px_rgb(198_255_61/0.8)]" : "bg-white/5 text-muted")}>
              {a.unlocked ? <AchievementIcon name={a.icon} className="size-7" /> : <Lock className="size-5" />}
            </span>
            <p className="mt-3 text-sm font-semibold">{a.title}</p>
            <p className="mt-0.5 text-xs text-muted">{a.description}</p>
            {!a.unlocked && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-accent/70" style={{ width: `${a.progress * 100}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
