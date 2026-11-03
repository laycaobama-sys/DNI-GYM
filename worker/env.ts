export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** proyecto de Firebase usado como proveedor de identidad de Google */
  FIREBASE_PROJECT_ID: string;
  /** emails con rol admin al iniciar sesión (separados por comas) */
  ADMIN_EMAILS: string;
  /** secreto: clave de la API de Gemini */
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  /** mensajes de IA por usuario y día */
  AI_DAILY_LIMIT?: string;
  /** SOLO desarrollo local (.dev.vars): permite /api/auth/dev */
  DEV_AUTH?: string;
}
