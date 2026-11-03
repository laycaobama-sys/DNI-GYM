"use client";

import { useEffect } from "react";
import { AuthProvider } from "./auth-provider";
import { logEvent } from "@/lib/db";

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
    let count = 0;
    const report = (message: string) => {
      if (count++ >= 5) return;
      logEvent({ type: "client_error", message });
    };
    const onError = (e: ErrorEvent) => report(`${e.message} @ ${e.filename?.split("/").pop() ?? ""}:${e.lineno ?? ""}`);
    const onRejection = (e: PromiseRejectionEvent) => report(String((e.reason as Error)?.message ?? e.reason));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Telemetry />
      {children}
    </AuthProvider>
  );
}
