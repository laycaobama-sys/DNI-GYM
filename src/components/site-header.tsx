"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { useAuth } from "./auth-provider";
import { buttonClass, cn } from "@/lib/cn";

const NAV = [
  { href: "/ejercicios", label: "Ejercicios" },
  { href: "/rutinas", label: "Rutinas" },
  { href: "/calculadoras", label: "Calculadoras" },
  { href: "/#funciones", label: "Funciones" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const cta = user ? (
    <Link href="/panel" className={buttonClass("primary", "sm")}>
      Mi panel
    </Link>
  ) : (
    <>
      <span className="hidden sm:block">
        <Link href="/login" className={buttonClass("ghost", "sm")}>
          Iniciar sesión
        </Link>
      </span>
      <Link href="/login" className={buttonClass("primary", "sm")}>
        <span className="hidden min-[420px]:inline">Empezar gratis</span>
        <span className="min-[420px]:hidden">Empezar</span>
      </Link>
    </>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname?.startsWith(n.href) ? "text-ink" : "text-ink-2 hover:text-ink",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <div className={cn("flex items-center gap-2 transition-opacity", loading && "opacity-0")}>{cta}</div>
          <button
            className="rounded-lg p-2 text-ink-2 hover:bg-white/5 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-line px-4 py-3 md:hidden" aria-label="Móvil">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-2 hover:bg-white/5 hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
