"use client";

import { useEffect, useMemo, useState } from "react";
import { Inbox, Mail, Reply } from "lucide-react";
import { Badge, Card, Spinner, Tabs, cn } from "@/components/ui";
import { getMessages, setMessageStatus, type ContactMessage } from "@/lib/admin-api";
import { fmtDateTime } from "@/lib/fitness";

const STATUS: Record<ContactMessage["status"], { label: string; tone: "accent" | "warning" | "good" }> = {
  nuevo: { label: "Nuevo", tone: "accent" },
  en_curso: { label: "En curso", tone: "warning" },
  resuelto: { label: "Resuelto", tone: "good" },
};

export function Messages({ onCount }: { onCount?: (n: number) => void }) {
  const [list, setList] = useState<ContactMessage[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"abiertos" | "todos">("abiertos");
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    getMessages()
      .then((l) => {
        setList(l);
        onCount?.(l.filter((x) => x.status === "nuevo").length);
      })
      .catch((e) => setErr((e as Error).message));
  }, [onCount]);

  const rows = useMemo(() => (list ?? []).filter((m) => filter === "todos" || m.status !== "resuelto"), [list, filter]);
  const update = async (m: ContactMessage, status: ContactMessage["status"]) => {
    await setMessageStatus(m.id, status);
    setList((l) => {
      const next = l?.map((x) => (x.id === m.id ? { ...x, status } : x)) ?? l;
      onCount?.(next?.filter((x) => x.status === "nuevo").length ?? 0);
      return next;
    });
  };

  if (err) return <p className="rounded-xl border border-critical/30 bg-critical/10 p-4 text-sm text-critical">No se pudieron cargar los mensajes: {err}</p>;
  if (!list) return <div className="grid h-64 place-items-center"><Spinner className="size-8" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-athletic text-4xl font-extrabold uppercase italic leading-none">Mensajes</h1>
          <p className="mt-1 text-sm text-muted">Lo que te escriben desde el formulario de contacto. También te llegan a tu correo y puedes responder directamente.</p>
        </div>
        <Tabs value={filter} onChange={setFilter} items={[{ value: "abiertos", label: "Abiertos" }, { value: "todos", label: `Todos (${list.length})` }]} />
      </div>
      <Card>
        {rows.length === 0 ? (
          <div className="grid place-items-center gap-2 p-10 text-center">
            <Inbox className="size-10 text-muted" />
            <p className="text-sm text-muted">No hay mensajes {filter === "abiertos" ? "pendientes" : "todavía"}.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((m) => (
              <li key={m.id}>
                <button onClick={() => setOpen(open === m.id ? null : m.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.03]">
                  <span className={cn("mt-1 grid size-9 shrink-0 place-items-center rounded-xl", m.status === "nuevo" ? "bg-accent/15 text-accent" : "bg-white/5 text-muted")}>
                    <Mail className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", m.status === "nuevo" ? "font-semibold" : "font-medium")}>{m.subject}</p>
                    <p className="truncate text-xs text-muted">{m.name} · {m.email} · {fmtDateTime(m.ts)}</p>
                    {open !== m.id && <p className="mt-1 line-clamp-1 text-sm text-ink-2">{m.message}</p>}
                  </div>
                  <Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge>
                </button>
                {open === m.id && (
                  <div className="space-y-3 px-4 pb-4 pl-16">
                    <p className="whitespace-pre-wrap rounded-xl bg-white/[0.03] p-4 text-sm leading-relaxed text-ink-2">{m.message}</p>
                    <div className="flex flex-wrap gap-2">
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} onClick={() => m.status === "nuevo" && update(m, "en_curso")} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink">
                        <Reply className="size-4" /> Responder
                      </a>
                      {(["nuevo", "en_curso", "resuelto"] as const).filter((s) => s !== m.status).map((s) => (
                        <button key={s} onClick={() => update(m, s)} className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-ink-2 hover:text-ink">
                          Marcar {STATUS[s].label.toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
