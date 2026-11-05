"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loader: Promise<void> | null = null;

function loadScript() {
  loader ??= new Promise<void>((resolve, reject) => {
    if (window.turnstile) return resolve();
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loader = null;
      reject(new Error("No se pudo cargar la verificación de seguridad"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

/**
 * Verificación anti-bots de Cloudflare Turnstile (sin puzzles para personas reales).
 * Cambia `resetKey` para pedir un token nuevo (los tokens son de un solo uso).
 */
export function Turnstile({ siteKey, onToken, resetKey = 0, action }: { siteKey: string; onToken: (t: string | null) => void; resetKey?: number; action?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  useEffect(() => {
    cb.current = onToken;
  });

  useEffect(() => {
    let id: string | null = null;
    let alive = true;
    cb.current(null);
    loadScript()
      .then(() => {
        if (!alive || !box.current || !window.turnstile) return;
        id = window.turnstile.render(box.current, {
          sitekey: siteKey,
          theme: "dark",
          size: "flexible",
          language: "es",
          action,
          callback: (t: string) => cb.current(t),
          "expired-callback": () => cb.current(null),
          "error-callback": () => cb.current(null),
        });
      })
      .catch(() => cb.current(null));
    return () => {
      alive = false;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [siteKey, resetKey, action]);

  return <div ref={box} className="min-h-[65px] w-full" />;
}
