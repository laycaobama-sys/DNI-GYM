"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, Info } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { Spinner } from "@/components/ui";

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

export function LoginCard() {
  const { user, profile, loading, error, signInWithGoogle, mode } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && profile && !profile.blocked) router.replace(profile.onboarded ? "/panel" : "/bienvenida");
  }, [user, profile, router]);

  const onClick = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-2">
      <div className="relative flex flex-col px-6 py-8 sm:px-12">
        <div className="absolute inset-x-0 top-0 h-72 overflow-hidden lg:hidden">
          <Image src="/brand/athlete-woman.webp" alt="" fill priority sizes="100vw" className="object-cover object-[50%_20%]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-bg" />
        </div>
        <div className="relative">
          <Logo />
        </div>
        <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center pb-12 pt-40 lg:py-12">
          <h1 className="font-athletic text-5xl font-extrabold uppercase italic leading-[0.92]">Entra en<br /><span className="text-accent">DNI GYM</span></h1>
          <p className="mt-2 text-ink-2">Entra con tu cuenta de Google. Si es tu primera vez, tu cuenta gratuita se crea al instante.</p>

          {profile?.blocked && (
            <div className="mt-6 flex gap-3 rounded-xl border border-critical/30 bg-critical/10 p-4 text-sm text-critical">
              <AlertTriangle className="size-5 shrink-0" />
              Tu cuenta está suspendida temporalmente. Escríbenos para revisarlo.
            </div>
          )}

          {error && (
            <div role="alert" className="mt-6 flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
              <AlertTriangle className="size-5 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={onClick}
            disabled={busy || loading || Boolean(user && profile)}
            className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-white font-semibold text-[#1f1f1f] shadow-lg transition hover:bg-white/90 active:scale-[0.99] disabled:opacity-60"
          >
            {busy || (user && !profile) ? <Spinner className="border-black/20 border-t-black" /> : <GoogleIcon />}
            Continuar con Google
          </button>

          {mode === "demo" && (
            <div className="mt-4 flex gap-3 rounded-xl border border-sky/30 bg-sky/10 p-4 text-xs leading-relaxed text-sky">
              <Info className="size-4 shrink-0" />
              <span>
                <strong>Modo demostración:</strong> Firebase aún no está configurado, así que entrarás con un usuario de prueba y los
                datos se guardan solo en este navegador. Configura las variables <code>NEXT_PUBLIC_FIREBASE_*</code> para activar el
                acceso real con Google.
              </span>
            </div>
          )}

          <ul className="mt-8 space-y-2.5 text-sm text-ink-2">
            {["Gratis, sin tarjeta", "Tus datos sincronizados en la nube", "Exporta o borra tus datos cuando quieras"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <Check className="size-4 text-accent" /> {t}
              </li>
            ))}
          </ul>

          <p className="mt-10 text-xs leading-relaxed text-muted">
            Al continuar aceptas los{" "}
            <Link href="/terminos" className="underline hover:text-ink">
              Términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" className="underline hover:text-ink">
              Política de privacidad
            </Link>
            .
          </p>
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
