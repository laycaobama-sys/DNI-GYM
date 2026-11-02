"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../auth-provider";
import { cn } from "@/lib/cn";

/** Barra inferior fija en móvil que aparece al pasar la portada. */
export function StickyCta() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 640 && window.innerHeight + window.scrollY < document.body.scrollHeight - 300);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-bg/85 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-300 md:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <Link
        href={user ? "/panel" : "/login"}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-ink"
      >
        {user ? "Ir a mi panel" : "Empezar gratis con Google"} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
