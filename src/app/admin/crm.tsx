"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Bot, CheckCircle2, Download, MessageSquarePlus, Search, ShieldAlert, Sparkles, Tag, X } from "lucide-react";
import { Avatar } from "@/components/app-shell";
import { Markdown } from "@/components/ai-chat";
import { Badge, Button, Card, Modal, Spinner, cn } from "@/components/ui";
import { STAGE_META, addNote, customerAi, getCrm, getNotes, setTags, setUserAi, setUserBlocked, type CrmNote, type Customer, type Stage } from "@/lib/admin-api";
import { useAuth } from "@/components/auth-provider";
import { fmtDate, fmtDateTime, fmtNumber, timeAgo } from "@/lib/fitness";

const STAGES: Stage[] = ["nuevo", "activo", "en_riesgo", "inactivo", "bloqueado"];
const SUGGESTED_TAGS = ["VIP", "Embajador", "Feedback", "Interesado en premium", "Necesita ayuda", "Entrenador"];

function HealthBar({ v }: { v: number }) {
  return (
    <div className="flex items-center gap-2" title={`Salud ${v}/100`}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full", v >= 60 ? "bg-good" : v >= 30 ? "bg-warning" : "bg-critical")} style={{ width: `${v}%` }} />
      </div>
      <span className="w-7 text-xs tabular-nums text-muted">{v}</span>
    </div>
  );
}

