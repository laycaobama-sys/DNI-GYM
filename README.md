# DNI GYM — Tu entrenador personal gratis (gym y casa)

Aplicación web profesional de entrenamiento: acceso con Google, registro de entrenamientos, progreso, peso y medidas, nutrición con macros, biblioteca de 148 ejercicios con demostración visual, rutinas, calculadoras y **panel de administración**. Optimizada para SEO y para recomendaciones de asistentes de IA (ChatGPT, Gemini, Perplexity, Claude…).

**Stack:** Next.js 16 (App Router, exportación estática) · Cloudflare Workers (recursos estáticos + API) · **Cloudflare D1** (base de datos) · Google Gemini (`@google/genai`) · React 19 · Tailwind CSS 4 · Recharts. Todo vive en Cloudflare: cuentas, contraseñas, sesiones, datos y permisos. No hay Firebase.

Documentación de producto: [`docs/PROJECT_AUDIT.md`](docs/PROJECT_AUDIT.md), [`docs/PRODUCT_ARCHITECTURE.md`](docs/PRODUCT_ARCHITECTURE.md), [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md), [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md).

---

## 1. Arquitectura en una línea

Navegador → Worker `dni-gym` (`worker/index.ts`) → `/api/*` (sesión propia en cookie HttpOnly, validación, límites de uso, auditoría) → D1 `dni-gym-db`. Todo lo demás se sirve desde `out/` (estático).

**Cuentas:**
- **Correo + contraseña:** `POST /api/auth/signup` y `/api/auth/login`. Contraseñas con PBKDF2-SHA256 (100 000 iteraciones, sal aleatoria), reglas de contraseña segura, límite de intentos por IP y por cuenta (bloqueo de 15 min) y Cloudflare Turnstile contra bots.
- **Google:** OAuth 2.0 + OpenID Connect directo desde el Worker (código + PKCE + `state` + `nonce`, firma RS256 verificada). Se activa al configurar `GOOGLE_CLIENT_ID` y el secreto `GOOGLE_CLIENT_SECRET`. Si el correo ya existía, se vincula; si esa cuenta tenía una contraseña sin verificar, se anula (evita el secuestro de cuentas pre-registradas).
- **Recuperar contraseña:** enlaces de un solo uso (hash SHA-256 en D1, 72 h). Mientras no haya un dominio con correo propio, el usuario lo pide en `/login` y el administrador genera el enlace desde **Admin → Usuarios → Enlace de contraseña**.
- **Sesión:** token aleatorio de 256 bits (solo su hash en D1) en cookie `dni_session` HttpOnly, Secure, SameSite=Lax. Cambiar o restablecer la contraseña cierra las demás sesiones.
- **Admin:** solo si el correo está en `ADMIN_EMAILS` **y** está verificado (Google o enlace), o si otro admin lo asigna.

## 2. Publicar en Cloudflare

Ya está conectado: cada push a `main` se construye y publica solo (Workers Builds).

- **Build command:** `npm run build` · **Deploy command:** `npx wrangler deploy`.
- **D1:** `wrangler.toml` declara el binding `DB` sin `database_id`; en el primer despliegue Wrangler crea la base `dni-gym-db` automáticamente. Las tablas se crean/migran solas (`worker/db.ts`).
- **IA (Gemini):** Worker `dni-gym` → **Settings → Variables and Secrets → Add → Type: Secret** → nombre `GEMINI_API_KEY`. Sin esta clave la app funciona igual y el Coach muestra un aviso. La clave nunca va en el código ni en el navegador.
- **Variables** (en `wrangler.toml`): `ADMIN_EMAILS`, `TURNSTILE_SITE_KEY`, `GEMINI_MODEL` (por defecto `gemini-2.5-flash`, nivel gratuito), `AI_DAILY_LIMIT` (consultas de IA por usuario y día; admins ×4).
- **Secretos** (`npx wrangler secret put NOMBRE`): `GEMINI_API_KEY`, `TURNSTILE_SECRET`, `GOOGLE_CLIENT_SECRET`.
- **Google (opcional):** en Google Cloud Console → APIs y servicios → Credenciales → *ID de cliente de OAuth* (aplicación web) con la URI de redirección `https://dni-gym.ibraguimova19.workers.dev/api/auth/google/callback`. Pon el ID como variable `GOOGLE_CLIENT_ID` y el secreto como `GOOGLE_CLIENT_SECRET`.

## 3. Desarrollo local

```bash
npm install
cp .dev.vars.example .dev.vars   # DEV_AUTH=1 habilita «Entrar sin Google» SOLO en local
npm run build                    # genera out/
npm run dev:worker               # Worker + D1 local en http://127.0.0.1:8787
npm run test:api                 # 77 pruebas de la API (con el Worker arrancado)
npm run test:gemini              # comprueba la clave de Gemini sin coste (lista modelos)
```

`npm run dev` (Next en :3000) sirve para trabajar el diseño; con `NEXT_PUBLIC_DEMO_MODE=1` usa datos de ejemplo guardados solo en el navegador (nunca en producción).

## Centro de control del dueño (`/admin`)

Solo para administradores (el servidor lo comprueba en cada petición):

