import type { Metadata } from "next";
import { LoginCard } from "./login-card";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede gratis a DNI GYM con tu cuenta de Google y guarda tus entrenamientos, progreso y nutrición en la nube.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return <LoginCard />;
}
