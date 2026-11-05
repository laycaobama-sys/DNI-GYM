import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginCard } from "./login-card";

export const metadata: Metadata = {
  title: "Iniciar sesión o crear cuenta",
  description: "Crea gratis tu cuenta de DNI GYM con tu correo o con Google y guarda tus entrenamientos, progreso y nutrición en la nube.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <>
      <h1 className="sr-only">Iniciar sesión o crear cuenta gratis en DNI GYM</h1>
      <Suspense fallback={<div className="min-h-screen bg-bg" />}>
        <LoginCard />
      </Suspense>
    </>
  );
}