- **Resumen:** KPI en vivo (usuarios, activos, retención D7/D30, activación, entrenos, visitas, IA, errores), registros y activos por día, embudo de conversión, dispositivos, método de acceso, objetivos, orígenes, páginas de entrada, ejercicios más entrenados, horas de actividad y últimos registros. Periodo 7/30/90 días.
- **CRM:** etapas automáticas (nuevo, activo, en riesgo, inactivo, bloqueado), salud 0–100, etiquetas, notas internas, exportar CSV y análisis de cada cliente con IA.
- **Agentes IA** (Gemini 2.5 Flash): retención, crecimiento, soporte técnico, contenido SEO/AEO e inventario. Solo aconsejan y redactan; no cambian datos.
- **Stock:** productos, entradas/salidas con motivo, mínimos con aviso, valor de coste y de venta, historial.
- **Usuarios, Actividad, Errores y Sistema:** bloqueo, roles, enlaces de contraseña de un solo uso, auditoría y estado de la configuración.

## Cuando compres el dominio propio

1. Cloudflare → Domain Registration → compra el dominio (queda en tu cuenta).
2. Worker `dni-gym` → Settings → Domains & Routes → Add → Custom domain → tu dominio.
3. En `src/lib/site.ts` cambia la URL por defecto (o define `NEXT_PUBLIC_SITE_URL` en las variables de build) para que el sitemap, las URL canónicas y `llms.txt` usen el dominio nuevo.
4. Google Cloud → Credenciales → tu cliente OAuth → añade `https://TU-DOMINIO/api/auth/google/callback`.
5. Cloudflare → Turnstile → «DNI GYM» → añade el dominio.
6. Opcional: activa Email Service con el dominio para enviar automáticamente los correos de recuperación de contraseña.

## 4. Qué incluye

| Área | Rutas | Detalle |
|---|---|---|
| Web pública (SEO) | `/`, `/ejercicios`, `/ejercicios/[slug]`, `/rutinas`, `/rutinas/[slug]`, `/calculadoras/[slug]` | Páginas estáticas, datos estructurados (WebApplication, HowTo, ExercisePlan, FAQPage, Breadcrumb), Open Graph, sitemap con imágenes |
| Panel del usuario | `/panel`, `/panel/entrenar`, `/historial`, `/progreso`, `/cuerpo`, `/nutricion`, `/ejercicios`, `/perfil` | Registro de series con temporizador de descanso, récords (1RM Epley), volumen, peso y medidas, calorías/macros/agua, exportar y borrar datos |
| DNI AI Coach | `/panel/coach` | Chat con Gemini que usa tus datos reales (entrenos, récords, peso, comidas) y crea el entreno de hoy con ejercicios del catálogo; tú decides si empezarlo |
| Administración | `/admin` | Analista IA de la plataforma, usuarios (bloquear, hacer admin), auditoría, estado del sistema, búsqueda y detalle de usuarios, métricas (registros, activos, visitas, origen del tráfico), actividad, errores de acceso con guía de solución |
| IA / buscadores | `/robots.txt`, `/llms.txt`, `/llms-full.txt` | Permite explícitamente a GPTBot, ClaudeBot, PerplexityBot, Google-Extended… y les da un resumen estructurado del sitio |

### Modelo de datos (Cloudflare D1)

```
users          perfil, rol, bloqueo, accesos, objetivos (JSON validado por lista blanca)
sessions       hash de la sesión, caducidad, IP/navegador
workouts       entrenamientos por usuario
body_logs      peso y medidas por día
nutrition_days comidas y agua por día
events         visitas, accesos, errores (panel admin)
ai_messages    historial del Coach · ai_usage  cuota diaria de IA
rate_limits    límites de uso · audit_log  acciones de administración
```

### Monetización futura

Todo es gratuito. Para añadir planes de pago más adelante: añadir una columna `plan` en `users` (solo modificable por el Worker), integrar Stripe Checkout con una ruta `/api/stripe/webhook` en el mismo Worker y condicionar las funciones premium a ese campo.

## 5. Funciones clave

- Cuestionario inicial → plan de entreno, calorías, macros y menú diario según objetivo, nivel, días, tiempo, lugar y dieta.
- Menú del día (`src/lib/meals.ts`): desayuno, comida, merienda y cena ajustados a las calorías del cliente; omnívora, vegetariana, vegana o sin lactosa; cambia cada día.
- Entreno guiado (`src/components/workout-player.tsx`): sesión adaptable por tiempo, lugar y molestias (`src/lib/adapt.ts`), sustitución de ejercicios, pesos sugeridos por 1RM, aviso de récord, comparación con la sesión anterior y diario de sensaciones.
- Entrenos de casa (sin material) y de gimnasio distintos y rotando cada día.
- Racha semanal con comodín, logros y niveles; recordatorios en el calendario (.ics).
- Mapa muscular por ejercicio (`src/components/muscle-map.tsx`).
- Modo sin conexión (`public/sw.js`) .
- SEO/AEO: guías con respuesta rápida (`/guias`), FAQ estructuradas en cada ejercicio, `llms.txt`, sitemap y datos estructurados.

## 6. Scripts

```bash
npm run dev     # desarrollo
npm run build   # build de producción (genera out/)
npm run preview # sirve out/ sin API
npm run dev:worker # Worker + API + D1 local sobre out/
npm run deploy  # build + wrangler deploy
npm run lint    # ESLint
node scripts/fetch-exercise-images.mjs   # descarga/convierte imágenes de nuevos ejercicios
node scripts/make-brand-images.mjs       # genera las fotos editoriales de /public/brand
```

Las imágenes de los ejercicios proceden de [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (dominio público, Unlicense).
