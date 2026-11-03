import Image from "next/image";
import { Check, ChevronRight, Droplets, Flame, Play, Timer, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";

/** Marco de móvil hecho con CSS. */
export function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto aspect-[9/19.2] w-full max-w-[300px] rounded-[2.75rem] border border-white/15 bg-[#0b0c0e] p-[9px] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9),inset_0_0_0_2px_#1d2026]", className)}>
      <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-[#070708]">
        <div className="absolute left-1/2 top-2 z-20 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-black" />
        <div className="flex items-center justify-between px-6 pt-2.5 text-[10px] font-semibold text-white">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-3.5 rounded-[2px] border border-white/80" />
          </span>
        </div>
        <div className="h-[calc(100%-26px)] overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function MiniRing({ pct, color, size }: { pct: number; color: string; size: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="absolute inset-0 m-auto -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} />
    </svg>
  );
}

export function ActivityRings({ size = 120 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <MiniRing pct={0.78} color="#ff6b1a" size={size} />
      <MiniRing pct={0.6} color="#4cc3ff" size={size - 36} />
      <MiniRing pct={0.88} color="#ff8a3d" size={size - 72} />
    </div>
  );
}

/** Pantalla de inicio de la app (ejemplo). */
export function ScreenHome() {
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  return (
    <div className="space-y-3 px-4 pt-3 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-white/50">Lunes, 3 de noviembre</p>
          <p className="font-display text-base font-semibold">Hola, Laura</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-orange/15 px-2 py-1 text-[10px] font-bold text-orange">
          <Flame className="size-3" /> 6
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <div key={d} className={cn("rounded-xl py-1.5 text-center", i === 3 ? "bg-accent text-accent-ink" : "bg-white/5")}>
            <p className="text-[9px] opacity-70">{d}</p>
            <p className="text-[11px] font-bold">{i < 3 ? <Check className="mx-auto size-3" /> : 3 + i}</p>
          </div>
        ))}
      </div>
      <div className="relative h-36 overflow-hidden rounded-2xl">
        <Image src="/brand/p-torso-pierna-4-dias.webp" alt="" fill sizes="300px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-accent">Tu entreno de hoy</p>
          <p className="font-athletic text-xl font-extrabold uppercase italic leading-none">Pierna · fuerza</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] text-white/70">52 min · 6 ejercicios</p>
            <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-accent-ink">
              <Play className="size-2.5 fill-current" /> Empezar
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
        <ActivityRings size={78} />
        <div className="space-y-1 text-[10px]">
          <p><span className="font-bold text-accent">3/4</span> <span className="text-white/60">entrenos semana</span></p>
          <p><span className="font-bold text-sky">142</span> <span className="text-white/60">min activos</span></p>
          <p><span className="font-bold text-orange">1.840</span> <span className="text-white/60">kcal hoy</span></p>
        </div>
      </div>
    </div>
  );
}

/** Pantalla del entreno guiado (ejemplo). */
export function ScreenPlayer() {
  return (
    <div className="px-3 pt-2 text-white">
      <div className="flex gap-0.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={cn("h-0.5 flex-1 rounded-full", i < 5 ? "bg-accent" : i === 5 ? "bg-white/60" : "bg-white/10")} />
        ))}
      </div>
      <div className="relative mt-3 aspect-[3/2] overflow-hidden rounded-2xl bg-white">
        <Image src="/ejercicios/Barbell_Hip_Thrust-0.webp" alt="" fill sizes="300px" className="object-cover" />
        <Image src="/ejercicios/Barbell_Hip_Thrust-1.webp" alt="" fill sizes="300px" className="animate-frame object-cover" />
      </div>
      <p className="mt-3 text-[9px] font-bold uppercase tracking-wider text-accent">Ejercicio 2/6 · Serie 3/4</p>
      <p className="font-athletic text-2xl font-extrabold uppercase italic leading-none">Hip thrust</p>
      <p className="mt-3 font-athletic text-6xl font-extrabold italic leading-none">
        ×10<span className="ml-1 text-sm not-italic text-white/50">reps</span>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[["Peso", "80 kg"], ["Reps", "10"]].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
            <p className="text-[8px] uppercase tracking-wider text-white/50">{l}</p>
            <p className="text-sm font-bold">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-10 items-center justify-center gap-1 rounded-xl bg-accent font-athletic text-base font-extrabold uppercase italic text-accent-ink">
        <Check className="size-4" /> Hecho
      </div>
    </div>
  );
}

