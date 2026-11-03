# DNI GYM — Hoja de ruta

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Auditoría y documentación | ✅ |
| 1 | Identidad naranja solar, tokens, logo | ✅ |
| 2 | Dashboard, navegación, responsive 360–1920 | ✅ |
| 3 | Entrenos: guiado, adaptación, sustitución, 1RM, récords | ✅ · Pendiente: plantillas propias guardadas, superseries, series descendentes, RIR/RPE por serie |
| 4 | Biblioteca | ✅ 84 fichas · Pendiente: ampliar a 1.000+ con catálogo de licencia abierta (free-exercise-db, 873, Unlicense) traducido y revisado ficha a ficha |
| 5 | Nutrición: diario, macros, agua, menú diario | ✅ · Pendiente: recetas, lista de compra, código de barras (Open Food Facts), foto asistida por IA |
| 6 | DNI AI Coach (Gemini) + IA de administración | ✅ en esta entrega (requiere el secreto `GEMINI_API_KEY`) |
| 7 | Progreso | ✅ · Pendiente: fotos de progreso (R2 privado), informes exportables en PDF |
| 8 | Recuperación y gamificación | 🟡 rachas, logros, niveles ✅ · Pendiente: registro de sueño/fatiga |
| 9 | Comunidad | ❌ requiere moderación y política de privacidad específica |
| 10 | Entrenadores | ❌ requiere roles `trainer` y relación entrenador–alumno (la base ya admite roles) |
| 11 | Integraciones | 🔌 Apple Health / Health Connect requieren app nativa; push requiere Web Push con claves VAPID |
| 12 | Seguridad, pruebas, lanzamiento | 🟡 pruebas de API y E2E incluidas |

## Lo que necesita el propietario

1. Secreto `GEMINI_API_KEY` en Cloudflare (Worker → Settings → Variables and Secrets).
2. Decidir modelo y presupuesto de IA (`GEMINI_MODEL`, `AI_DAILY_LIMIT`).
3. Rotar la clave de Gemini compartida por chat.
