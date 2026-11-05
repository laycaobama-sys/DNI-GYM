"use client";

import { useState } from "react";
import { Rotate3d, Map as MapIcon } from "lucide-react";
import { MuscleMap } from "./muscle-map";
import { Body3D } from "./body-3d";
import { cn } from "@/lib/cn";

/** Mapa muscular 2D o modelo 3D interactivo. */
export function MuscleViewer({ primary, secondary, className }: { primary: string[]; secondary: string[]; className?: string }) {
  const [mode, setMode] = useState<"2d" | "3d">("3d");
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-line bg-surface p-1" role="tablist" aria-label="Vista de músculos">
          {([
            ["3d", "Vista 3D", Rotate3d],
            ["2d", "Mapa", MapIcon],
          ] as const).map(([v, label, Icon]) => (
            <button key={v} role="tab" aria-selected={mode === v} onClick={() => setMode(v)} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium", mode === v ? "bg-accent text-accent-ink" : "text-ink-2 hover:text-ink")}>
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      </div>
      {mode === "3d" ? (
        <div className="relative">
          <Body3D primary={primary} secondary={secondary} className="mx-auto h-[420px] w-full max-w-sm cursor-grab rounded-2xl bg-[radial-gradient(60%_50%_at_50%_45%,rgb(255_107_26/0.10),transparent_70%)] active:cursor-grabbing" />
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-3 text-[11px] text-muted">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-accent" /> Principal</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-orange" /> Secundario</span>
            <span>· Arrastra para girar</span>
          </div>
        </div>
      ) : (
        <MuscleMap primary={primary} secondary={secondary} className="mx-auto max-w-sm" />
      )}
    </div>
  );
}
