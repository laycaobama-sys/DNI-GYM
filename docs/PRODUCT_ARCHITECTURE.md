# DNI GYM — Arquitectura del producto

```
Navegador (Next.js estático)
   │  Cuentas propias: correo + contraseña (PBKDF2) y Google OAuth directo (sin Firebase)
   │  POST /api/auth/session { idToken }
   ▼
Cloudflare Worker  (worker/index.ts)
   ├─ Recursos estáticos (out/)            → web, panel, admin
   ├─ /api/auth/*   verifica el token de Google (JWKS + RS256), crea sesión
   │                cookie HttpOnly · Secure · SameSite=Lax (180 días)
   ├─ /api/me, /api/profile, /api/workouts, /api/body, /api/nutrition
   ├─ /api/events   analítica y errores (con límite de frecuencia)
   ├─ /api/ai/*     DNI AI Coach → Gemini (@google/genai), con contexto real del usuario
   └─ /api/admin/*  solo rol admin: usuarios, roles, bloqueo, eventos, auditoría, IA de negocio
   ▼
Cloudflare D1 (SQLite)  binding DB  — se crea solo en el primer despliegue
```

## Datos (D1)

| Tabla | Contenido |
|---|---|
| `users` | id (uid de Google), email, nombre, foto, rol, bloqueado, perfil JSON, fechas, contadores |
| `sessions` | hash SHA-256 del token, usuario, caducidad, user-agent |
| `workouts` | id, usuario, fecha, JSON del entreno |
| `body_logs` | usuario + fecha, JSON de peso y medidas |
| `nutrition_days` | usuario + fecha, JSON del diario |
| `events` | analítica, accesos y errores |
| `ai_messages` | historial del Coach por usuario |
| `ai_usage` | contador diario por usuario (control de costes) |
| `audit_log` | acciones de administración |

El esquema se crea y migra en el propio Worker (`CREATE TABLE IF NOT EXISTS` + versión en `meta`), así no hace falta ningún comando manual.

## Seguridad

- El token de sesión solo existe en una cookie HttpOnly; en D1 se guarda su hash.
- Todas las rutas `/api/*` validan entrada, propiedad de los datos y rol.
- Límites: eventos por IP, mensajes de IA por usuario y día (`AI_DAILY_LIMIT`).
- Secretos solo en Cloudflare: `GEMINI_API_KEY`. Nunca en el frontend ni en Git.
- Admin inicial por `ADMIN_EMAILS`; cada acción queda en `audit_log`.

## Modo demo

Sin backend (desarrollo local con `next dev`), la app usa `localStorage` y datos de ejemplo. En producción siempre usa la API.
