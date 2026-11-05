"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { AuthProvider } from "./auth-provider";
import { flushOutbox, logEvent, pendingCount } from "@/lib/db";

function Telemetry() {
  useEffect(() => {
    // modo sin conexión (no en desarrollo)
    if ("serviceWorker" in navigator && location.hostname !== "localhost" && location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // 1 visita por sesión de navegador
    try {
      if (!sessionStorage.getItem("dnigym:visit")) {
        sessionStorage.setItem("dnigym:visit", "1");
        let ref = "";
        try {
          ref = document.referrer ? new URL(document.referrer).hostname : "";
          if (ref === location.hostname) ref = "";
        } catch {}
        logEvent({ type: "visit", ref });
      }
    } catch {}
    // errores de cliente (máx. 5 por sesión) para poder diagnosticarlos desde el panel de admin
    // Solo se registran errores de nuestro propio código: los de extensiones del navegador, scripts de terceros
    // o errores sin origen conocido se ignoran (no son fallos de DNI GYM). Sin duplicados y máx. 5 por sesión.
    let count = 0;
    const seen = new Set<string>();
    const ours = (src?: string) => Boolean(src && src.startsWith(location.origin) && src.includes("/_next/"));
    const report = (message: string) => {
      if (count >= 5 || seen.has(message)) return;
      seen.add(message);
      count++;
      logEvent({ type: "client_error", message: message.slice(0, 480) });
    };
    const onError = (e: ErrorEvent) => {
      if (!ours(e.filename)) return;
      report(`${e.message} @ ${e.filename?.split("/").pop() ?? ""}:${e.lineno ?? ""}`);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const err = e.reason as Error | undefined;
      const stack = String(err?.stack ?? "");
      // fallos de red (sin conexión) no son errores de la app
      if (!stack.includes(`${location.origin}/_next/`) || /Failed to fetch|NetworkError|Load failed/i.test(String(err?.message))) return;
      report(String(err?.message ?? e.reason));
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}

/** Aviso de modo sin conexión y sincronización automática de lo guardado sin red. */
function OfflineStatus() {
  const [online, setOnline] = useState(true);
  const [synced, setSynced] = useState(0);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    const onOnline = () => {
      update();
      flushOutbox();
    };
    const onSynced = (e: Event) => {
      setSynced((e as CustomEvent<number>).detail);
      setTimeout(() => setSynced(0), 4000);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", update);
    window.addEventListener("dnigym:synced", onSynced);
    if (pendingCount()) flushOutbox();
    const id = setInterval(() => pendingCount() && flushOutbox(), 30_000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", update);
      window.removeEventListener("dnigym:synced", onSynced);
      clearInterval(id);
    };
  }, []);
  if (online && !synced) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-[env(safe-area-inset-top)] z-[80] flex justify-center px-3 pt-2">
      <p className="flex items-center gap-2 rounded-full border border-line-strong bg-surface-2/95 px-4 py-1.5 text-xs font-medium shadow-xl backdrop-blur">
        {online ? <><RefreshCw className="size-3.5 text-good" /> {synced} {synced === 1 ? "cambio sincronizado" : "cambios sincronizados"}</> : <><CloudOff className="size-3.5 text-warning" /> Sin conexión · lo que guardes se sincronizará solo</>}
      </p>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Telemetry />
      <OfflineStatus />
      {children}
    </AuthProvider>
  );
}
