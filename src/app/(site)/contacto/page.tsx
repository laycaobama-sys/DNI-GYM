import type { Metadata } from "next";
import { Mail, ShieldCheck, Clock } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos para dudas, sugerencias, prensa o privacidad. Respondemos en 24–48 horas laborables en contacto@dnigym.com.",
  alternates: { canonical: "/contacto" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ContactPage", name: "Contacto DNI GYM", url: absoluteUrl("/contacto"), mainEntity: { "@type": "Organization", name: "DNI GYM", email: "contacto@dnigym.com", url: absoluteUrl("/"), contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email: "contacto@dnigym.com", availableLanguage: ["es"] }, { "@type": "ContactPoint", contactType: "privacy", email: "privacidad@dnigym.com" }] } }} />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Contacto</p>
      <h1 className="mt-2 font-athletic text-5xl font-extrabold uppercase italic leading-[0.95] sm:text-6xl">Hablemos</h1>
      <p className="mt-3 max-w-2xl text-ink-2">¿Dudas con tu plan, una sugerencia, un error o una propuesta? Escríbenos y te respondemos lo antes posible.</p>
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <ContactForm />
        <aside className="space-y-4">
          {[
            { icon: Mail, t: "Soporte y dudas", d: "contacto@dnigym.com", href: "mailto:contacto@dnigym.com" },
            { icon: ShieldCheck, t: "Privacidad y datos", d: "privacidad@dnigym.com", href: "mailto:privacidad@dnigym.com" },
            { icon: Clock, t: "Tiempo de respuesta", d: "24–48 horas laborables" },
          ].map((x) => (
            <div key={x.t} className="card flex gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent"><x.icon className="size-5" /></span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{x.t}</p>
                {x.href ? <a href={x.href} className="break-all text-sm text-accent hover:underline">{x.d}</a> : <p className="text-sm text-ink-2">{x.d}</p>}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
