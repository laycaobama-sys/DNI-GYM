# DNI GYM — App de gimnasio y fitness gratuita

Aplicación web profesional de entrenamiento: acceso con Google, registro de entrenamientos, progreso, peso y medidas, nutrición con macros, biblioteca de 84 ejercicios con demostración visual, rutinas, calculadoras y **panel de administración**. Optimizada para SEO y para recomendaciones de asistentes de IA (ChatGPT, Gemini, Perplexity, Claude…).

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Firebase (Authentication + Firestore) · Recharts.

---

## 1. Probarla en local (2 minutos)

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin configurar nada, la app arranca en **modo demo**: el botón «Continuar con Google» entra con un usuario de prueba con 10 semanas de datos de ejemplo, y ese usuario es administrador para que puedas ver `/admin`. Los datos se guardan solo en tu navegador.

## 2. Activar el acceso real con Google (Firebase, gratis)

1. Entra en https://console.firebase.google.com → **Añadir proyecto** (puedes desactivar Google Analytics).
2. **Authentication → Comenzar → Sign-in method → Google → Habilitar** y guarda.
3. **Firestore Database → Crear base de datos** → modo producción → región `eur3 (europe-west)`.
4. **Configuración del proyecto (⚙️) → Tus apps → Web (`</>`)** → registra la app y copia los valores de `firebaseConfig`.
5. Copia `.env.example` a `.env.local` y rellena las variables `NEXT_PUBLIC_FIREBASE_*`.
6. Publica las reglas de seguridad (incluidas en `firestore.rules`):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add        # elige tu proyecto
   firebase deploy --only firestore:rules
   ```
   (O pega el contenido de `firestore.rules` en Firestore → Reglas → Publicar.)
7. **Hazte administrador:** en Firestore crea la colección `admins` y dentro un documento cuyo **ID sea tu email de Google en minúsculas**, con el campo `role` = `admin`. Al iniciar sesión verás «Panel de administración».
8. Cuando publiques la web, añade tu dominio en **Authentication → Settings → Authorized domains**.

## 3. Publicarla en internet (Vercel, gratis)

1. Sube este repositorio a GitHub (ya lo está).
2. Entra en https://vercel.com → **Add New Project** → importa el repositorio.
3. En **Environment Variables** añade las mismas variables de `.env.local` y `NEXT_PUBLIC_SITE_URL` con tu dominio final.
4. **Deploy.** Después conecta tu dominio en Vercel → Settings → Domains.
5. Añade el dominio en Firebase (paso 2.8) y da de alta la web en **Google Search Console** enviando `https://tudominio.com/sitemap.xml`.

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

Todo es gratuito. Para añadir planes de pago más adelante: guardar `plan` en `users/{uid}` (solo modificable por un servidor), integrar Stripe Checkout con una ruta `/api/stripe/webhook` (Next.js ya corre en servidor en Vercel) y condicionar las funciones premium a ese campo.

## 5. Scripts

```bash
npm run dev     # desarrollo
npm run build   # build de producción
npm run lint    # ESLint
node scripts/fetch-exercise-images.mjs   # descarga/convierte imágenes de nuevos ejercicios
```

Las imágenes de los ejercicios proceden de [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (dominio público, Unlicense).
