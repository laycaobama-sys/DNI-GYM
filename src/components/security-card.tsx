"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Badge, Button, Card, CardHeader, Field } from "@/components/ui";

/** Seguridad de la cuenta: método de acceso y cambio (o creación) de contraseña. */
export function SecurityCard() {
  const { profile, changePassword, mode, updateProfile } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!profile || mode === "demo") return null;
  const hasPassword = Boolean(profile.hasPassword);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await changePassword({ current: hasPassword ? current : undefined, password: next });
      setCurrent("");
      setNext("");
      setMsg({ ok: true, text: "Contraseña guardada. Hemos cerrado tus sesiones en otros dispositivos." });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "No se pudo guardar." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Seguridad"
        subtitle="Tu sesión está protegida en Cloudflare con cookies seguras y contraseñas cifradas (PBKDF2)."
        action={profile.emailVerified ? <Badge tone="good">Email verificado</Badge> : <Badge tone="neutral">Email sin verificar</Badge>}
      />
      <div className="grid gap-5 p-5 md:grid-cols-2">
        <div className="space-y-2 text-sm text-ink-2">
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent" /> Acceso con correo y contraseña: <strong className="text-ink">{hasPassword ? "activado" : "sin contraseña"}</strong>
          </p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent" /> Acceso con Google: <strong className="text-ink">{profile.googleLinked ? "vinculado" : "no vinculado"}</strong>
          </p>
          <p className="text-xs text-muted">Usa una contraseña única de al menos 10 caracteres con letras y números.</p>
          <label className="mt-4 flex items-start gap-3 rounded-xl bg-white/[0.03] p-3">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-[#ff6b1a]"
              checked={profile.emailOptIn !== false}
              onChange={(e) => updateProfile({ emailOptIn: e.target.checked })}
            />
            <span>
              <span className="block font-medium text-ink">Recordatorios por correo</span>
              <span className="text-xs text-muted">Un aviso si llevas varios días sin entrenar (máx. 1 por semana). Puedes desactivarlo cuando quieras.</span>
            </span>
          </label>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {hasPassword && (
            <Field label="Contraseña actual">
              <input className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </Field>
          )}
          <Field label={hasPassword ? "Contraseña nueva" : "Crea una contraseña"}>
            <input className="input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} minLength={10} required />
          </Field>
          {msg && <p className={msg.ok ? "text-sm text-good" : "text-sm text-critical"}>{msg.text}</p>}
          <Button type="submit" variant="secondary" disabled={busy || next.length < 10}>
            <KeyRound className="size-4" /> {busy ? "Guardando…" : hasPassword ? "Cambiar contraseña" : "Crear contraseña"}
          </Button>
        </form>
      </div>
    </Card>
  );
}
