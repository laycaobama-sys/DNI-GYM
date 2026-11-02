"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Dumbbell,
  History,
  Home,
  LineChart,
  LogOut,
  Menu,
  Salad,
  Scale,
  Shield,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { Logo } from "./logo";
import { Button, Spinner, cn } from "./ui";

const NAV = [
  { href: "/panel", label: "Inicio", icon: Home, exact: true },
  { href: "/panel/entrenar", label: "Entrenar", icon: Dumbbell },
  { href: "/panel/historial", label: "Historial", icon: History },
  { href: "/panel/progreso", label: "Progreso", icon: LineChart },
  { href: "/panel/cuerpo", label: "Peso y medidas", icon: Scale },
  { href: "/panel/nutricion", label: "Nutrición", icon: Salad },
  { href: "/panel/ejercicios", label: "Ejercicios", icon: BookOpen },
  { href: "/panel/perfil", label: "Perfil", icon: User },
];

const MOBILE = ["/panel", "/panel/entrenar", "/panel/progreso", "/panel/nutricion", "/panel/perfil"];

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
export function RequireAuth({ children, admin }: { children: React.ReactNode; admin?: boolean }) {
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, isAdmin, signOut, mode } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname?.startsWith(href + "/"));

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Panel">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            isActive(n.href, n.exact) ? "bg-accent/10 text-accent" : "text-ink-2 hover:bg-white/5 hover:text-ink",
          )}
        >
          <n.icon className="size-[18px]" /> {n.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-3 py-2.5 text-sm font-medium text-ink-2 hover:text-ink"
        >
          <Shield className="size-[18px] text-warning" /> Panel de administración
        </Link>
      )}
    </nav>
  );

  const userBox = (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
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
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/60 p-4 lg:flex">
        <div className="px-2 py-2">
          <Logo href="/panel" />
        </div>
        <div className="mt-6 flex-1 overflow-y-auto">{nav}</div>
        {userBox}
      </aside>

      {/* Topbar móvil */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/80 px-4 backdrop-blur-xl lg:hidden">
          <Logo href="/panel" />
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-ink-2 hover:bg-white/5" aria-label="Abrir menú">
            <Menu className="size-5" />
          </button>
        </header>
        {mode === "demo" && (
          <div className="border-b border-sky/20 bg-sky/10 px-4 py-2 text-center text-xs text-sky">
            Modo demostración: datos de ejemplo guardados solo en este navegador. Configura Firebase para activar cuentas reales con Google.
          </div>
        )}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
      </div>

      {/* Drawer móvil */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 flex-col gap-4 border-l border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted">Menú</span>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-ink-2 hover:bg-white/5" aria-label="Cerrar menú">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            {userBox}
          </div>
        </div>
      )}

      {/* Barra inferior móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="Accesos rápidos">
        {MOBILE.map((href) => {
          const n = NAV.find((x) => x.href === href)!;
          const active = isActive(n.href, n.exact);
          return (
            <Link key={href} href={href} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", active ? "text-accent" : "text-muted")}>
              <n.icon className="size-5" />
              {n.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
