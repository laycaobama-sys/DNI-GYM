"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { EXERCISES, GROUPS, LEVELS, groupLabel, type Equipment, type Exercise, type Level, type MuscleGroup } from "@/data/exercises";
import { ExerciseDemo } from "./exercise-demo";
import { cn } from "@/lib/cn";

const EQUIPMENT: Equipment[] = ["barra", "mancuernas", "polea", "máquina", "peso corporal", "kettlebell", "barra Z", "otro"];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function ExerciseCard({ e, onSelect, compact }: { e: Exercise; onSelect?: (e: Exercise) => void; compact?: boolean }) {
  const inner = (
    <>
      <ExerciseDemo exercise={e} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
      <div className={cn("flex flex-1 flex-col", compact ? "p-3" : "p-4")}>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-accent">{groupLabel(e.group)}</span>
          <span className="text-line-strong">•</span>
          <span className="capitalize text-muted">{e.equipment}</span>
        </div>
        <h3 className={cn("mt-1 font-semibold leading-snug", compact ? "text-sm" : "")}>{e.name}</h3>
        {!compact && <p className="mt-1 line-clamp-1 text-sm text-muted">{e.primary.join(", ")}</p>}
        {!compact && (
          <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted">
            <span className="capitalize">{e.level}</span>
            <span className="tabular-nums">{e.prescription}</span>
          </div>
        )}
      </div>
    </>
  );
  const cls = "card group flex flex-col overflow-hidden text-left transition-colors hover:border-accent/40";
  if (onSelect)
    return (
      <button type="button" onClick={() => onSelect(e)} className={cls}>
        {inner}
      </button>
    );
  return (
    <Link href={`/ejercicios/${e.slug}`} className={cls}>
      {inner}
    </Link>
  );
}

export function ExerciseBrowser({ onSelect, syncUrl = true, compact }: { onSelect?: (e: Exercise) => void; syncUrl?: boolean; compact?: boolean }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "todos">("todos");
  const [equipment, setEquipment] = useState<Equipment | "todos">("todos");
  const [level, setLevel] = useState<Level | "todos">("todos");
  const [showFilters, setShowFilters] = useState(false);

  // estado inicial desde la URL (?q=&grupo=&equipo=&nivel=) sin bloquear el renderizado estático
  useEffect(() => {
    if (!syncUrl) return;
    const p = new URLSearchParams(window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (p.get("q")) setQ(p.get("q")!);
    const g = p.get("grupo") as MuscleGroup | null;
    if (g && GROUPS.some((x) => x.id === g)) setGroup(g);
    const eq = p.get("equipo") as Equipment | null;
    if (eq && EQUIPMENT.includes(eq)) setEquipment(eq);
    const l = p.get("nivel") as Level | null;
    if (l && LEVELS.includes(l)) setLevel(l);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [syncUrl]);

  useEffect(() => {
    if (!syncUrl) return;
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (group !== "todos") p.set("grupo", group);
    if (equipment !== "todos") p.set("equipo", equipment);
    if (level !== "todos") p.set("nivel", level);
    const s = p.toString();
    window.history.replaceState(null, "", s ? `?${s}` : window.location.pathname);
  }, [q, group, equipment, level, syncUrl]);

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return EXERCISES.filter(
      (e) =>
        (group === "todos" || e.group === group) &&
        (equipment === "todos" || e.equipment === equipment) &&
        (level === "todos" || e.level === level) &&
        (!nq || norm([e.name, ...e.primary, ...e.secondary, e.equipment, groupLabel(e.group)].join(" ")).includes(nq)),
    );
  }, [q, group, equipment, level]);

  const activeFilters = (equipment !== "todos" ? 1 : 0) + (level !== "todos" ? 1 : 0);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ejercicio o músculo (p. ej. sentadilla, glúteo, bíceps…)"
            className="input h-11 pl-10"
            aria-label="Buscar ejercicio"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label="Limpiar">
              <X className="size-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-medium",
            showFilters || activeFilters ? "border-accent/40 text-ink" : "border-line text-ink-2 hover:text-ink",
          )}
        >
          <SlidersHorizontal className="size-4" /> Filtros {activeFilters > 0 && <span className="rounded-full bg-accent px-1.5 text-xs text-accent-ink">{activeFilters}</span>}
        </button>
      </div>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ id: "todos" as const, label: "Todos" }, ...GROUPS].map((g) => (
          <button
            key={g.id}
            onClick={() => setGroup(g.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              group === g.id ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-2 hover:border-line-strong hover:text-ink",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="card mt-4 grid gap-4 p-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Equipamiento</span>
            <select className="input" value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment | "todos")}>
              <option value="todos">Todo el equipamiento</option>
              {EQUIPMENT.map((x) => (
                <option key={x} value={x} className="capitalize">
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Nivel</span>
            <select className="input" value={level} onChange={(e) => setLevel(e.target.value as Level | "todos")}>
              <option value="todos">Todos los niveles</option>
              {LEVELS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <p className="mt-5 text-sm text-muted" aria-live="polite">
        {list.length} {list.length === 1 ? "ejercicio" : "ejercicios"}
      </p>

      <div className={cn("mt-3 grid gap-4", compact ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
        {list.map((e) => (
          <ExerciseCard key={e.slug} e={e} onSelect={onSelect} compact={compact} />
        ))}
      </div>
      {!list.length && (
        <div className="py-16 text-center text-muted">
          No hay ejercicios con esos filtros.{" "}
          <button
            className="text-accent underline"
            onClick={() => {
              setQ("");
              setGroup("todos");
              setEquipment("todos");
              setLevel("todos");
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
