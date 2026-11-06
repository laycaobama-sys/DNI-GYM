"use client";

import { useEffect } from "react";

type Tool = { name: string; description: string; inputSchema: Record<string, unknown>; execute: (args: Record<string, unknown>) => Promise<unknown> };
type ModelContext = { registerTool?: (tool: Tool, opts?: { signal?: AbortSignal }) => Promise<unknown> | unknown; provideContext?: (ctx: { tools: Tool[] }) => void };

const get = async (path: string) => {
  const res = await fetch(path, { headers: { accept: "application/json" } });
  return { content: [{ type: "text", text: await res.text() }] };
};

/** WebMCP: expone herramientas de solo lectura de DNI GYM a los asistentes de IA del navegador. */
export function WebMcp() {
  useEffect(() => {
    const mc = ((navigator as unknown as { modelContext?: ModelContext }).modelContext ?? (document as unknown as { modelContext?: ModelContext }).modelContext) as ModelContext | undefined;
    if (!mc) return;
    const ctrl = new AbortController();
    const tools: Tool[] = [
      {
        name: "buscar_ejercicios",
        description: "Busca ejercicios de DNI GYM por nombre, músculo o material y devuelve técnica y enlaces.",
        inputSchema: { type: "object", properties: { query: { type: "string" }, group: { type: "string" }, level: { type: "string" } } },
        execute: (a) => get(`/api/public/exercises?${new URLSearchParams(Object.entries(a).filter(([, v]) => v).map(([k, v]) => [k === "query" ? "q" : k, String(v)]))}`),
      },
      {
        name: "ver_rutinas",
        description: "Lista las rutinas gratuitas de DNI GYM (gimnasio o casa) filtrando por nivel y objetivo.",
        inputSchema: { type: "object", properties: { place: { type: "string", enum: ["gimnasio", "casa"] }, level: { type: "string" }, goal: { type: "string" } } },
        execute: (a) => get(`/api/public/routines?${new URLSearchParams(Object.entries(a).filter(([, v]) => v).map(([k, v]) => [k, String(v)]))}`),
      },
      {
        name: "detalle_rutina",
        description: "Devuelve los días y ejercicios de una rutina de DNI GYM por su slug.",
        inputSchema: { type: "object", properties: { slug: { type: "string" } }, required: ["slug"] },
        execute: (a) => get(`/api/public/routines/${encodeURIComponent(String(a.slug))}`),
      },
    ];
    try {
      if (mc.registerTool) tools.forEach((t) => Promise.resolve(mc.registerTool!(t, { signal: ctrl.signal })).catch(() => {}));
      else mc.provideContext?.({ tools });
    } catch {}
    return () => ctrl.abort();
  }, []);
  return null;
}
