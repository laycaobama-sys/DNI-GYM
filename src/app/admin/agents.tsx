"use client";

import { useState } from "react";
import { Bot, Boxes, Copy, LifeBuoy, Megaphone, Play, Rocket, Sparkles, UserCheck } from "lucide-react";
import { AiChat, Markdown } from "@/components/ai-chat";
import { Button, Card, cn } from "@/components/ui";
import { runAgent } from "@/lib/admin-api";

const AGENTS = [
  { id: "retencion", name: "Retención", icon: UserCheck, desc: "Detecta quién está a punto de abandonar y redacta mensajes para recuperarlos.", placeholder: "Ej.: céntrate en los que no completaron el cuestionario" },
  { id: "crecimiento", name: "Crecimiento", icon: Rocket, desc: "Encuentra el cuello de botella del embudo y te da un plan de 7 días.", placeholder: "Ej.: quiero 100 usuarios nuevos este mes" },
  { id: "soporte", name: "Soporte técnico", icon: LifeBuoy, desc: "Revisa los errores reales de acceso y de la app y te dice cómo arreglarlos.", placeholder: "Ej.: ¿por qué falla el acceso con Google?" },
  { id: "contenido", name: "Contenido SEO/AEO", icon: Megaphone, desc: "Propone guías, FAQ y enlaces para que Google y las IA recomienden DNI GYM.", placeholder: "Ej.: ideas para posicionar «rutina en casa»" },
  { id: "inventario", name: "Inventario", icon: Boxes, desc: "Analiza tu stock y te dice qué reponer, cuánto y qué está parado.", placeholder: "Ej.: presupuesto de reposición de 300 €" },
] as const;

function AgentCard({ a }: { a: (typeof AGENTS)[number] }) {
  const [msg, setMsg] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const Icon = a.icon;
  const run = async () => {
    setBusy(true);
    setErr(null);
    setOut("");
    try {
      await runAgent(a.id, msg, setOut);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className={cn("flex flex-col p-5", out && "md:col-span-2")}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold">Agente de {a.name.toLowerCase()}</h3>
          <p className="text-sm text-ink-2">{a.desc}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <input className="input" placeholder={a.placeholder} value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={1500} onKeyDown={(e) => e.key === "Enter" && !busy && run()} />
        <Button onClick={run} disabled={busy} aria-label={`Ejecutar agente de ${a.name}`}>
          {busy ? <Bot className="size-4 animate-pulse" /> : <Play className="size-4" />} <span className="hidden sm:inline">{busy ? "Pensando…" : "Ejecutar"}</span>
        </Button>
      </div>
      {err && <p className="mt-3 text-sm text-critical">{err}</p>}
      {out && (
        <div className="mt-4 rounded-xl border border-line bg-black/30 p-4 text-sm">
          <div className="mb-2 flex justify-end">
            <button onClick={() => navigator.clipboard?.writeText(out)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
              <Copy className="size-3.5" /> Copiar
            </button>
          </div>
          <Markdown text={out} />
        </div>
      )}
    </Card>
  );
}

export function Agents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-athletic text-4xl font-extrabold uppercase italic leading-none">Agentes de IA</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Cada agente lee los datos reales de DNI GYM (sin emails ni datos de contacto) y te propone acciones. Solo aconsejan y redactan: ningún agente cambia datos por su cuenta. Funcionan con Gemini 2.5 Flash.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {AGENTS.map((a) => (
          <AgentCard key={a.id} a={a} />
        ))}
      </div>
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold"><Sparkles className="size-5 text-accent" /> Pregunta libre al analista</h2>
        <AiChat
          endpoint="/api/admin/ai"
          intro={
            <div>
              <p className="font-athletic text-3xl font-extrabold uppercase italic">Analista IA de DNI GYM</p>
              <p className="mt-1 text-sm text-muted">Responde con los datos reales de tu plataforma (usuarios, accesos, errores y entrenos) y te propone acciones concretas.</p>
            </div>
          }
          suggestions={["Resume el estado de DNI GYM esta semana", "¿Hay problemas de acceso que deba arreglar?", "¿Cómo va el crecimiento y la retención?", "Dame 3 acciones para conseguir más usuarios activos"]}
          placeholder="Pregunta sobre tu app: usuarios, accesos, errores, crecimiento…"
          disclaimer="Las respuestas se basan en las métricas de los últimos 30 días. Cada consulta queda registrada en la auditoría."
        />
      </div>
    </div>
  );
}