/** Pantalla de progreso (ejemplo). */
export function ScreenProgress() {
  const bars = [42, 55, 48, 63, 60, 72, 78, 90];
  return (
    <div className="space-y-3 px-4 pt-3 text-white">
      <p className="font-display text-base font-semibold">Progreso</p>
      <div className="rounded-2xl bg-white/5 p-3">
        <p className="text-[10px] text-white/50">Press de banca · 1RM estimado</p>
        <p className="font-display text-2xl font-semibold">
          92,5 <span className="text-xs text-white/50">kg</span> <span className="text-xs font-bold text-good">+12%</span>
        </p>
        <svg viewBox="0 0 200 60" className="mt-2 h-14 w-full">
          <defs>
            <linearGradient id="pg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff6b1a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ff6b1a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 50 L25 46 L50 47 L75 38 L100 36 L125 28 L150 24 L175 18 L200 10 L200 60 L0 60Z" fill="url(#pg)" />
          <path d="M0 50 L25 46 L50 47 L75 38 L100 36 L125 28 L150 24 L175 18 L200 10" fill="none" stroke="#ff6b1a" strokeWidth="2.5" />
          <circle cx="200" cy="10" r="4" fill="#ff6b1a" />
        </svg>
      </div>
      <div className="rounded-2xl bg-white/5 p-3">
        <p className="text-[10px] text-white/50">Volumen semanal</p>
        <div className="mt-2 flex h-16 items-end gap-1.5">
          {bars.map((h, i) => (
            <span key={i} className="flex-1 rounded-t-[3px] bg-accent" style={{ height: `${h}%`, opacity: 0.35 + i * 0.08 }} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3">
        <Trophy className="size-5 text-warning" />
        <div>
          <p className="text-[11px] font-bold">¡Nuevo récord personal!</p>
          <p className="text-[10px] text-white/60">Sentadilla · 110 kg × 5</p>
        </div>
      </div>
    </div>
  );
}

/** Pantalla de nutrición (ejemplo). */
export function ScreenNutrition() {
  const macros = [
    ["Proteína", 128, 160, "#3a96dc"],
    ["Carbos", 190, 240, "#bf8700"],
    ["Grasas", 52, 70, "#d0478c"],
  ] as const;
  return (
    <div className="space-y-3 px-4 pt-3 text-white">
      <p className="font-display text-base font-semibold">Nutrición</p>
      <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
        <div className="relative grid size-24 place-items-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#ff6b1a" strokeWidth="9" strokeLinecap="round" strokeDasharray="200 264" />
          </svg>
          <div className="text-center">
            <p className="font-display text-lg font-semibold leading-none">1.840</p>
            <p className="text-[8px] text-white/50">de 2.300 kcal</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {macros.map(([l, v, g, c]) => (
            <div key={l}>
              <div className="flex justify-between text-[9px]">
                <span className="text-white/60">{l}</span>
                <span>{v}/{g} g</span>
              </div>
              <div className="mt-0.5 h-1.5 rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${(v / g) * 100}%`, background: c }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {[
        ["Desayuno", "Avena, leche, plátano", 452],
        ["Comida", "Pollo, arroz, aceite de oliva", 671],
        ["Merienda", "Skyr, arándanos", 160],
      ].map(([m, d, k]) => (
        <div key={String(m)} className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
          <div>
            <p className="text-[11px] font-bold">{m}</p>
            <p className="text-[10px] text-white/50">{d}</p>
          </div>
          <span className="text-[11px] font-bold">{k}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 rounded-2xl bg-sky/10 p-3 text-[10px] text-sky">
        <Droplets className="size-4" /> 1,75 de 2,5 L de agua
      </div>
    </div>
  );
}

/** Pantalla de retos (ejemplo). */
export function ScreenChallenge() {
  return (
    <div className="space-y-3 px-4 pt-3 text-white">
      <div className="relative h-28 overflow-hidden rounded-2xl">
        <Image src="/brand/c-abdomen.webp" alt="" fill sizes="300px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <p className="absolute bottom-2 left-3 font-athletic text-xl font-extrabold uppercase italic leading-none">
          Reto abdominales
          <br />
          30 días
        </p>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/60">Progreso</span>
        <span className="font-bold text-accent">9 / 30 días</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div className="h-full w-[30%] rounded-full bg-accent" />
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {Array.from({ length: 24 }).map((_, i) => {
          const d = i + 1;
          const done = d <= 9;
          const today = d === 10;
          return (
            <span key={d} className={cn("grid aspect-square place-items-center rounded-lg text-[10px] font-bold", done ? "bg-accent text-accent-ink" : today ? "border border-accent text-accent" : d % 4 === 0 ? "bg-white/5 text-white/30" : "bg-white/5 text-white/70")}>
              {done ? <Check className="size-3" /> : d}
            </span>
          );
        })}
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
        <div>
          <p className="text-[11px] font-bold">Día 10 · 12 min</p>
          <p className="text-[10px] text-white/50">5 ejercicios · sin material</p>
        </div>
        <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-ink">
          <ChevronRight className="size-4" />
        </span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-white/60">
        <Timer className="size-3.5" /> Descanso automático y aviso sonoro
      </div>
    </div>
  );
}
