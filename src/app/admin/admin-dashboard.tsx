"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Copy,
  Database,
  Eye,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { AUTH_ERROR_MESSAGES } from "@/components/auth-provider";
import { Avatar } from "@/components/app-shell";
import { HBarList } from "@/components/charts";
import { Logo } from "@/components/logo";
import { Badge, Button, Card, CardHeader, Modal, Spinner, Tabs, cn } from "@/components/ui";
import { adminAudit, adminDeleteEvent, adminListEvents, adminListUsers, adminResetLink, adminSetBlocked, adminSetRole, adminSystem, adminUserWorkouts, backendEnabled, type AdminSystem, type AuditEntry } from "@/lib/db";
import { CommandCenter } from "./command-center";
import { Crm } from "./crm";
import { Agents } from "./agents";
import { Inventory } from "./inventory";
import { Revenue } from "./revenue";
import { Messages } from "./messages";
import { clearErrors, getEmailLog, type EmailLog } from "@/lib/admin-api";
import { BarChart3, Boxes, CreditCard, Inbox, LayoutDashboard, ScrollText, ServerCog, Siren, UserCog, Users as UsersIcon } from "lucide-react";
import { addDays, dayKey, fmtDate, fmtDateTime, fmtNumber, timeAgo } from "@/lib/fitness";
import type { AppEvent, EventType, UserProfile, Workout } from "@/lib/types";

type Tab = "resumen" | "ingresos" | "crm" | "mensajes" | "agentes" | "inventario" | "usuarios" | "actividad" | "errores" | "sistema";

const EVENT_META: Record<EventType, { label: string; tone: "neutral" | "accent" | "good" | "warning" | "critical" | "info" }> = {
  signup: { label: "Registro", tone: "accent" },
  login: { label: "Inicio de sesión", tone: "good" },
  logout: { label: "Cierre de sesión", tone: "neutral" },
  auth_error: { label: "Error de acceso", tone: "critical" },
  client_error: { label: "Error de la app", tone: "warning" },
  visit: { label: "Visita", tone: "info" },
  workout_completed: { label: "Entreno guardado", tone: "accent" },
  account_deleted: { label: "Cuenta eliminada", tone: "warning" },
};

const FIXES: Record<string, string> = {
  "auth/wrong-credentials": "Normal si es puntual: el usuario se equivocó de contraseña. Si se repite mucho en la misma cuenta, puede ser un ataque: el sistema bloquea esa cuenta 15 minutos tras 8 intentos.",
  "auth/no-password": "La cuenta se creó con Google y no tiene contraseña. Puede entrar con Google o puedes generarle un enlace de contraseña desde Usuarios.",
  "reset/requested": "ACCIÓN: el usuario pidió cambiar su contraseña. Abre Usuarios → su ficha → «Enlace de contraseña» y envíaselo por un canal de confianza.",
  "reset/unknown-email": "Alguien pidió recuperar un correo sin cuenta. No requiere acción.",
  "account/blocked": "Una cuenta suspendida intentó entrar. Revisa si debe seguir bloqueada.",
  "account-blocked": "Una cuenta suspendida intentó entrar con Google.",
  "google-off": "El botón de Google no está configurado (faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Cloudflare).",
  "google-cancelled": "Normal: el usuario canceló en la pantalla de Google.",
  "google-state": "La sesión de Google caducó o se abrió en otra pestaña/navegador. Si se repite mucho, revisa que las cookies no estén bloqueadas.",
  "google-token": "Google rechazó el intercambio del código. Revisa que el secreto de Google y la URL de redirección autorizada sean correctos.",
  "google-verify": "No se pudo verificar el token de Google. Si se repite, revisa el ID de cliente configurado.",
};

function DemoNote() {
  return <p className="rounded-xl border border-sky/30 bg-sky/10 p-4 text-sm text-sky">Esta sección usa los datos reales de Cloudflare y no está disponible en el modo demostración.</p>;
}

