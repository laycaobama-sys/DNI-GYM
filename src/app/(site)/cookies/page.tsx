import type { Metadata } from "next";
import { Legal } from "@/components/legal";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "DNI GYM solo usa una cookie técnica de sesión y almacenamiento local imprescindible. Sin cookies publicitarias ni de seguimiento.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <Legal title="Política de cookies" updated="noviembre de 2026">
      <p>Esta política explica qué cookies y tecnologías similares usa DNI GYM. Resumen: <strong>solo usamos las imprescindibles para que la app funcione</strong>. No usamos cookies publicitarias, de analítica de terceros ni de seguimiento entre sitios.</p>
      <h2>1. Cookies técnicas (necesarias)</h2>
      <table>
        <thead><tr><th>Nombre</th><th>Finalidad</th><th>Duración</th></tr></thead>
        <tbody>
          <tr><td><code>dni_session</code></td><td>Mantener tu sesión iniciada de forma segura (HttpOnly, Secure, SameSite).</td><td>180 días o hasta que cierres sesión</td></tr>
          <tr><td><code>g_oauth</code></td><td>Proteger el inicio de sesión con Google (estado y verificación PKCE).</td><td>10 minutos</td></tr>
          <tr><td>Cloudflare Turnstile</td><td>Verificación anti-bots en los formularios de acceso y contacto.</td><td>Sesión</td></tr>
        </tbody>
      </table>
      <p>Al ser estrictamente necesarias para prestar el servicio que solicitas, estas cookies no requieren consentimiento (artículo 22.2 de la LSSI-CE).</p>
      <h2>2. Almacenamiento local</h2>
      <p>Guardamos en tu navegador el entrenamiento en curso, tus preferencias y una copia para que la app funcione sin conexión. Puedes borrarlo desde la configuración de tu navegador.</p>
      <h2>3. Medición propia y anónima</h2>
      <p>Contamos visitas de forma agregada en nuestros propios servidores (Cloudflare) para saber qué páginas se usan, sin cookies de terceros ni perfiles publicitarios.</p>
      <h2>4. Cambios</h2>
      <p>Si en el futuro añadimos cookies que requieran consentimiento, te lo pediremos antes de usarlas. Dudas: <a href="mailto:privacidad@dnigym.com">privacidad@dnigym.com</a>.</p>
    </Legal>
  );
}
