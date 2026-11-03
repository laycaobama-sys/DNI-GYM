"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  Dumbbell,
  History,
  Home,
  LineChart,
  Compass,
  Sparkles,
  Flame,
  LogOut,
  Target,
  Salad,
  Scale,
  Shield,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { useData } from "./data-provider";
import { levelInfo } from "@/lib/plan";
import { weekStreak } from "@/lib/fitness";
import { Logo } from "./logo";
import { Button, Spinner, cn } from "./ui";

const NAV = [
  { href: "/panel", label: "Inicio", icon: Home, exact: true },
  { href: "/panel/coach", label: "DNI AI Coach", icon: Sparkles },
  { href: "/panel/entrenar", label: "Entrenar", icon: Dumbbell },
  { href: "/panel/explorar", label: "Explorar", icon: Compass },
  { href: "/panel/retos", label: "Retos 30 días", icon: Target },
  { href: "/panel/ejercicios", label: "Ejercicios", icon: BookOpen },
  { href: "/panel/nutricion", label: "Nutrición", icon: Salad },
  { href: "/panel/progreso", label: "Progreso y logros", icon: LineChart },
  { href: "/panel/historial", label: "Historial", icon: History },
  { href: "/panel/cuerpo", label: "Peso y medidas", icon: Scale },
  { href: "/panel/perfil", label: "Perfil", icon: User },
];

const TABS = [
  { href: "/panel", label: "Inicio", icon: Home, exact: true },
  { href: "/panel/nutricion", label: "Nutrición", icon: Salad },
  { href: "/panel/entrenar", label: "Entrenar", icon: Dumbbell, center: true },
  { href: "/panel/progreso", label: "Progreso", icon: LineChart },
  { href: "/panel/perfil", label: "Perfil", icon: User },
];

export function Avatar({ name, photo, className }: { name?: string; photo?: string | null; className?: string }) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (photo)
    return (
      <Image src={photo} alt={name ?? ""} width={36} height={36} unoptimized referrerPolicy="no-referrer" className={cn("size-9 rounded-full object-cover", className)} />
    );
  return <span className={cn("grid size-9 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent", className)}>{initials}</span>;
}

/** Protege rutas: requiere sesión (y opcionalmente rol admin). */
export function RequireAuth({ children, admin, onboarding }: { children: React.ReactNode; admin?: boolean; onboarding?: boolean }) {
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);
  const needsOnboarding = Boolean(onboarding && profile && !profile.onboarded && !profile.blocked);
  useEffect(() => {
    if (needsOnboarding) router.replace("/bienvenida");
  }, [needsOnboarding, router]);
  if (needsOnboarding)
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="size-8" />
      </div>
    );

  if (loading || !user || !profile)
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  if (profile.blocked && !isAdmin)
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="max-w-md">
          <ShieldAlert className="mx-auto size-12 text-critical" />
          <h1 className="mt-4 font-display text-2xl font-semibold">Cuenta suspendida</h1>
          <p className="mt-2 text-muted">Tu cuenta está suspendida temporalmente. Si crees que es un error, contacta con nosotros indicando tu email ({profile.email}).</p>
          <Button className="mt-6" variant="secondary" onClick={() => signOut()}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    );
  if (admin && !isAdmin)
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="max-w-md">
          <Shield className="mx-auto size-12 text-muted" />
          <h1 className="mt-4 font-display text-2xl font-semibold">Acceso restringido</h1>
          <p className="mt-2 text-muted">Esta sección es solo para administradores. Tu cuenta ({profile.email}) no tiene permisos de administración.</p>
          <Link href="/panel" className="mt-6 inline-block text-accent underline">
            Volver a mi panel
          </Link>
        </div>
      </div>
    );
  return <>{children}</>;
}

