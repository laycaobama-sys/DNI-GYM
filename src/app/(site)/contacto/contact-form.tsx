"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Turnstile } from "@/components/turnstile";
import { Field } from "@/components/ui";
import { api, backendEnabled } from "@/lib/db";

const SUBJECTS = ["Duda sobre mi plan", "Problema con mi cuenta", "Sugerencia", "Error en la app", "Privacidad y datos", "Colaboraciones y prensa", "Otro"];

export function ContactForm() {
  const { profile, config } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // trampa anti-spam
  const [token, setToken] = useState<string | null>(null);
  const [tsKey, setTsKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (config.turnstileSiteKey && !token) return setErr("Espera a que termine la verificación de seguridad.");
    setBusy(true);
    setErr(null);
    try {
      if (backendEnabled) await api("/api/contact", { method: "POST", body: { name: name || profile?.name, email: email || profile?.email, subject, message, website, turnstile: token ?? undefined } });
      setSent(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo enviar. Escríbenos a contacto@dnigym.com.");
    } finally {
      setBusy(false);
      setTsKey((k) => k + 1);
    }
  };

  if (sent)
    return (
      <div className="card grid place-items-center gap-3 p-10 text-center">
        <CheckCircle2 className="size-12 text-good" />
        <p className="font-display text-xl font-semibold">¡Mensaje enviado!</p>
        <p className="max-w-sm text-sm text-ink-2">Gracias por escribirnos. Te responderemos a {email} en 24–48 horas laborables.</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nombre"><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={80} /></Field>
        <Field label="Correo electrónico"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
      </div>
      <Field label="Asunto">
        <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Mensaje"><textarea className="input min-h-40" value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} maxLength={4000} placeholder="Cuéntanos en qué podemos ayudarte" /></Field>
      <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {config.turnstileSiteKey && <Turnstile siteKey={config.turnstileSiteKey} onToken={setToken} resetKey={tsKey} action="contact" />}
      {err && <p role="alert" className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{err}</p>}
      <p className="text-xs text-muted">Usaremos tus datos solo para responderte. Más información en la <a href="/privacidad/" className="underline">política de privacidad</a>.</p>
      <button type="submit" disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent font-athletic text-lg font-extrabold uppercase italic text-accent-ink disabled:opacity-60 sm:w-auto sm:px-8">
        <Send className="size-4" /> {busy ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}
