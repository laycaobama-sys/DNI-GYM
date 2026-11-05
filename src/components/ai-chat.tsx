"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "./ui";
import { api, backendEnabled, streamApi } from "@/lib/db";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

/** Markdown mínimo y seguro (negrita, listas, títulos, párrafos) sin inyectar HTML. */
export function Markdown({ text }: { text: string }) {
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <Fragment key={i}>{part.replace(/\*/g, "")}</Fragment>
      ),
    );
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let ordered = false;
  const flush = () => {
    if (!list.length) return;
    const L = ordered ? "ol" : "ul";
    blocks.push(
      <L key={blocks.length} className={cn("my-2 space-y-1 pl-5", ordered ? "list-decimal" : "list-disc")}>
        {list.map((l, i) => (
          <li key={i}>{inline(l)}</li>
        ))}
      </L>,
    );
    list = [];
  };
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const ul = /^\s*[-*•]\s+(.*)/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)/.exec(line);
    if (ul || ol) {
      if (list.length && ordered !== Boolean(ol)) flush();
      ordered = Boolean(ol);
      list.push((ul ?? ol)![1]);
      continue;
    }
    flush();
    if (!line.trim()) continue;
    const h = /^#{1,4}\s+(.*)/.exec(line);
    blocks.push(
      h ? (
        <p key={blocks.length} className="mt-3 font-display font-semibold text-ink">
          {inline(h[1])}
        </p>
      ) : (
        <p key={blocks.length} className="my-1.5">
          {inline(line)}
        </p>
      ),
    );
  }
  flush();
  return <div className="text-sm leading-relaxed text-ink-2">{blocks}</div>;
}

export function AiChat({
  endpoint,
  historyEndpoint,
  suggestions,
  placeholder,
  intro,
  disclaimer,
  className,
}: {
  endpoint: string;
  historyEndpoint?: string;
  suggestions: string[];
  placeholder: string;
  intro: React.ReactNode;
  disclaimer?: string;
  className?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number; remaining: number; tight: boolean; blocked: boolean } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const showQuota = Boolean(historyEndpoint); // solo en el coach del usuario
  const loadQuota = () => {
    if (backendEnabled && showQuota) api<typeof quota>("/api/ai/quota").then(setQuota).catch(() => {});
  };

  useEffect(() => {
    if (!backendEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAiReady(false);
      return;
    }
    api<{ ai: boolean }>("/api/config")
      .then((c) => setAiReady(c.ai))
      .catch(() => setAiReady(false));
    if (historyEndpoint) api<NonNullable<typeof quota>>("/api/ai/quota").then(setQuota).catch(() => {});
    if (historyEndpoint)
      api<{ messages: ChatMessage[] }>(historyEndpoint)
        .then((r) => setMessages(r.messages.map((m) => ({ role: m.role, content: m.content }))))
        .catch(() => {});
  }, [historyEndpoint]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    setError(null);
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: q }, { role: "model", content: "" }]);
    try {
      await streamApi(endpoint, { message: q }, (full) =>
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "model", content: full };
          return copy;
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo obtener respuesta.");
      setMessages((m) => (m.at(-1)?.content ? m : m.slice(0, -1)));
    } finally {
      setBusy(false);
      loadQuota();
    }
  };

  const clear = async () => {
    if (historyEndpoint) await api(historyEndpoint, { method: "DELETE" }).catch(() => {});
    setMessages([]);
  };

  return (
    <div className={cn("flex min-h-[60vh] flex-col overflow-hidden rounded-3xl border border-line bg-surface", className)}>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {!messages.length && (
          <div className="py-4">
            {intro}
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={busy || aiReady === false}
                  className="flex items-start gap-2 rounded-2xl border border-line bg-white/[0.02] p-3 text-left text-sm text-ink-2 transition-colors hover:border-accent/50 hover:text-ink disabled:opacity-50"
                >
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" /> {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink">{m.content}</p>
            </div>
          ) : (
            <div key={i} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
                <Bot className="size-4" />
              </span>
              <div className="min-w-0 max-w-[90%] rounded-2xl rounded-tl-md border border-line bg-surface-2 px-4 py-2.5">
                {m.content ? <Markdown text={m.content} /> : <Loader2 className="size-4 animate-spin text-muted" aria-label="Pensando" />}
              </div>
            </div>
          ),
        )}
        {aiReady === false && (
          <p className="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            {backendEnabled ? "La IA todavía no está activada: falta configurar la clave de Gemini en Cloudflare." : "La IA no está disponible en el modo demostración."}
          </p>
        )}
        {error && <p className="rounded-2xl border border-critical/30 bg-critical/10 p-3 text-sm text-critical">{error}</p>}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-line bg-bg/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-end gap-2">
          {messages.length > 0 && (
            <button type="button" onClick={clear} className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-white/5 hover:text-ink" aria-label="Nueva conversación" title="Nueva conversación">
              <RotateCcw className="size-4" />
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={placeholder}
            disabled={aiReady === false}
            className="input max-h-40 min-h-11 flex-1 resize-none py-2.5"
            aria-label="Mensaje"
          />
          <button type="submit" disabled={busy || !input.trim() || aiReady === false} className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink disabled:opacity-40" aria-label="Enviar">
            {busy ? <Loader2 className="size-5 animate-spin" /> : <ArrowUp className="size-5" />}
          </button>
        </div>
        {quota && quota.limit > 0 && (
          <div className="mt-2 flex items-center gap-2" aria-live="polite">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className={cn("h-full rounded-full", quota.remaining / quota.limit <= 0.2 ? "bg-warning" : "bg-accent")} style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }} />
            </div>
            <span className={cn("text-[11px] tabular-nums", quota.remaining / quota.limit <= 0.2 ? "text-warning" : "text-muted")}>
              {quota.remaining === 0 ? "Sin consultas hasta mañana" : `Te quedan ${quota.remaining} de ${quota.limit} consultas hoy`}
            </span>
          </div>
        )}
        {quota?.tight && quota.remaining > 0 && <p className="mt-1 text-center text-[11px] text-warning">Hoy hay mucha demanda: el límite diario se ha reducido temporalmente para que llegue a todos.</p>}
        {quota?.blocked && <p className="mt-1 text-center text-[11px] text-warning">El coach con IA está desactivado para tu cuenta.</p>}
        {disclaimer && <p className="mt-2 text-center text-[11px] text-muted">{disclaimer}</p>}
      </form>
    </div>
  );
}