/** Botón «Volver»: vuelve a la pantalla anterior o, si se entró directamente, al inicio del panel. */
export function BackButton({ withLabel, fallback = "/panel" }: { withLabel?: boolean; fallback?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className={cn(
        "inline-flex items-center gap-1 rounded-full text-sm font-medium text-ink-2 transition-colors hover:text-ink",
        withLabel ? "border border-line px-3 py-1.5 hover:bg-white/5" : "grid size-10 place-items-center hover:bg-white/5",
      )}
      aria-label="Volver"
    >
      <ChevronLeft className={withLabel ? "size-4" : "size-6"} />
      {withLabel && "Volver"}
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, isAdmin, signOut, mode } = useAuth();
  const { workouts } = useData();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href || pathname === href + "/" : pathname === href || pathname?.startsWith(href + "/"));
  const lvl = levelInfo(workouts);
  const isRoot = pathname === "/panel" || pathname === "/panel/";
  const currentLabel =
    [...NAV].sort((a, b) => b.href.length - a.href.length).find((n) => pathname?.startsWith(n.href) && n.href !== "/panel")?.label ?? "DNI GYM";
  const streak = weekStreak(workouts);

  const nav = (
    <nav className="flex flex-col gap-0.5" aria-label="Panel">
      {NAV.map((n, i) => (
        <div key={n.href}>
          {i === 7 && <p className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Seguimiento</p>}
          <Link
            href={n.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(n.href, n.exact) ? "bg-accent text-accent-ink" : "text-ink-2 hover:bg-white/5 hover:text-ink",
            )}
          >
            <n.icon className="size-[18px]" /> {n.label}
          </Link>
        </div>
      ))}
      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-3 py-2.5 text-sm font-medium text-ink-2 hover:text-ink"
        >
          <Shield className="size-[18px] text-warning" /> Administración
        </Link>
      )}
    </nav>
  );

  const levelCard = (
    <Link href="/panel/progreso" onClick={() => setOpen(false)} className="block rounded-2xl border border-line bg-gradient-to-br from-accent/[0.12] to-transparent p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Nivel {lvl.level}</p>
        <span className="flex items-center gap-1 text-xs font-bold text-orange">
          <Flame className="size-3.5" /> {streak} sem
        </span>
      </div>
      <p className="font-athletic text-2xl font-extrabold uppercase italic">{lvl.name}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-accent" style={{ width: `${lvl.progress * 100}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-muted">{lvl.toNext} XP para el siguiente nivel</p>
    </Link>
  );

  const userBox = (
    <div className="flex items-center gap-3 rounded-xl p-2">
      <Avatar name={profile?.name} photo={profile?.photoURL} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{profile?.name}</p>
        <p className="truncate text-xs text-muted">{profile?.email}</p>
      </div>
      <button
        onClick={async () => {
          await signOut();
          router.replace("/");
        }}
        className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-ink"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar escritorio */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 border-r border-line bg-surface/40 p-4 lg:flex">
        <div className="px-2 py-2">
          <Logo href="/panel" />
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        {levelCard}
        {userBox}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar móvil / tablet */}
        <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between border-b border-line bg-bg/85 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
          {isRoot ? (
            <Logo href="/panel" />
          ) : (
            <div className="flex min-w-0 items-center gap-1">
              <BackButton />
              <span className="truncate font-display text-base font-semibold">{currentLabel}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Link href="/panel/coach" className="grid size-9 place-items-center rounded-full bg-accent/15 text-accent" aria-label="DNI AI Coach">
              <Sparkles className="size-4" />
            </Link>
            <Link href="/panel/progreso" className="flex items-center gap-1 rounded-full bg-orange/10 px-2.5 py-1 text-xs font-bold text-orange" aria-label={`Racha de ${streak} semanas`}>
              <Flame className="size-4" /> {streak}
            </Link>
            <button onClick={() => setOpen(true)} className="rounded-full" aria-label="Abrir menú">
              <Avatar name={profile?.name} photo={profile?.photoURL} className="size-8" />
            </button>
          </div>
        </header>
        {mode === "demo" && (
          <div className="border-b border-sky/20 bg-sky/10 px-4 py-2 text-center text-xs text-sky">
            Modo demostración: datos de ejemplo guardados solo en este navegador.
          </div>
        )}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          {!isRoot && (
            <div className="mb-4 hidden lg:block">
              <BackButton withLabel />
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[88vw] flex-col gap-4 border-l border-line bg-surface p-4 pt-[max(1rem,env(safe-area-inset-top))] animate-fade-up">
            <div className="flex items-center justify-between">
              {userBox}
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-ink-2 hover:bg-white/5" aria-label="Cerrar menú">
                <X className="size-5" />
              </button>
            </div>
            {levelCard}
            <div className="flex-1 overflow-y-auto">{nav}</div>
          </div>
        </div>
      )}

      {/* Barra inferior móvil */}
      {(
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Accesos rápidos">
          <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
            {TABS.map((t) =>
              t.center ? (
                <Link key={t.href} href={t.href} className="-mt-6 flex flex-col items-center gap-1 pb-2 text-[11px] font-semibold text-ink" aria-label={t.label}>
                  <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-ink shadow-[0_8px_30px_-6px_rgb(255_107_26/0.7)] ring-4 ring-bg">
                    <t.icon className="size-6" />
                  </span>
                  {t.label}
                </Link>
              ) : (
                <Link key={t.href} href={t.href} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", isActive(t.href, t.exact) ? "text-accent" : "text-muted")}>
                  <t.icon className="size-5" />
                  {t.label}
                </Link>
              ),
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