export function AdminDashboard() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("resumen");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [userFilter, setUserFilter] = useState<"todos" | "activos" | "inactivos" | "bloqueados">("todos");
  const [eventFilter, setEventFilter] = useState<EventType | "todos">("todos");
  const [detail, setDetailState] = useState<UserProfile | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const setDetail = (u: UserProfile | null) => {
    setDetailState(u);
    setResetLink(null);
  };
  const [detailWorkouts, setDetailWorkouts] = useState<Workout[] | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [system, setSystem] = useState<AdminSystem | null>(null);
  const [newMessages, setNewMessages] = useState(0);
  const [emailLog, setEmailLog] = useState<EmailLog[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = Date.now();
      setNow(t);
      const [u, e, sys, au, mails] = await Promise.all([adminListUsers(), adminListEvents(t - 30 * 864e5), adminSystem().catch(() => null), adminAudit().catch(() => []), backendEnabled ? getEmailLog().catch(() => []) : Promise.resolve([])]);
      setEmailLog(mails);
      if (backendEnabled) import("@/lib/admin-api").then((x) => x.getMessages()).then((l) => setNewMessages(l.filter((x) => x.status === "nuevo").length)).catch(() => {});
      setUsers(u);
      setEvents(e);
      setSystem(sys);
      setAuditLog(au);
    } catch (e) {
      setError(`No se pudieron cargar los datos: ${(e as Error).message}.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    if (!detail) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetailWorkouts(null);
    adminUserWorkouts(detail.uid).then(setDetailWorkouts).catch(() => setDetailWorkouts([]));
  }, [detail]);

  const m = useMemo(() => {
    const d = (n: number) => now - n * 864e5;
    const real = users;
    const active1 = real.filter((u) => (u.lastActiveAt ?? u.lastLoginAt) >= d(1)).length;
    const active7 = real.filter((u) => (u.lastActiveAt ?? u.lastLoginAt) >= d(7)).length;
    const active30 = real.filter((u) => (u.lastActiveAt ?? u.lastLoginAt) >= d(30)).length;
    const new7 = real.filter((u) => u.createdAt >= d(7)).length;
    const count = (t: EventType, since = d(7)) => events.filter((e) => e.type === t && e.ts >= since).length;
    const days = Array.from({ length: 30 }, (_, i) => dayKey(addDays(new Date(), -29 + i)));
    const perDay = (t: EventType) =>
      days.map((k) => ({ label: fmtDate(k, { day: "numeric", month: "short" }), value: events.filter((e) => e.type === t && dayKey(e.ts) === k).length, sub: fmtDate(k, { weekday: "long", day: "numeric", month: "long" }) }));
    let cum = real.filter((u) => u.createdAt < new Date(days[0]).getTime()).length;
    const growth = days.map((k) => {
      cum += real.filter((u) => dayKey(u.createdAt) === k).length;
      return { label: fmtDate(k, { day: "numeric", month: "short" }), value: cum, sub: fmtDate(k) };
    });
    const refs: Record<string, number> = {};
    const pages: Record<string, number> = {};
    for (const e of events)
      if (e.type === "visit") {
        const r = e.ref || "Directo / desconocido";
        refs[r] = (refs[r] ?? 0) + 1;
        if (e.path) pages[e.path] = (pages[e.path] ?? 0) + 1;
      }
    const top = (o: Record<string, number>) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));
    const errorCodes: Record<string, number> = {};
    for (const e of events) if (e.type === "auth_error") errorCodes[e.code ?? "desconocido"] = (errorCodes[e.code ?? "desconocido"] ?? 0) + 1;
    const loginsTotal = count("login", d(30)) + count("signup", d(30));
    const authErrors = count("auth_error", d(30));
    const successRate = loginsTotal + authErrors ? (loginsTotal / (loginsTotal + authErrors)) * 100 : 100;
    return {
      total: real.length,
      active1,
      active7,
      active30,
      new7,
      blocked: real.filter((u) => u.blocked).length,
      onboarded: real.filter((u) => u.onboarded).length,
      visits7: count("visit"),
      logins7: count("login"),
      workouts7: count("workout_completed"),
      authErrors7: count("auth_error"),
      clientErrors7: count("client_error"),
      visitsDay: perDay("visit"),
      loginsDay: days.map((k, i) => ({ ...perDay("login")[i], value: events.filter((e) => (e.type === "login" || e.type === "signup") && dayKey(e.ts) === k).length })),
      growth,
      refs: top(refs),
      pages: top(pages),
      errorCodes: top(errorCodes),
      successRate,
    };
  }, [users, events, now]);

  const filteredUsers = useMemo(() => {
    const nq = q.trim().toLowerCase();
    const week = now - 7 * 864e5;
    return users.filter((u) => {
      if (nq && !`${u.name} ${u.email} ${u.uid}`.toLowerCase().includes(nq)) return false;
      const last = u.lastActiveAt ?? u.lastLoginAt;
      if (userFilter === "activos") return last >= week && !u.blocked;
      if (userFilter === "inactivos") return last < week;
      if (userFilter === "bloqueados") return u.blocked;
      return true;
    });
  }, [users, q, userFilter, now]);

  const filteredEvents = useMemo(() => events.filter((e) => (eventFilter === "todos" ? e.type !== "visit" : e.type === eventFilter)).slice(0, 300), [events, eventFilter]);
  const errors = useMemo(() => events.filter((e) => e.type === "auth_error" || e.type === "client_error"), [events]);
  const errorGroups = useMemo(() => {
    const map = new Map<string, { key: string; type: string; code: string | null; message: string; count: number; last: number }>();
    for (const e of errors) {
      const key = `${e.type}|${e.code ?? e.message ?? ""}`;
      const g = map.get(key) ?? { key, type: e.type, code: e.code ?? null, message: e.message ?? "", count: 0, last: 0 };
      g.count++;
      g.last = Math.max(g.last, e.ts);
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => b.last - a.last);
  }, [errors]);

  const toggleBlock = async (u: UserProfile) => {
    await adminSetBlocked(u.uid, !u.blocked);
    setUsers((list) => list.map((x) => (x.uid === u.uid ? { ...x, blocked: !u.blocked } : x)));
    setDetailState((d) => (d && d.uid === u.uid ? { ...d, blocked: !u.blocked } : d));
  };

  const NAV: { group: string; items: { id: Tab; label: string; icon: typeof LayoutDashboard; badge?: number; tone?: "accent" | "critical" }[] }[] = [
    { group: "Negocio", items: [
      { id: "resumen", label: "Resumen", icon: LayoutDashboard },
      { id: "ingresos", label: "Ingresos", icon: CreditCard },
      { id: "crm", label: "CRM", icon: UsersIcon },
      { id: "mensajes", label: "Mensajes", icon: Inbox, badge: newMessages, tone: "accent" },
    ] },
    { group: "Operación", items: [
      { id: "usuarios", label: `Usuarios`, icon: UserCog, badge: users.length },
      { id: "agentes", label: "Agentes IA", icon: Sparkles },
      { id: "inventario", label: "Stock", icon: Boxes },
    ] },
    { group: "Técnico", items: [
      { id: "actividad", label: "Actividad", icon: BarChart3 },
      { id: "errores", label: "Errores", icon: Siren, badge: m.authErrors7 + m.clientErrors7, tone: "critical" },
      { id: "sistema", label: "Sistema", icon: ServerCog },
    ] },
  ];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-[linear-gradient(180deg,rgb(255_107_26/0.06),transparent_40%)] px-4 py-5 lg:flex">
        <div className="flex items-center gap-2 px-2">
          <Logo href="/admin" />
        </div>
        <p className="mt-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Centro de control</p>
        <nav className="mt-6 flex-1 space-y-6 overflow-y-auto" aria-label="Panel de administración">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.group}</p>
              <ul className="mt-2 space-y-1">
                {g.items.map((it) => (
                  <li key={it.id}>
                    <button
                      onClick={() => setTab(it.id)}
                      aria-current={tab === it.id ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        tab === it.id ? "bg-accent text-accent-ink shadow-[0_8px_24px_-12px_rgb(255_107_26/0.8)]" : "text-ink-2 hover:bg-white/5 hover:text-ink",
                      )}
                    >
                      <it.icon className="size-4" />
                      <span className="flex-1 text-left">{it.label}</span>
                      {Boolean(it.badge) && (
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", tab === it.id ? "bg-black/20" : it.tone === "critical" ? "bg-critical text-white" : it.tone === "accent" ? "bg-accent text-accent-ink" : "bg-white/10 text-ink-2")}>{it.badge}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-4 space-y-2 border-t border-line pt-4">
          <button onClick={load} disabled={loading} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-2 hover:bg-white/5 hover:text-ink">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Actualizar datos
          </button>
          <Link href="/panel" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-2 hover:bg-white/5 hover:text-ink">
            <ArrowLeft className="size-4" /> Volver a mi panel
          </Link>
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
            <Avatar name={profile?.name} photo={profile?.photoURL} className="size-8" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile?.name}</p>
              <p className="truncate text-xs text-muted">Dueño · administrador</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* cabecera móvil y tableta */}
        <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-2">
              <Logo href="/admin" compact />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Centro de control</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={load} disabled={loading} className="grid size-9 place-items-center rounded-lg hover:bg-white/5" aria-label="Actualizar">
                <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              </button>
              <Link href="/panel" className="grid size-9 place-items-center rounded-lg hover:bg-white/5" aria-label="Volver a mi panel">
                <ArrowLeft className="size-4" />
              </Link>
            </div>
          </div>
          <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3" aria-label="Secciones">
            {NAV.flatMap((g) => g.items).map((it) => (
              <button
                key={it.id}
                onClick={() => setTab(it.id)}
                className={cn("flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium", tab === it.id ? "bg-accent text-accent-ink" : "bg-white/5 text-ink-2")}
              >
                <it.icon className="size-3.5" /> {it.label}
                {Boolean(it.badge) && it.tone && <span className={cn("rounded-full px-1.5 text-[10px] font-bold", it.tone === "critical" ? "bg-critical text-white" : "bg-black/25")}>{it.badge}</span>}
              </button>
            ))}
          </nav>
        </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {!backendEnabled && (
          <div className="mb-6 rounded-xl border border-sky/30 bg-sky/10 p-4 text-sm text-sky">
            <strong>Modo demostración:</strong> estás viendo usuarios y eventos de ejemplo guardados en este navegador. En producción verás aquí a tus usuarios reales guardados en Cloudflare.
          </div>
        )}
        {error && (
          <div className="mb-6 flex gap-3 rounded-xl border border-critical/30 bg-critical/10 p-4 text-sm text-critical">
            <AlertTriangle className="size-5 shrink-0" /> {error}
          </div>
        )}
        {loading && !users.length ? (
          <div className="grid h-64 place-items-center">
            <Spinner className="size-8" />
          </div>
        ) : (
          <>
            {tab === "resumen" && (backendEnabled ? <CommandCenter /> : <DemoNote />)}
            {tab === "crm" && (backendEnabled ? <Crm /> : <DemoNote />)}
            {tab === "agentes" && (backendEnabled ? <Agents /> : <DemoNote />)}
            {tab === "inventario" && (backendEnabled ? <Inventory /> : <DemoNote />)}
            {tab === "ingresos" && (backendEnabled ? <Revenue /> : <DemoNote />)}
            {tab === "mensajes" && (backendEnabled ? <Messages onCount={setNewMessages} /> : <DemoNote />)}

            {tab === "usuarios" && (
              <Card>
                <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                    <input className="input pl-9" placeholder="Buscar por nombre, email o UID" value={q} onChange={(e) => setQ(e.target.value)} />
                  </div>
                  <Tabs
                    value={userFilter}
                    onChange={setUserFilter}
                    items={[
                      { value: "todos", label: "Todos" },
                      { value: "activos", label: "Activos" },
                      { value: "inactivos", label: "Inactivos" },
                      { value: "bloqueados", label: "Bloqueados" },
                    ]}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-sm">
                    <thead className="text-left text-xs text-muted">
                      <tr className="border-b border-line">
                        <th className="px-4 py-3 font-medium">Usuario</th>
                        <th className="px-4 py-3 font-medium">Alta</th>
                        <th className="px-4 py-3 font-medium">Último acceso</th>
                        <th className="px-4 py-3 font-medium">Inicios</th>
                        <th className="px-4 py-3 font-medium">Entrenos</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {filteredUsers.map((u) => {
                        const last = u.lastActiveAt ?? u.lastLoginAt;
                        const online = last >= now - 15 * 60000;
                        return (
                          <tr key={u.uid} className="hover:bg-white/[0.02]">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar name={u.name} photo={u.photoURL} />
                                  {online && <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-surface bg-good" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{u.name}</p>
                                  <p className="truncate text-xs text-muted">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-ink-2">{fmtDate(u.createdAt)}</td>
                            <td className="px-4 py-3 text-ink-2" title={fmtDateTime(last)}>
                              {timeAgo(last)}
                            </td>
                            <td className="px-4 py-3 tabular-nums">{u.loginCount ?? 0}</td>
                            <td className="px-4 py-3 tabular-nums">{u.workoutsCount ?? 0}</td>
                            <td className="px-4 py-3">
                              {u.blocked ? <Badge tone="critical">Bloqueado</Badge> : u.onboarded ? <Badge tone="good">Activo</Badge> : <Badge tone="warning">Sin completar</Badge>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button variant="ghost" size="sm" onClick={() => setDetail(u)}>
                                <Eye className="size-4" /> Ver
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {!filteredUsers.length && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-muted">
                            No hay usuarios que coincidan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {tab === "actividad" && (
              <Card>
                <div className="flex flex-wrap gap-2 border-b border-line p-4">
                  {(["todos", "signup", "login", "logout", "workout_completed", "visit", "account_deleted"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setEventFilter(t)}
                      className={cn("rounded-full border px-3 py-1 text-xs font-medium", eventFilter === t ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-2 hover:text-ink")}
                    >
                      {t === "todos" ? "Todo (sin visitas)" : EVENT_META[t].label}
                    </button>
                  ))}
                </div>
                <EventList events={filteredEvents} />
              </Card>
            )}

            {tab === "errores" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <Card className="lg:col-span-1">
                    <CardHeader title="Errores de acceso por tipo" subtitle="30 días" />
                    <div className="p-5">{m.errorCodes.length ? <HBarList items={m.errorCodes} /> : <p className="flex items-center gap-2 text-sm text-good"><CheckCircle2 className="size-4" /> Ningún error de acceso.</p>}</div>
                  </Card>
                  <Card className="lg:col-span-2">
                    <CardHeader title="Guía rápida de solución" subtitle="Qué significa cada error y cómo arreglarlo" />
                    <ul className="divide-y divide-line px-5 pb-3">
                      {Object.entries(FIXES)
                        .filter(([code]) => m.errorCodes.some((e) => e.label === code) || ["auth/unauthorized-domain", "auth/operation-not-allowed", "profile/load-failed"].includes(code))
                        .map(([code, fix]) => (
                          <li key={code} className="py-3">
                            <code className="text-xs text-warning">{code}</code>
                            <p className="mt-1 text-sm text-ink-2">{fix}</p>
                          </li>
                        ))}
                    </ul>
                  </Card>
                </div>
                <Card>
                  <CardHeader title="Errores agrupados" subtitle="Cada problema una sola vez, con cuántas veces ha ocurrido. Cuando lo resuelvas, márcalo y desaparece." />
                  <ul className="divide-y divide-line">
                    {errorGroups.length === 0 && <li className="flex items-center gap-2 p-5 text-sm text-good"><CheckCircle2 className="size-4" /> No hay errores pendientes.</li>}
                    {errorGroups.map((g) => (
                      <li key={g.key} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 text-sm font-medium">
                            <Badge tone={g.type === "auth_error" ? "critical" : "warning"}>{g.type === "auth_error" ? "Acceso" : "App"}</Badge>
                            <span className="truncate">{g.code ?? g.message}</span>
                          </p>
                          <p className="mt-1 text-xs text-muted">{g.count} {g.count === 1 ? "vez" : "veces"} · última {timeAgo(g.last)}{g.code && FIXES[g.code] ? ` · ${FIXES[g.code]}` : ""}</p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            await clearErrors(g.code ? { code: g.code } : { message: g.message });
                            setEvents((ev) => ev.filter((e) => !((e.type === "auth_error" || e.type === "client_error") && (g.code ? e.code === g.code : e.message === g.message && !e.code))));
                          }}
                        >
                          <CheckCircle2 className="size-4" /> Marcar resuelto
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card>
                  <CardHeader title="Registro de errores" subtitle="Errores de inicio de sesión y fallos de la aplicación" />
                  <EventList events={errors} onDelete={async (id) => { await adminDeleteEvent(id); setEvents((ev) => ev.filter((e) => e.id !== id)); }} />
                </Card>
              </div>
            )}

            {tab === "sistema" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Estado" />
                  <dl className="divide-y divide-line px-5 pb-3 text-sm">
                    {[
                      ["Backend", system?.backend ?? (backendEnabled ? "Cloudflare Workers + D1" : "Modo demo (navegador)")],
                      ["Cuentas con correo y contraseña", backendEnabled ? "Activo · PBKDF2 + sesión segura en Cloudflare" : "Simulado"],
                      ["Acceso con Google", system?.auth ? (system.auth.google ? "Activo (OAuth directo)" : "Sin configurar (faltan GOOGLE_CLIENT_ID/SECRET)") : "—"],
                      ["Anti-bots (Turnstile)", system?.auth ? (system.auth.turnstile ? "Activo" : "Sin configurar") : "—"],
                      ["IA (Gemini)", system ? (system.ai ? `Activa · ${system.model}` : "Sin configurar (falta GEMINI_API_KEY)") : "—"],
                      ["Consultas de IA (30 d)", system ? `${fmtNumber(system.aiRequests30d)} · ${fmtNumber(system.aiTokens30d)} tokens` : "—"],
                      ["Límite IA por usuario/día", system ? String(system.aiDailyLimit) : "—"],
                      ["Sesiones activas", system ? fmtNumber(system.activeSessions) : "—"],
                      ["Plan de los usuarios", "Gratuito (todas las funciones)"],
                      ["Tu cuenta admin", profile?.email ?? "—"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 py-3">
                        <dt className="text-muted">{k}</dt>
                        <dd className="text-right font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
                <Card>
                  <CardHeader title="Administradores" subtitle="Quién puede gestionar DNI GYM" />
                  <div className="space-y-3 px-5 pb-5 pt-3 text-sm text-ink-2">
                    <p>
                      Administradores principales (variable <code className="text-accent">ADMIN_EMAILS</code> en Cloudflare): {system?.adminEmails.join(", ") || "—"}.
                    </p>
                    <p>Para dar acceso a otra persona, abre su ficha en la pestaña Usuarios y pulsa «Hacer administrador». El cambio queda registrado en la auditoría.</p>
                  </div>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader title="Registro de auditoría" subtitle="Acciones importantes de administración" />
                  <ul className="max-h-96 divide-y divide-line overflow-y-auto px-5 pb-3">
                    {auditLog.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                        <span>
                          <Badge tone="info" className="mr-2">
                            {a.action}
                          </Badge>
                          {a.target && <span className="text-ink-2">{a.target}</span>}
                        </span>
                        <span className="text-xs text-muted">
                          {a.actor_email} · {fmtDateTime(a.ts)}
                        </span>
                      </li>
                    ))}
                    {!auditLog.length && <li className="py-6 text-center text-sm text-muted">Sin acciones registradas todavía.</li>}
                  </ul>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader
                    title="Correo"
                    subtitle={system?.auth?.emailUsers ? "Bienvenida, contraseñas y recordatorios activos para todos los usuarios" : "Avisos al dueño activos · correos a usuarios pendientes de activar (plan Workers Paid)"}
                    action={<Badge tone={system?.auth?.email ? "good" : "warning"}>{system?.auth?.email ? "Conectado" : "Sin configurar"}</Badge>}
                  />
                  <ul className="divide-y divide-line">
                    {emailLog.length === 0 && <li className="flex items-center gap-2 px-5 py-4 text-sm text-muted"><ScrollText className="size-4" /> Aún no se ha enviado ningún correo.</li>}
                    {emailLog.slice(0, 12).map((e) => (
                      <li key={e.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                        <Badge tone={e.status === "enviado" ? "good" : e.status === "omitido" ? "neutral" : "critical"}>{e.status}</Badge>
                        <span className="min-w-0 flex-1 truncate">{e.kind} · {e.to_email}</span>
                        <span className="hidden text-xs text-muted sm:inline">{fmtDateTime(e.ts)}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader title="Datos y privacidad" />
                  <p className="flex gap-3 px-5 pb-5 pt-3 text-sm text-ink-2">
                    <Database className="size-5 shrink-0 text-muted" />
                    Todos los datos se guardan en Cloudflare D1. Las sesiones usan cookies HttpOnly y en la base de datos solo se guarda su huella (hash). Cada usuario solo puede leer sus propios datos; los administradores, solo a través de este panel.
                  </p>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
      </div>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Detalle del usuario" wide>
        {detail && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={detail.name} photo={detail.photoURL} className="size-14" />
              <div className="flex-1">
                <p className="font-display text-xl font-semibold">{detail.name}</p>
                <p className="text-sm text-muted">{detail.email}</p>
                <button
                  className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
                  onClick={() => navigator.clipboard?.writeText(detail.uid)}
                  title="Copiar UID"
                >
                  UID: <code>{detail.uid}</code> <Copy className="size-3" />
                </button>
              </div>
              {backendEnabled && detail.uid !== profile?.uid && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const role = detail.role === "admin" ? "user" : "admin";
                    await adminSetRole(detail.uid, role);
                    setUsers((list) => list.map((x) => (x.uid === detail.uid ? { ...x, role } : x)));
                    setDetail({ ...detail, role });
                  }}
                >
                  <Shield className="size-4" /> {detail.role === "admin" ? "Quitar admin" : "Hacer administrador"}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={async () => {
                  const r = await adminResetLink(detail.uid);
                  setResetLink(r.url);
                  navigator.clipboard?.writeText(r.url).catch(() => {});
                }}
              >
                <KeyRound className="size-4" /> Enlace de contraseña
              </Button>
              <Button variant={detail.blocked ? "secondary" : "danger"} onClick={() => toggleBlock(detail)}>
                {detail.blocked ? <CheckCircle2 className="size-4" /> : <Ban className="size-4" />}
                {detail.blocked ? "Desbloquear" : "Bloquear acceso"}
              </Button>
            </div>
            {resetLink && (
              <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-4 text-sm">
                <p className="font-semibold text-ink">Enlace copiado · válido 72 horas y de un solo uso</p>
                <p className="mt-1 text-ink-2">Envíaselo a {detail.email} por un canal de confianza. Al usarlo, su email queda verificado y se cierran sus otras sesiones.</p>
                <code className="mt-2 block break-all rounded-lg bg-black/40 p-2 text-xs text-accent">{resetLink}</code>
              </div>
            )}
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Alta", fmtDate(detail.createdAt)],
                ["Último acceso", timeAgo(detail.lastActiveAt ?? detail.lastLoginAt)],
                ["Inicios de sesión", String(detail.loginCount ?? 0)],
                ["Entrenos", String(detail.workoutsCount ?? 0)],
                ["Objetivo", detail.goal ?? "—"],
                ["Altura", detail.heightCm ? `${detail.heightCm} cm` : "—"],
                ["Calorías", detail.calorieGoal ? `${detail.calorieGoal} kcal` : "—"],
                ["Acceso", [detail.hasPassword && "contraseña", detail.googleLinked && "Google"].filter(Boolean).join(" + ") || detail.provider || "—"],
                ["Email", detail.emailVerified ? "verificado" : "sin verificar"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="mt-0.5 truncate text-sm font-medium capitalize">{v}</dd>
                </div>
              ))}
            </dl>
            <div>
              <h3 className="font-semibold">Últimos entrenamientos</h3>
              {detailWorkouts == null ? (
                <Spinner className="mt-3" />
              ) : detailWorkouts.length ? (
                <ul className="mt-2 divide-y divide-line text-sm">
                  {detailWorkouts.slice(0, 6).map((w) => (
                    <li key={w.id} className="flex justify-between gap-4 py-2">
                      <span className="truncate">{w.name}</span>
                      <span className="shrink-0 text-muted">{fmtDate(w.date)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">Sin entrenamientos registrados.</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold">Actividad reciente</h3>
              <EventList events={events.filter((e) => e.uid === detail.uid || (e.email && e.email === detail.email)).slice(0, 15)} compact />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function EventList({ events, onDelete, compact }: { events: AppEvent[]; onDelete?: (id: string) => void; compact?: boolean }) {
  if (!events.length) return <p className="px-5 py-10 text-center text-sm text-muted">No hay eventos.</p>;
  return (
    <ul className={cn("divide-y divide-line", !compact && "max-h-[70vh] overflow-y-auto")}>
      {events.map((e, i) => {
        const meta = EVENT_META[e.type] ?? { label: e.type, tone: "neutral" as const };
        return (
          <li key={e.id ?? i} className={cn("flex items-start gap-3", compact ? "py-2.5" : "px-5 py-3")}>
            <Badge tone={meta.tone} className="mt-0.5 shrink-0">
              {meta.label}
            </Badge>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate">
                {e.name || e.email || (e.type === "visit" ? e.path : "Anónimo")}
                {e.email && e.name && <span className="text-muted"> · {e.email}</span>}
              </p>
              {(e.code || e.message) && (
                <p className="mt-0.5 break-words text-xs text-muted">
                  {e.code && <code className="text-warning">{e.code}</code>} {e.code && AUTH_ERROR_MESSAGES[e.code] ? `— ${AUTH_ERROR_MESSAGES[e.code]}` : e.message}
                </p>
              )}
              {e.type === "visit" && e.ref && <p className="mt-0.5 text-xs text-muted">desde {e.ref}</p>}
              {!compact && e.ua && (e.type === "auth_error" || e.type === "client_error") && <p className="mt-0.5 truncate text-[11px] text-muted/70">{e.ua}</p>}
            </div>
            <span className="shrink-0 text-xs text-muted" title={fmtDateTime(e.ts)}>
              {timeAgo(e.ts)}
            </span>
            {onDelete && e.id && (
              <button onClick={() => onDelete(e.id!)} className="rounded p-1 text-muted hover:text-critical" aria-label="Eliminar evento">
                <Trash2 className="size-3.5" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
