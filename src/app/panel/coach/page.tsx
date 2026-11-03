"use client";

import Image from "next/image";
import { useState } from "react";
import { Building2, Clock, Home, Loader2, Play, Sparkles, Wand2 } from "lucide-react";
import { AiChat } from "@/components/ai-chat";
import { useAuth } from "@/components/auth-provider";
import { usePlayer } from "@/components/workout-player";
import { PageHeader, cn } from "@/components/ui";
import { EXERCISE_BY_SLUG, exerciseImages } from "@/data/exercises";
import type { PlanItem } from "@/data/challenges";
import { api, backendEnabled } from "@/lib/db";

interface Proposal {
  title: string;
  summary: string;
  items: PlanItem[];
}

export default function CoachPage() {
  const { profile } = useAuth();
  const player = usePlayer();
  const [minutes, setMinutes] = useState(profile?.sessionMinutes ?? 45);
  const [place, setPlace] = useState<"gimnasio" | "casa">(profile?.place ?? "gimnasio");
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    setProposal(null);
    try {
      setProposal(await api<Proposal>("/api/ai/workout", { method: "POST", body: { minutes, place, focus } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el entreno.");
    } finally {
      setBusy(false);
    }
  };

  const firstName = profile?.name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <PageHeader title="DNI AI Coach" subtitle="Tu entrenador inteligente: conoce tus entrenos, récords, peso y nutrición" />

      <section className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/[0.14] via-surface to-surface p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-ink">
            <Wand2 className="size-5" />
          </span>
          <div>
            <h2 className="font-athletic text-3xl font-extrabold uppercase italic leading-none">Crea mi entreno de hoy</h2>
            <p className="mt-1 text-sm text-ink-2">La IA revisa lo que has entrenado y tus récords y te propone una sesión con ejercicios del catálogo. Tú decides si empezarla.</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[auto_auto_1fr_auto] md:items-end">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Tiempo</p>
            <div className="flex gap-1.5">
              {[20, 30, 45, 60].map((m) => (
                <button key={m} onClick={() => setMinutes(m)} className={cn("flex h-10 items-center gap-1 rounded-xl border px-3 text-sm font-semibold", minutes === m ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-2")}>
                  <Clock className="size-3.5" /> {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Lugar</p>
            <div className="flex gap-1.5">
              {([["gimnasio", "Gym", Building2], ["casa", "Casa", Home]] as const).map(([v, l, I]) => (
                <button key={v} onClick={() => setPlace(v)} className={cn("flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold", place === v ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-2")}>
                  <I className="size-4" /> {l}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Enfoque o molestias (opcional)</span>
            <input value={focus} onChange={(e) => setFocus(e.target.value)} maxLength={120} placeholder="Ej.: pecho y espalda, me molesta la rodilla…" className="input h-10" />
          </label>
          <button onClick={generate} disabled={busy || !backendEnabled} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-accent-ink disabled:opacity-50">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {busy ? "Creando…" : "Crear entreno"}
          </button>
        </div>
        {error && <p className="mt-4 rounded-2xl border border-critical/30 bg-critical/10 p-3 text-sm text-critical">{error}</p>}
        {proposal && (
          <div className="mt-5 rounded-2xl border border-line bg-bg/60 p-4">
            <p className="font-display text-lg font-semibold">{proposal.title}</p>
            {proposal.summary && <p className="mt-1 text-sm text-ink-2">{proposal.summary}</p>}
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {proposal.items.map((it, i) => {
                const e = EXERCISE_BY_SLUG[it.slug];
                return (
                  <li key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-2">
                    <Image src={exerciseImages(e)[1]} alt="" width={96} height={64} className="h-11 w-16 rounded-lg bg-white object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{e.name}</span>
                      <span className="text-xs text-muted">
                        {it.sets} × {it.seconds ? `${it.seconds} s` : it.reps} · {it.rest} s
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => player.start({ title: proposal.title, subtitle: "Creado por DNI AI Coach", cover: "/brand/hero-wide.webp", items: proposal.items })}
                className="flex h-11 items-center gap-2 rounded-xl bg-accent px-5 font-athletic text-lg font-extrabold uppercase italic text-accent-ink"
              >
                <Play className="size-4 fill-current" /> Empezar
              </button>
              <button onClick={generate} disabled={busy} className="h-11 rounded-xl border border-line px-4 text-sm font-semibold text-ink-2 hover:text-ink">
                Otra propuesta
              </button>
            </div>
          </div>
        )}
      </section>

      <AiChat
        endpoint="/api/ai/chat"
        historyEndpoint="/api/ai/history"
        placeholder="Pregúntale a tu coach…"
        suggestions={[
          "¿Estoy progresando? Analiza mis últimas semanas",
          "¿Qué debería cenar hoy según lo que he comido?",
          "Ajusta mi rutina: solo tengo 30 minutos al día",
          "¿Cuánto peso debería usar en sentadilla?",
        ]}
        intro={
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold">Hola{firstName ? `, ${firstName}` : ""}. Soy tu coach.</p>
              <p className="text-sm text-muted">Respondo con tus datos reales: entrenos, récords, peso y comidas. Pregúntame lo que quieras sobre entreno o nutrición.</p>
            </div>
          </div>
        }
        disclaimer="DNI AI Coach orienta, no sustituye a un profesional sanitario. Ante dolor, lesiones o enfermedades, consulta a un médico."
      />
    </div>
  );
}
