import type { Metadata } from "next";
import { Legal } from "@/components/legal";

export const metadata: Metadata = { title: "Política de privacidad", alternates: { canonical: "/privacidad" } };

export default function PrivacyPage() {
  return (
    <Legal title="Política de privacidad" updated="noviembre de 2026">
      <p>En DNI GYM nos tomamos en serio tu privacidad. Esta política explica qué datos recogemos, para qué los usamos y cuáles son tus derechos.</p>
      <h2>1. Datos que recogemos</h2>
      <ul>
        <li><strong>Datos de tu cuenta:</strong> nombre y email. Si entras con Google, también tu foto de perfil y un identificador de Google. Tu contraseña nunca se guarda: solo un resumen cifrado (PBKDF2) que no permite recuperarla.</li>
        <li><strong>Datos que introduces:</strong> entrenamientos, peso, medidas corporales, alimentos, objetivos y datos del perfil (sexo, año de nacimiento, altura, nivel de actividad).</li>
        <li><strong>Datos técnicos:</strong> fecha de registro y de último acceso, página de entrada, sitio de procedencia, tipo de navegador y errores técnicos, para mantener el servicio y resolver incidencias de acceso.</li>
      </ul>
      <h2>2. Para qué los usamos</h2>
      <ul>
        <li>Prestarte el servicio: guardar tu historial y mostrarte tu progreso.</li>
        <li>Calcular tus recomendaciones de calorías y macronutrientes.</li>
        <li>Medir el uso de la web de forma agregada y detectar errores.</li>
        <li>Si usas el DNI AI Coach, tus mensajes y un resumen de tus datos de entreno se envían a Google Gemini solo para generar la respuesta.</li>
      </ul>
      <p>No vendemos tus datos ni los usamos para publicidad.</p>
      <h2>3. Dónde se guardan</h2>
      <p>Los datos se almacenan en Cloudflare (Workers y base de datos D1, región Europa occidental), con cifrado en tránsito (HTTPS) y en reposo. Las sesiones usan cookies seguras (HttpOnly, Secure, SameSite) y el acceso está protegido contra bots con Cloudflare Turnstile. Solo tú y los administradores del servicio (para soporte técnico) podéis acceder a tus datos, y cada acción de administración queda registrada.</p>
      <h2>4. Tus derechos</h2>
      <p>Puedes acceder, rectificar, exportar y eliminar tus datos en cualquier momento desde <strong>Mi panel → Perfil</strong>. Al eliminar tu cuenta se borran tus entrenamientos, registros y perfil de forma permanente.</p>
      <h2>5. Datos de salud</h2>
      <p>La información sobre peso, medidas y alimentación la introduces voluntariamente y solo se usa para mostrarte tu evolución. La información de DNI GYM es orientativa y no sustituye el consejo médico o de un dietista-nutricionista.</p>
      <h2>6. Almacenamiento local</h2>
      <p>Usamos una cookie técnica imprescindible para mantener tu sesión iniciada y el almacenamiento local del navegador para guardar el entrenamiento en curso. No usamos cookies publicitarias ni de seguimiento.</p>
      <h2>7. Contacto</h2>
      <p>Para cualquier consulta sobre privacidad puedes escribirnos a través de los canales de contacto indicados en la web.</p>
    </Legal>
  );
}
