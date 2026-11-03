# DNI GYM — Tu entrenador personal gratis (gym y casa)

Aplicación web profesional de entrenamiento: acceso con Google, registro de entrenamientos, progreso, peso y medidas, nutrición con macros, biblioteca de 84 ejercicios con demostración visual, rutinas, calculadoras y **panel de administración**. Optimizada para SEO y para recomendaciones de asistentes de IA (ChatGPT, Gemini, Perplexity, Claude…).

**Stack:** Next.js 16 (App Router, exportación estática) · Cloudflare Workers (recursos estáticos + API) · **Cloudflare D1** (base de datos) · Google Gemini (`@google/genai`) · React 19 · Tailwind CSS 4 · Recharts. Firebase se usa **solo** para mostrar la ventana de «Continuar con Google»; los datos, las sesiones y los permisos viven en Cloudflare.

Documentación de producto: [`docs/PROJECT_AUDIT.md`](docs/PROJECT_AUDIT.md), [`docs/PRODUCT_ARCHITECTURE.md`](docs/PRODUCT_ARCHITECTURE.md), [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md), [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md).

---

## 1. Arquitectura en una línea

Navegador → Worker `dni-gym` (`worker/index.ts`) → `/api/*` (sesión propia en cookie HttpOnly, validación, límites de uso, auditoría) → D1 `dni-gym-db`. Todo lo demás se sirve desde `out/` (estático).

Acceso con Google: el navegador obtiene un ID token de Google (Firebase Auth) → `POST /api/auth/session` → el Worker verifica la firma RS256, emisor, audiencia y caducidad del token → crea una sesión aleatoria (solo se guarda su hash SHA-256 en D1) → cookie `dni_session` (HttpOnly, Secure, SameSite=Lax, 180 días). El rol de administrador lo decide el servidor (`ADMIN_EMAILS` y la columna `role`), nunca el navegador.

## 2. Publicar en Cloudflare

Ya está conectado: cada push a `main` se construye y publica solo (Workers Builds).

- **Build command:** `npm run build` · **Deploy command:** `npx wrangler deploy`.
- **D1:** `wrangler.toml` declara el binding `DB` sin `database_id`; en el primer despliegue Wrangler crea la base `dni-gym-db` automáticamente. Las tablas se crean/migran solas (`worker/db.ts`).
- **IA (Gemini):** Worker `dni-gym` → **Settings → Variables and Secrets → Add → Type: Secret** → nombre `GEMINI_API_KEY`. Sin esta clave la app funciona igual y el Coach muestra un aviso. La clave nunca va en el código ni en el navegador.
- **Variables** (en `wrangler.toml`): `FIREBASE_PROJECT_ID`, `ADMIN_EMAILS`, `GEMINI_MODEL` (por defecto `gemini-2.5-pro`), `AI_DAILY_LIMIT` (consultas de IA por usuario y día; admins ×4).
- **Firebase** (solo identidad): Authentication → Google habilitado y, en **Authorized domains**, el dominio `*.workers.dev` del Worker y tu dominio propio.
- Los usuarios que ya tenían datos en Firestore se migran a D1 automáticamente la primera vez que entran (sin borrar nada).

## 3. Desarrollo local

```bash
npm install
cp .dev.vars.example .dev.vars   # DEV_AUTH=1 habilita «Entrar sin Google» SOLO en local
npm run build                    # genera out/
npm run dev:worker               # Worker + D1 local en http://127.0.0.1:8787
npm run test:api                 # 49 pruebas de la API (con el Worker arrancado)
npm run test:gemini              # comprueba la clave de Gemini sin coste (lista modelos)
```

`npm run dev` (Next en :3000) sirve para trabajar el diseño; con `NEXT_PUBLIC_DEMO_MODE=1` usa datos de ejemplo guardados solo en el navegador (nunca en producción).

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
