import type { Metadata } from "next";
import { Legal } from "@/components/legal";

export const metadata: Metadata = { title: "Términos y condiciones", alternates: { canonical: "/terminos" } };

export default function TermsPage() {
  return (
    <Legal title="Términos y condiciones" updated="noviembre de 2026">
      <p>Al usar DNI GYM aceptas estos términos. Léelos con atención.</p>
      <h2>1. El servicio</h2>
      <p>DNI GYM es una aplicación web para registrar entrenamientos, consultar ejercicios y rutinas, y llevar un seguimiento del peso y la nutrición. Actualmente todas las funciones son gratuitas. En el futuro podrán ofrecerse funciones adicionales de pago, que se anunciarán con antelación; las funciones gratuitas existentes no se cobrarán sin tu consentimiento expreso.</p>
      <h2>2. Tu cuenta</h2>
      <p>Accedes con tu correo y contraseña o con tu cuenta de Google. Eres responsable de mantener tu contraseña en secreto y de la actividad realizada con tu cuenta. Podemos suspender cuentas que hagan un uso abusivo o fraudulento del servicio.</p>
      <h2>3. Salud y seguridad</h2>
      <p>El contenido de DNI GYM es informativo y no constituye asesoramiento médico. Consulta con un profesional sanitario antes de empezar un programa de ejercicio o de alimentación, especialmente si tienes lesiones o patologías. Entrena siempre con una técnica correcta y cargas adecuadas a tu nivel.</p>
      <h2>4. Contenido</h2>
      <p>Las imágenes de los ejercicios proceden del proyecto de dominio público free-exercise-db. Los textos, el diseño y el software de DNI GYM son propiedad de sus titulares.</p>
      <h2>5. Disponibilidad</h2>
      <p>Trabajamos para que el servicio esté siempre disponible, pero no podemos garantizar que funcione sin interrupciones. Te recomendamos exportar tus datos periódicamente.</p>
      <h2>6. Cambios</h2>
      <p>Podemos actualizar estos términos. Si los cambios son relevantes, te lo comunicaremos en la propia aplicación.</p>
    </Legal>
  );
}
