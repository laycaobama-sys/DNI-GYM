import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Crear contraseña nueva",
  robots: { index: false, follow: false },
};

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <ResetForm />
    </Suspense>
  );
}
