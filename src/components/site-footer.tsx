import Link from "next/link";
import { Logo } from "./logo";
import { GROUPS } from "@/data/exercises";
import { ROUTINES } from "@/data/routines";
import { GUIDES } from "@/data/guides";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            La app de entrenamiento y nutrición gratuita para entrenar con método: ejercicios con técnica, rutinas, registro de
            entrenos, progreso y macros. Todo sincronizado en tu cuenta, en cualquier dispositivo.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Ejercicios</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {GROUPS.slice(0, 6).map((g) => (
              <li key={g.id}>
                <Link href={`/ejercicios?grupo=${g.id}`} className="hover:text-ink">
                  Ejercicios de {g.label.toLowerCase()}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Rutinas</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {ROUTINES.map((r) => (
              <li key={r.slug}>
                <Link href={`/rutinas/${r.slug}`} className="hover:text-ink">
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Herramientas</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/calculadoras/calorias" className="hover:text-ink">Calculadora de calorías</Link></li>
            <li><Link href="/calculadoras/macros" className="hover:text-ink">Calculadora de macros</Link></li>
            <li><Link href="/calculadoras/imc" className="hover:text-ink">Calculadora de IMC</Link></li>
            <li><Link href="/calculadoras/1rm" className="hover:text-ink">Calculadora de 1RM</Link></li>
            {GUIDES.slice(0, 3).map((g) => (
              <li key={g.slug}><Link href={`/guias/${g.slug}`} className="hover:text-ink">{g.title.split(":")[0]}</Link></li>
            ))}
            <li><Link href="/contacto" className="hover:text-ink">Contacto</Link></li>
            <li><Link href="/privacidad" className="hover:text-ink">Privacidad</Link></li>
            <li><Link href="/cookies" className="hover:text-ink">Cookies</Link></li>
            <li><Link href="/aviso-legal" className="hover:text-ink">Aviso legal</Link></li>
            <li><Link href="/terminos" className="hover:text-ink">Términos</Link></li>
            <li><a href="mailto:contacto@dnigym.com" className="hover:text-ink">contacto@dnigym.com</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
          <p>© DNI GYM. Todos los derechos reservados.</p>
          <p>La información de esta web es orientativa y no sustituye el consejo de un profesional sanitario.</p>
        </div>
      </div>
    </footer>
  );
}
