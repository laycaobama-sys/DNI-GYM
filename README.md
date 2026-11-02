# DNI GYM — App de gimnasio y fitness gratuita

Aplicación web profesional de entrenamiento: acceso con Google, registro de entrenamientos, progreso, peso y medidas, nutrición con macros, biblioteca de 84 ejercicios con demostración visual, rutinas, calculadoras y **panel de administración**. Optimizada para SEO y para recomendaciones de asistentes de IA (ChatGPT, Gemini, Perplexity, Claude…).

**Stack:** Next.js 16 (App Router, exportación estática) · Cloudflare Pages · React 19 · Tailwind CSS 4 · Firebase (Authentication + Firestore) · Recharts.

---

## 1. Probarla en local (2 minutos)

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin configurar nada, la app arranca en **modo demo**: el botón «Continuar con Google» entra con un usuario de prueba con 10 semanas de datos de ejemplo, y ese usuario es administrador para que puedas ver `/admin`. Los datos se guardan solo en tu navegador.

## 2. Conectar Firebase (acceso real con Google)

1. En https://console.firebase.google.com abre tu proyecto.
2. **Authentication → Comenzar → Sign-in method → Google → Habilitar** → Guardar.
3. **Firestore Database → Crear base de datos** → modo producción → región `eur3 (europe-west)`.
4. **Configuración del proyecto (⚙️) → General → Tus apps → icono Web `</>`** → registra la app (sin Hosting) y copia los 6 valores de `firebaseConfig`.
5. **Firestore → Reglas**: pega el contenido de `firestore.rules` y pulsa **Publicar**.
6. **Administrador:** `ibraguimova19@gmail.com` ya es administrador (en `firestore.rules` y `src/lib/site.ts`). Para añadir más, crea en Firestore la colección `admins` con un documento cuyo ID sea el email en minúsculas.
7. **Authentication → Settings → Authorized domains → Add domain**: añade `dni-gym.pages.dev` (o el nombre que te dé Cloudflare) y tu dominio propio si lo tienes.

## 3. Publicar en Cloudflare (Workers)

El repositorio ya incluye `wrangler.toml`, que publica la carpeta `out/` como recursos estáticos de un Worker.

1. https://dash.cloudflare.com → **Workers & Pages → Create → Import a repository** → `laycaobama-sys/DNI-GYM`.
2. **Project name:** `dni-gym` (debe coincidir con `name` en `wrangler.toml`).
3. **Build command:** `npm run build` · **Deploy command:** `npx wrangler deploy`.
4. La versión de Node se toma de `.nvmrc` (24). Las claves de Firebase ya van en el código.
5. Cada push a la rama de producción se publica solo en `https://dni-gym.<tu-subdominio>.workers.dev`.
6. Dominio propio: Worker → **Settings → Domains & Routes → Add → Custom domain**. Añádelo también en Firebase → Authentication → Authorized domains.

## 4. Qué incluye

| Área | Rutas | Detalle |
|---|---|---|
| Web pública (SEO) | `/`, `/ejercicios`, `/ejercicios/[slug]`, `/rutinas`, `/rutinas/[slug]`, `/calculadoras/[slug]` | Páginas estáticas, datos estructurados (WebApplication, HowTo, ExercisePlan, FAQPage, Breadcrumb), Open Graph, sitemap con imágenes |
| Panel del usuario | `/panel`, `/panel/entrenar`, `/historial`, `/progreso`, `/cuerpo`, `/nutricion`, `/ejercicios`, `/perfil` | Registro de series con temporizador de descanso, récords (1RM Epley), volumen, peso y medidas, calorías/macros/agua, exportar y borrar datos |
| Administración | `/admin` | Usuarios (buscar, ver detalle, bloquear/desbloquear), métricas (registros, activos, visitas, origen del tráfico), actividad, errores de acceso con guía de solución |
| IA / buscadores | `/robots.txt`, `/llms.txt`, `/llms-full.txt` | Permite explícitamente a GPTBot, ClaudeBot, PerplexityBot, Google-Extended… y les da un resumen estructurado del sitio |

### Modelo de datos (Firestore)

```
users/{uid}                     perfil, objetivos, lastLoginAt, loginCount, blocked
users/{uid}/workouts/{id}       entrenamientos
users/{uid}/body/{YYYY-MM-DD}   peso y medidas
users/{uid}/nutrition/{fecha}   comidas y agua del día
events/{id}                     visitas, accesos, errores (para el panel admin)
admins/{email}                  administradores
```

### Monetización futura

Todo es gratuito. Para añadir planes de pago más adelante: guardar `plan` en `users/{uid}` (solo modificable por un servidor), integrar Stripe Checkout con una ruta `/api/stripe/webhook` (con Cloudflare Pages Functions o Workers) y condicionar las funciones premium a ese campo.

## 5. Scripts

```bash
npm run dev     # desarrollo
npm run build   # build de producción (genera out/)
npm run preview # sirve out/ en local
npm run lint    # ESLint
node scripts/fetch-exercise-images.mjs   # descarga/convierte imágenes de nuevos ejercicios
```

Las imágenes de los ejercicios proceden de [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (dominio público, Unlicense).