function csv(rows: Customer[]) {
  const head = ["nombre", "email", "etapa", "salud", "alta", "ultima_actividad", "entrenos", "entrenos_30d", "objetivo", "etiquetas"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((c) => [c.name, c.email, STAGE_META[c.stage].label, c.health, fmtDate(c.createdAt), fmtDate(c.lastActiveAt), c.workoutsCount, c.workouts30, c.goal, c.tags.join("|")].map(esc).join(","));
  const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `dnigym-clientes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function Crm() {
  const [list, setList] = useState<Customer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage | "todos">("todos");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    try {
      setList(await getCrm());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const counts = useMemo(() => Object.fromEntries(STAGES.map((s) => [s, list?.filter((c) => c.stage === s).length ?? 0])) as Record<Stage, number>, [list]);
  const rows = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return (list ?? []).filter((c) => (stage === "todos" || c.stage === stage) && (!nq || `${c.name} ${c.email} ${c.tags.join(" ")}`.toLowerCase().includes(nq)));
  }, [list, stage, q]);

  if (error) return <p className="rounded-xl border border-critical/30 bg-critical/10 p-4 text-sm text-critical">No se pudo cargar el CRM: {error}</p>;
  if (!list) return <div className="grid h-64 place-items-center"><Spinner className="size-8" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-athletic text-4xl font-extrabold uppercase italic leading-none">CRM de clientes</h1>
        <p className="mt-1 text-sm text-muted">Etapas automáticas según la actividad real. Pulsa una etapa para filtrar y un cliente para ver su ficha.</p>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => setStage(stage === s ? "todos" : s)}
            className={cn("card min-w-36 shrink-0 p-4 text-left transition-colors", stage === s ? "border-accent bg-accent/[0.06]" : "hover:border-line-strong")}
            title={STAGE_META[s].hint}
          >
            <Badge tone={STAGE_META[s].tone}>{STAGE_META[s].label}</Badge>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{fmtNumber(counts[s])}</p>
            <p className="text-xs text-muted">{STAGE_META[s].hint}</p>
          </button>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Buscar por nombre, email o etiqueta" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {stage !== "todos" && (
              <Button variant="ghost" size="sm" onClick={() => setStage("todos")}>
                <X className="size-4" /> Quitar filtro
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => csv(rows)}>
              <Download className="size-4" /> Exportar CSV
            </Button>
          </div>
        </div>
        <ul className="divide-y divide-line">
          {rows.length === 0 && <li className="p-6 text-sm text-muted">No hay clientes con este filtro.</li>}
          {rows.slice(0, 300).map((c) => (
            <li key={c.uid}>
              <button onClick={() => setSel(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]">
                <Avatar name={c.name || c.email} photo={c.photoURL} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    {c.name || "Sin nombre"}
                    {c.role === "admin" && <Badge tone="warning">Admin</Badge>}
                  </p>
                  <p className="truncate text-xs text-muted">{c.email}</p>
                  {c.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-ink-2">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="hidden w-40 flex-col items-end gap-1 sm:flex">
                  <Badge tone={STAGE_META[c.stage].tone}>{STAGE_META[c.stage].label}</Badge>
                  <HealthBar v={c.health} />
                </div>
                <div className="hidden w-28 text-right text-xs text-muted md:block">
                  <p>{c.workoutsCount} entrenos</p>
                  <p>{timeAgo(c.lastActiveAt)}</p>
                </div>
                <span className="sm:hidden"><Badge tone={STAGE_META[c.stage].tone}>{STAGE_META[c.stage].label}</Badge></span>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {sel && <CustomerSheet c={sel} onClose={() => setSel(null)} onChange={(next) => { setList((l) => l?.map((x) => (x.uid === next.uid ? next : x)) ?? l); setSel(next); }} />}
    </div>
  );
}

function CustomerSheet({ c, onClose, onChange }: { c: Customer; onClose: () => void; onChange: (c: Customer) => void }) {
  const [notes, setNotes] = useState<CrmNote[] | null>(null);
  const [text, setText] = useState("");
  const [tag, setTag] = useState("");
  const [ai, setAi] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const { profile } = useAuth();
  const isSelf = profile?.uid === c.uid;

  useEffect(() => {
    getNotes(c.uid).then(setNotes).catch(() => setNotes([]));
  }, [c.uid]);

  const saveTags = async (tags: string[]) => onChange({ ...c, tags: (await setTags(c.uid, tags)).tags });
  const analyze = async () => {
    setAiBusy(true);
    setAiErr(null);
    setAi("");
    try {
      await customerAi(c.uid, setAi);
    } catch (e) {
      setAiErr((e as Error).message);
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Ficha de cliente">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Avatar name={c.name || c.email} photo={c.photoURL} className="size-14" />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold">{c.name || "Sin nombre"}</p>
            <a href={`mailto:${c.email}`} className="block truncate text-sm text-accent">{c.email}</a>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge tone={STAGE_META[c.stage].tone}>{STAGE_META[c.stage].label}</Badge>
              <Badge tone="neutral">{c.provider === "google" ? "Google" : "Correo"}</Badge>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {[
            ["Salud", `${c.health}/100`],
            ["Alta", fmtDate(c.createdAt)],
            ["Última actividad", timeAgo(c.lastActiveAt)],
            ["Entrenos", `${c.workoutsCount} (${c.workouts30} en 30 d)`],
            ["Coach IA (30 d)", String(c.ai30)],
            ["Objetivo", c.goal ?? "—"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/[0.03] p-3">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        <section className="rounded-2xl border border-line p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert className="size-4 text-accent" /> Control de la cuenta</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Acceso a DNI GYM</p>
              {c.blocked ? (
                <Button size="sm" variant="secondary" className="mt-1.5" onClick={async () => { await setUserBlocked(c.uid, false); onChange({ ...c, blocked: false, stage: "activo" }); }}>
                  <CheckCircle2 className="size-4" /> Desbloquear
                </Button>
              ) : confirmBlock ? (
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <Button size="sm" variant="danger" onClick={async () => { await setUserBlocked(c.uid, true); setConfirmBlock(false); onChange({ ...c, blocked: true, stage: "bloqueado" }); }}>
                    <Ban className="size-4" /> Sí, bloquear
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmBlock(false)}>Cancelar</Button>
                </div>
              ) : (
                <Button size="sm" variant="danger" className="mt-1.5" disabled={isSelf} onClick={() => setConfirmBlock(true)}>
                  <Ban className="size-4" /> Bloquear acceso
                </Button>
              )}
              <p className="mt-1 text-[11px] text-muted">Al bloquear se cierran todas sus sesiones al instante.</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs text-muted"><Bot className="size-3.5" /> DNI AI Coach</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <select
                  className="input !w-auto !py-1.5 text-sm"
                  value={c.aiBlocked ? "off" : c.aiLimit == null ? "default" : String(c.aiLimit)}
                  onChange={async (e) => {
                    const v = e.target.value;
                    if (v === "off") {
                      await setUserAi(c.uid, { aiBlocked: true });
                      onChange({ ...c, aiBlocked: true });
                    } else {
                      const aiLimit = v === "default" ? null : Number(v);
                      await setUserAi(c.uid, { aiBlocked: false, aiLimit });
                      onChange({ ...c, aiBlocked: false, aiLimit });
                    }
                  }}
                  aria-label="Límite diario de IA"
                >
                  <option value="default">Límite normal</option>
                  <option value="5">5 consultas/día</option>
                  <option value="10">10 consultas/día</option>
                  <option value="60">60 consultas/día</option>
                  <option value="off">IA desactivada</option>
                </select>
              </div>
              <p className="mt-1 text-[11px] text-muted">{c.ai30} consultas en los últimos 30 días.</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Tag className="size-4 text-accent" /> Etiquetas</h3>
          <div className="flex flex-wrap gap-1.5">
            {c.tags.map((t) => (
              <button key={t} onClick={() => saveTags(c.tags.filter((x) => x !== t))} className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs text-accent">
                {t} <X className="size-3" />
              </button>
            ))}
            {SUGGESTED_TAGS.filter((t) => !c.tags.includes(t)).map((t) => (
              <button key={t} onClick={() => saveTags([...c.tags, t])} className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-xs text-muted hover:text-ink">
                + {t}
              </button>
            ))}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (tag.trim()) saveTags([...c.tags, tag.trim()]).then(() => setTag(""));
            }}
          >
            <input className="input" placeholder="Nueva etiqueta" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={24} />
            <Button type="submit" variant="secondary" size="sm">Añadir</Button>
          </form>
        </section>

        <section className="rounded-2xl border border-accent/25 bg-accent/[0.05] p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-accent" /> Análisis con IA</h3>
            <Button size="sm" onClick={analyze} disabled={aiBusy}>{aiBusy ? "Analizando…" : ai ? "Repetir" : "Analizar cliente"}</Button>
          </div>
          <p className="mt-1 text-xs text-muted">Resumen, riesgo de abandono, siguiente acción y un mensaje listo para enviar. La IA no cambia nada por su cuenta.</p>
          {aiErr && <p className="mt-3 text-sm text-critical">{aiErr}</p>}
          {ai && <div className="mt-3 text-sm"><Markdown text={ai} /></div>}
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><MessageSquarePlus className="size-4 text-accent" /> Notas internas</h3>
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!text.trim()) return;
              const n = await addNote(c.uid, text);
              setNotes(n);
              setText("");
              onChange({ ...c, notes: n.length });
            }}
          >
            <input className="input" placeholder="Ej.: le escribí por WhatsApp para animarle" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
            <Button type="submit" size="sm">Guardar</Button>
          </form>
          <ul className="mt-3 space-y-2">
            {notes === null && <li><Spinner /></li>}
            {notes?.length === 0 && <li className="text-sm text-muted">Sin notas todavía.</li>}
            {notes?.map((n) => (
              <li key={n.id} className="rounded-xl bg-white/[0.03] p-3 text-sm">
                <p className="whitespace-pre-wrap">{n.text}</p>
                <p className="mt-1 text-[11px] text-muted">{fmtDateTime(n.ts)} · {n.author_email}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
}
