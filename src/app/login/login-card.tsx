"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, Info } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { ExerciseDemo } from "@/components/exercise-demo";
import { Spinner } from "@/components/ui";
import { getExercise } from "@/data/exercises";

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
    if (user && profile && !profile.blocked) router.replace("/panel");
  }, [user, profile, router]);

  const onClick = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } finally {
      setBusy(false);
    }
  };

  const ex = getExercise("hip-thrust")!;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-3xl font-bold tracking-tight">Bienvenido a DNI GYM</h1>
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
      <div className="relative hidden overflow-hidden border-l border-line bg-surface lg:block">
        <div className="grid-bg absolute inset-0" />
        <div className="glow absolute inset-0" />
        <div className="relative flex h-full flex-col justify-center p-16">
          <div className="card overflow-hidden rounded-3xl shadow-2xl shadow-black/60">
            <ExerciseDemo exercise={ex} priority sizes="50vw" showLabels />
            <div className="p-6">
              <p className="text-sm text-accent">Técnica · Glúteos</p>
              <p className="mt-1 font-display text-2xl font-semibold">{ex.name}</p>
              <p className="mt-2 text-sm text-muted">{ex.steps[0]}</p>
            </div>
          </div>
          <blockquote className="mt-10 max-w-md font-display text-2xl font-semibold leading-snug">
            “Lo que no se mide, no se puede mejorar.”
            <span className="mt-2 block text-sm font-normal text-muted">Registra cada entreno y deja que los datos te guíen.</span>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
