"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Eye, EyeOff, Info, Lock, Mail, User } from "lucide-react";
import { AUTH_ERROR_MESSAGES, useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { Turnstile } from "@/components/turnstile";
import { Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

type Mode = "login" | "signup" | "forgot";

const TITLES: Record<Mode, { h: string; p: string; cta: string }> = {
  login: { h: "Entra en", p: "Accede a tu plan, tus entrenos y tu progreso.", cta: "Iniciar sesión" },
  signup: { h: "Crea tu cuenta", p: "Gratis, sin tarjeta. Tu plan personalizado en 2 minutos.", cta: "Crear cuenta gratis" },
  forgot: { h: "Recupera", p: "Escribe el correo de tu cuenta y te ayudamos a crear una contraseña nueva.", cta: "Enviar solicitud" },
};

function Field({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-2">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        {children}
      </span>
    </label>
  );
}

/** Indicador sencillo de fuerza de la contraseña (la validación real la hace el servidor). */
function strength(pw: string) {
  let s = 0;
  if (pw.length >= 10) s++;
  if (pw.length >= 14) s++;
  if (/[a-zñ]/.test(pw) && /[A-ZÑ]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^\w\sñÑ]/.test(pw)) s++;
  return Math.min(4, s);
}

export function LoginCard() {
  const { user, profile, loading, signUp, signIn, requestReset, signInWithGoogle, signInDev, config, mode: appMode } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get("modo") === "registro" ? "signup" : params.get("modo") === "recuperar" ? "forgot" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(() => {
    const code = params.get("error");
    return code ? (AUTH_ERROR_MESSAGES[code] ?? "No se pudo iniciar sesión. Inténtalo de nuevo.") : null;
  });
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tsKey, setTsKey] = useState(0);
  const siteKey = config.turnstileSiteKey;
  const t = TITLES[mode];
  const pwScore = strength(password);

  useEffect(() => {
    if (user && profile && !profile.blocked) router.replace(profile.onboarded ? "/panel" : "/bienvenida");
  }, [user, profile, router]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setErr(null);
    setSent(false);
    setTsKey((k) => k + 1);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (siteKey && !token) return setErr("Espera a que termine la verificación de seguridad.");
    if (mode === "signup" && !accept) return setErr("Acepta los términos y la política de privacidad para continuar.");
    setBusy(true);
    setErr(null);
    try {
      const turnstile = token ?? undefined;
      if (mode === "signup") await signUp({ name, email, password, turnstile, acceptTerms: accept });
      else if (mode === "login") await signIn({ email, password, turnstile });
      else {
        await requestReset({ email, turnstile });
        setSent(true);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Algo ha fallado. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
      setTsKey((k) => k + 1); // los tokens de Turnstile son de un solo uso
    }
  };

  const showGoogle = config.google || appMode === "demo";

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-2">
      <div className="relative flex flex-col px-5 py-8 sm:px-12">
        <div className="absolute inset-x-0 top-0 h-60 overflow-hidden lg:hidden">
          <Image src="/brand/athlete-woman.webp" alt="" fill priority sizes="100vw" className="object-cover object-[50%_20%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/50 to-bg" />
        </div>
        <div className="relative">
          <Logo />
        </div>
        <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center pb-10 pt-28 lg:py-12">
          <h2 className="font-athletic text-5xl font-extrabold uppercase italic leading-[0.92]">
            {t.h}
            {mode !== "signup" && (
              <>
                <br />
                <span className="text-accent">{mode === "forgot" ? "tu acceso" : "DNI GYM"}</span>
              </>
            )}
          </h2>
          <p className="mt-2 text-ink-2">{t.p}</p>

          {mode !== "forgot" && (
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1" role="tablist" aria-label="Acceso">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={cn("h-10 rounded-lg text-sm font-semibold transition-colors", mode === m ? "bg-accent text-accent-ink" : "text-ink-2 hover:text-ink")}
                >
                  {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </button>
              ))}
            </div>
          )}

          {profile?.blocked && (
            <div className="mt-5 flex gap-3 rounded-xl border border-critical/30 bg-critical/10 p-4 text-sm text-critical">
              <AlertTriangle className="size-5 shrink-0" />
              Tu cuenta está suspendida temporalmente. Escríbenos para revisarlo.
            </div>
          )}

          {err && (
            <div role="alert" className="mt-5 flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
              <AlertTriangle className="size-5 shrink-0" />
              {err}
            </div>
          )}

          {sent ? (
            <div className="mt-6 rounded-2xl border border-good/30 bg-good/10 p-5 text-sm leading-relaxed text-ink-2">
              <p className="flex items-center gap-2 font-semibold text-good">
                <CheckCircle2 className="size-5" /> Solicitud recibida
              </p>
              <p className="mt-2">
                Si existe una cuenta con <strong className="text-ink">{email}</strong>, el equipo de DNI GYM te enviará un enlace seguro (válido 72 horas) para crear tu contraseña nueva.
              </p>
              <button onClick={() => switchMode("login")} className="mt-4 font-semibold text-accent">
                Volver a iniciar sesión
              </button>
            </div>
          ) : (
            <>
              {showGoogle && mode !== "forgot" && (
                <>
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={loading || Boolean(user && profile)}
                    className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white font-semibold text-[#1f1f1f] shadow-lg transition hover:bg-white/90 active:scale-[0.99] disabled:opacity-60"
                  >
                    <GoogleIcon /> Continuar con Google
                  </button>
                  <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
                    <span className="h-px flex-1 bg-line" /> o con tu correo <span className="h-px flex-1 bg-line" />
                  </div>
                </>
              )}

              <form onSubmit={onSubmit} className={cn("space-y-4", !(showGoogle && mode !== "forgot") && "mt-6")} noValidate>
                {mode === "signup" && (
                  <Field icon={User} label="Nombre">
                    <input className="input !pl-9" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} required placeholder="Tu nombre" />
                  </Field>
                )}
                <Field icon={Mail} label="Correo electrónico">
                  <input
                    className="input !pl-9"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete={mode === "signup" ? "email" : "username"}
                    required
                    placeholder="tu@correo.com"
                  />
                </Field>
                {mode !== "forgot" && (
                  <div>
                    <Field icon={Lock} label="Contraseña">
                      <input
                        className="input !pl-9 !pr-11"
                        type={show ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        minLength={mode === "signup" ? 10 : undefined}
                        required
                        placeholder={mode === "signup" ? "Mínimo 10 caracteres con un número" : "Tu contraseña"}
                      />
                      <button
                        type="button"
                        onClick={() => setShow((v) => !v)}
                        className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-ink"
                        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </Field>
                    {mode === "signup" && password && (
                      <div className="mt-2 flex items-center gap-2" aria-live="polite">
                        <div className="flex flex-1 gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <span key={i} className={cn("h-1 flex-1 rounded-full", i < pwScore ? (pwScore >= 3 ? "bg-good" : "bg-warning") : "bg-white/10")} />
                          ))}
                        </div>
                        <span className="text-xs text-muted">{["Muy débil", "Débil", "Aceptable", "Buena", "Excelente"][pwScore]}</span>
                      </div>
                    )}
                    {mode === "login" && (
                      <button type="button" onClick={() => switchMode("forgot")} className="mt-2 text-sm font-medium text-accent">
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                )}

                {mode === "signup" && (
                  <label className="flex items-start gap-3 text-sm text-ink-2">
                    <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 size-4 accent-[#ff6b1a]" />
                    <span>
                      Acepto los{" "}
                      <Link href="/terminos" className="underline hover:text-ink">
                        Términos
                      </Link>{" "}
                      y la{" "}
                      <Link href="/privacidad" className="underline hover:text-ink">
                        Política de privacidad
                      </Link>
                      .
                    </span>
                  </label>
                )}

                {siteKey && <Turnstile siteKey={siteKey} onToken={setToken} resetKey={tsKey} action={mode} />}

                <button
                  type="submit"
                  disabled={busy || loading || Boolean(user && profile)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent font-athletic text-lg font-extrabold uppercase italic text-accent-ink shadow-[0_10px_30px_-10px_rgb(255_107_26/0.7)] transition active:scale-[0.99] disabled:opacity-60"
                >
                  {busy && <Spinner className="border-black/20 border-t-black" />}
                  {t.cta}
                </button>
              </form>

              {mode === "forgot" && (
                <button onClick={() => switchMode("login")} className="mt-4 text-sm font-medium text-accent">
                  ← Volver a iniciar sesión
                </button>
              )}
            </>
          )}

          {appMode === "demo" && (
            <div className="mt-4 flex gap-3 rounded-xl border border-sky/30 bg-sky/10 p-4 text-xs leading-relaxed text-sky">
              <Info className="size-4 shrink-0" />
              <span>
                <strong>Modo demostración:</strong> entrarás con un usuario de prueba y los datos se guardan solo en este navegador.
              </span>
            </div>
          )}

          {config.devAuth && (
            <button
              onClick={() => signInDev("ibraguimova19@gmail.com")}
              className="mt-3 h-11 w-full rounded-xl border border-dashed border-warning/50 text-sm font-semibold text-warning"
            >
              Entrar sin contraseña (solo desarrollo local)
            </button>
          )}

          <ul className="mt-8 space-y-2.5 text-sm text-ink-2">
            {["Gratis, sin tarjeta", "Datos cifrados y guardados en Cloudflare", "Exporta o borra tus datos cuando quieras"].map((x) => (
              <li key={x} className="flex items-center gap-2.5">
                <Check className="size-4 text-accent" /> {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <div className="grain absolute inset-0">
          <Image src="/brand/athlete-woman.webp" alt="Atleta entrenando con cadena en el gimnasio" fill priority sizes="50vw" className="animate-ken object-cover object-[50%_25%]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-14">
          <p className="font-athletic text-7xl font-extrabold uppercase italic leading-[0.88]">
            Hoy empieza
            <br />
            <span className="text-accent">tu cambio.</span>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["Plan personalizado", "Entreno guiado", "Retos 30 días", "Nutrición"].map((t) => (
              <span key={t} className="glass rounded-full px-4 py-2 text-sm text-white">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
