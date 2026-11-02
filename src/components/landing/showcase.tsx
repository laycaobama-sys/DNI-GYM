"use client";

import { useEffect, useState } from "react";
import { BarChart3, PlayCircle, Salad, Target } from "lucide-react";
import { Phone, ScreenChallenge, ScreenNutrition, ScreenPlayer, ScreenProgress } from "./phone";
import { cn } from "@/lib/cn";

const TABS = [
  {
    id: "guiado",
    icon: PlayCircle,
    title: "Entreno guiado",
    text: "Demostración de cada ejercicio, cuenta atrás, descansos automáticos y registro de kilos y repeticiones en un toque.",
    screen: <ScreenPlayer />,
  },
  {
    id: "progreso",
    icon: BarChart3,
    title: "Progreso real",
    text: "1RM estimado, volumen semanal, récords personales y series por músculo. Sabrás si estás mejorando, sin adivinar.",
    screen: <ScreenProgress />,
  },
  {
    id: "nutricion",
    icon: Salad,
    title: "Nutrición y macros",
    text: "Tus calorías y macros calculados para tu objetivo. Registra comidas con más de 100 alimentos y controla el agua.",
    screen: <ScreenNutrition />,
  },
  {
    id: "retos",
    icon: Target,
    title: "Retos de 30 días",
    text: "Abdominales, glúteos, flexiones o cuerpo completo. Un entreno corto cada día que sube de nivel contigo.",
    screen: <ScreenChallenge />,
  },
];

export function Showcase() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setActive((a) => (a + 1) % TABS.length), 5000);
    return () => clearInterval(t);
  }, [auto]);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1fr_minmax(0,380px)] lg:gap-20">
      <div className="order-2 space-y-3 lg:order-1">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => {
              setActive(i);
              setAuto(false);
            }}
            className={cn(
              "group relative flex w-full gap-4 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300",
              i === active ? "border-accent/40 bg-accent/[0.06]" : "border-line bg-surface/50 hover:border-line-strong",
            )}
            aria-pressed={i === active}
          >
            <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl transition-colors", i === active ? "bg-accent text-accent-ink" : "bg-white/5 text-ink-2")}>
              <t.icon className="size-5" />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold">{t.title}</span>
              <span className={cn("mt-1 block text-sm leading-relaxed text-muted transition-all", i === active ? "max-h-40 opacity-100" : "max-h-0 opacity-0 lg:max-h-40 lg:opacity-60")}>{t.text}</span>
            </span>
            {i === active && auto && <span className="absolute bottom-0 left-0 h-0.5 animate-[grow_5s_linear] bg-accent" style={{ width: "100%" }} />}
          </button>
        ))}
      </div>
      <div className="relative order-1 lg:order-2">
        <div className="absolute inset-0 -z-10 m-auto size-72 rounded-full bg-accent/20 blur-[90px]" />
        <Phone>
          <div key={active} className="h-full animate-fade-up">
            {TABS[active].screen}
          </div>
        </Phone>
      </div>
    </div>
  );
}
