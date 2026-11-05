"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

const KEY = "dnigym:cookies-ok";

/**
 * Aviso informativo compacto: DNI GYM solo usa cookies técnicas imprescindibles (no requieren consentimiento).
 * No bloquea nada (los clics pasan alrededor) y se oculta solo a los 10 segundos.
 */
export function CookieNotice() {
  const path = usePathname();
  const [show, setShow] = useState(false);
  const hidden = /^\/(admin|bienvenida)/.test(path ?? "");
  useEffect(() => {
    if (hidden) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!localStorage.getItem(KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShow(true);
        t = setTimeout(() => dismiss(), 10_000);
      }
    } catch {}
    return () => clearTimeout(t);
  }, [hidden]);
  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setShow(false);
  }
  if (!show || hidden) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-[70] lg:bottom-4 flex justify-center px-3">
      <div role="region" aria-label="Aviso de cookies" className="pointer-events-auto flex max-w-md animate-fade-up items-center gap-2 rounded-full border border-line-strong bg-surface-2/95 py-1.5 pl-3 pr-1.5 text-xs text-ink-2 shadow-xl backdrop-blur-xl">
        <Cookie className="size-4 shrink-0 text-accent" />
        <span>
          Solo cookies técnicas, sin publicidad ni rastreo. <Link href="/cookies" className="text-accent underline">Info</Link>
        </span>
        <button onClick={dismiss} className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-ink" aria-label="Cerrar aviso de cookies">
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
