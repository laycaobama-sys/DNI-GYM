export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** emails con rol admin al iniciar sesión (separados por comas) */
  ADMIN_EMAILS: string;
  /** secreto: clave de la API de Gemini */
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  /** mensajes de IA por usuario y día */
  AI_DAILY_LIMIT?: string;
  /** tope global de peticiones de IA al día (nivel gratuito de Gemini) */
  AI_GLOBAL_DAILY_LIMIT?: string;
  /** Google OAuth (opcional): ID de cliente (variable) y secreto (secret) */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Cloudflare Turnstile: clave pública (variable) y secreta (secret) */
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET?: string;
  /** Cloudflare Email Service */
  EMAIL?: SendEmail;
  /** remitente, p. ej. "DNI GYM <hola@dnigym.com>" */
  EMAIL_FROM?: string;
  /** "1" para enviar correos a usuarios (requiere Workers Paid); los avisos al dueño siempre funcionan */
  EMAIL_USERS?: string;
  /** correo del dueño para avisos (dirección verificada en Email Routing) */
  OWNER_EMAIL?: string;
  /** URL pública canónica (https://dnigym.com) */
  SITE_URL?: string;
  /** hosts con la URL de retorno de Google registrada (separados por comas) */
  GOOGLE_HOSTS?: string;
  /** SOLO desarrollo local (.dev.vars): permite /api/auth/dev */
  DEV_AUTH?: string;
}
