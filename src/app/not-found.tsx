import Link from "next/link";
import { buttonClass } from "@/lib/cn";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="font-display text-7xl font-bold text-accent">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">Esta página no existe</h1>
        <p className="mt-2 text-muted">Puede que el enlace esté roto o que la página se haya movido.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className={buttonClass("primary")}>Ir al inicio</Link>
          <Link href="/ejercicios" className={buttonClass("outline")}>Ver ejercicios</Link>
        </div>
      </div>
    </div>
  );
}
