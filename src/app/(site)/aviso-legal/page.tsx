import type { Metadata } from "next";
import { Legal } from "@/components/legal";

export const metadata: Metadata = {
  title: "Aviso legal",
  description: "Aviso legal de DNI GYM: titular del sitio web dnigym.com, condiciones de uso, propiedad intelectual y responsabilidad.",
  alternates: { canonical: "/aviso-legal" },
};

export default function LegalNoticePage() {
  return (
    <Legal title="Aviso legal" updated="noviembre de 2026">
      <h2>1. Titular del sitio web</h2>
      <p>
        En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de que el sitio web <strong>dnigym.com</strong> y la aplicación DNI GYM pertenecen a su titular, con quien puedes contactar en{" "}
        <a href="mailto:contacto@dnigym.com">contacto@dnigym.com</a>. Para cualquier solicitud formal (datos identificativos completos del titular, reclamaciones o requerimientos), escribe a esa dirección y te responderemos en un plazo máximo de 30 días.
      </p>
      <h2>2. Objeto</h2>
      <p>DNI GYM es un servicio gratuito de entrenamiento y nutrición: planes de entreno, biblioteca de ejercicios, seguimiento del progreso, nutrición y un entrenador con inteligencia artificial.</p>
      <h2>3. Condiciones de uso</h2>
      <p>El uso del servicio implica la aceptación de los <a href="/terminos/">términos y condiciones</a> y de la <a href="/privacidad/">política de privacidad</a>. El usuario se compromete a hacer un uso lícito y a no realizar acciones que dañen el servicio o a terceros.</p>
      <h2>4. Salud</h2>
      <p>La información de DNI GYM es orientativa y no sustituye el consejo de un médico, fisioterapeuta o dietista-nutricionista. Consulta con un profesional antes de empezar un programa de ejercicio si tienes alguna patología, lesión o estás embarazada.</p>
      <h2>5. Propiedad intelectual</h2>
      <p>La marca, el logotipo, el diseño, los textos y el software de DNI GYM pertenecen a su titular. Las imágenes de demostración de los ejercicios proceden de free-exercise-db (dominio público). Queda prohibida la reproducción del contenido con fines comerciales sin autorización.</p>
      <h2>6. Responsabilidad</h2>
      <p>DNI GYM trabaja para que el servicio esté disponible y sin errores, pero no garantiza la ausencia de interrupciones. No se responsabiliza del mal uso de la información ni de los daños derivados de no seguir las recomendaciones de seguridad.</p>
      <h2>7. Legislación aplicable</h2>
      <p>Este aviso se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a la normativa de consumidores.</p>
    </Legal>
  );
}
