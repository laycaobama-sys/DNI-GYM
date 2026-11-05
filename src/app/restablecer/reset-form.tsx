"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { Spinner } from "@/components/ui";

export function ResetForm() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(token ? null : "Este enlace no es válido. Pide uno nuevo desde «¿Olvidaste tu contraseña?».");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== repeat) return setErr("Las dos contraseñas no coinciden.");
    setBusy(true);
    setErr(null);
    try {
      const r = await resetPassword({ token, password });
      router.replace(r.profile.onboarded ? "/panel" : "/bienvenida");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo cambiar la contraseña.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg px-5 py-8 sm:px-12">
      <Logo />
      <div className="mx-auto mt-16 w-full max-w-sm">
        <span className="grid size-12 place-items-center rounded-2xl bg-accent/15 text-accent">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="mt-5 font-athletic text-5xl font-extrabold uppercase italic leading-[0.92]">
          Nueva <span className="text-accent">contraseña</span>
        </h1>
        <p className="mt-2 text-ink-2">Elige una contraseña de al menos 10 caracteres con letras y números. Al guardarla se cerrarán tus sesiones en otros dispositivos.</p>

        {err && (
          <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            <AlertTriangle className="size-5 shrink-0" />
            {err}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          {[
            { v: password, set: setPassword, label: "Contraseña nueva", ac: "new-password" },
            { v: repeat, set: setRepeat, label: "Repite la contraseña", ac: "new-password" },
          ].map((f, i) => (
            <label key={f.label} className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-2">{f.label}</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input className="input !pl-9 !pr-11" type={show ? "text" : "password"} value={f.v} onChange={(e) => f.set(e.target.value)} autoComplete={f.ac} required minLength={10} />
                {i === 0 && (
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-ink" aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}>
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                )}
              </span>
            </label>
          ))}
          <button type="submit" disabled={busy || !token} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent font-athletic text-lg font-extrabold uppercase italic text-accent-ink disabled:opacity-60">
            {busy && <Spinner className="border-black/20 border-t-black" />} Guardar y entrar
          </button>
        </form>
        <Link href="/login" className="mt-5 inline-block text-sm font-medium text-accent">
          ← Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
