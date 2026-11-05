import type { Metadata } from "next";
import { Legal } from "@/components/legal";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos trata DNI GYM, para qué, dónde se guardan (Cloudflare), con quién se comparten y cómo ejercer tus derechos RGPD.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return (
    <Legal title="Política de privacidad" updated="noviembre de 2026">
      <p>En DNI GYM nos tomamos en serio tu privacidad. Esta política explica qué datos tratamos, para qué, durante cuánto tiempo y cuáles son tus derechos según el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).</p>
      <h2>1. Responsable del tratamiento</h2>
      <p>El titular de DNI GYM (dnigym.com). Contacto para privacidad: <a href="mailto:privacidad@dnigym.com">privacidad@dnigym.com</a>.</p>
      <h2>2. Datos que tratamos</h2>
      <ul>
        <li><strong>Cuenta:</strong> nombre y correo. Si entras con Google, también tu foto de perfil y un identificador de Google. Tu contraseña nunca se guarda: solo un resumen cifrado (PBKDF2) que no permite recuperarla.</li>
        <li><strong>Datos que introduces:</strong> entrenamientos, peso, medidas, alimentos, objetivos y datos del perfil (sexo, año de nacimiento, altura, nivel de actividad).</li>
        <li><strong>Datos de salud:</strong> peso, medidas y alimentación son datos de categoría especial. Los tratamos solo porque los introduces voluntariamente para ver tu evolución (consentimiento explícito, art. 9.2.a RGPD) y puedes borrarlos cuando quieras.</li>
        <li><strong>Mensajes:</strong> lo que nos escribas por el formulario de contacto o por correo.</li>
        <li><strong>Datos técnicos:</strong> fecha de registro y último acceso, página de entrada, procedencia, navegador y errores, para mantener el servicio seguro y resolver incidencias.</li>
      </ul>
      <h2>3. Para qué los usamos y base legal</h2>
      <ul>
        <li>Prestarte el servicio (tu plan, progreso y nutrición) — ejecución del contrato (art. 6.1.b).</li>
        <li>Enviarte correos de bienvenida, de contraseña y recordatorios de entreno — ejecución del contrato e interés legítimo; puedes darte de baja de los recordatorios con un clic o desde tu Perfil.</li>
        <li>Seguridad, prevención de abuso y estadísticas agregadas — interés legítimo (art. 6.1.f).</li>
        <li>Responder tus mensajes — tu consentimiento al escribirnos.</li>
      </ul>
      <p>No vendemos tus datos ni los usamos para publicidad.</p>
      <h2>4. DNI AI Coach</h2>
      <p>Si usas el coach con IA, tu pregunta y un resumen de tus datos de entreno (sin tu correo ni datos de contacto) se envían a Google Gemini solo para generar la respuesta. La IA nunca cambia tus datos por su cuenta.</p>
      <h2>5. Dónde se guardan y encargados del tratamiento</h2>
      <ul>
        <li><strong>Cloudflare</strong> (alojamiento, base de datos D1 en Europa occidental, correo y protección anti-bots Turnstile).</li>
        <li><strong>Google</strong> (inicio de sesión con Google y Gemini para el coach con IA).</li>
      </ul>
      <p>Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo con garantías adecuadas (cláusulas contractuales tipo y el Marco de Privacidad de Datos UE-EE. UU.). Todo viaja cifrado (HTTPS) y se guarda cifrado en reposo.</p>
      <h2>6. Cuánto tiempo los conservamos</h2>
      <p>Mientras tengas cuenta. Al eliminarla, borramos de inmediato tu perfil, entrenamientos, registros, nutrición e historial del coach. Los registros técnicos se conservan como máximo 12 meses.</p>
      <h2>7. Tus derechos</h2>
      <p>Puedes acceder, rectificar, exportar (portabilidad), oponerte, limitar y suprimir tus datos. La mayoría lo puedes hacer tú mismo en <strong>Mi panel → Perfil</strong> (exportar o eliminar la cuenta). Para el resto, escribe a <a href="mailto:privacidad@dnigym.com">privacidad@dnigym.com</a>. Si no quedas satisfecho, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
      <h2>8. Menores</h2>
      <p>DNI GYM está dirigido a mayores de 14 años. Si eres menor de esa edad, necesitas el consentimiento de tus padres o tutores.</p>
      <h2>9. Cookies</h2>
      <p>Solo usamos cookies técnicas imprescindibles. Detalles en la <a href="/cookies/">política de cookies</a>.</p>
    </Legal>
  );
}
