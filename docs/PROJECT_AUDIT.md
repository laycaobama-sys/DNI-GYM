# DNI GYM — Auditoría del proyecto (FASE 0)

Fecha: 2026-11-03 · Rama: `main` (commit `030ab2a` antes de esta fase)

## 1. Stack real

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 16.4.4 (App Router), React 19.3, TypeScript 5 | `output: "export"` → sitio estático en `out/` |
| Estilos | Tailwind CSS 4 (tokens en `src/app/globals.css`) | Tema oscuro único |
| Gráficas | Recharts 3 | `src/components/charts.tsx` |
| Hosting | Cloudflare Workers (recursos estáticos) | `wrangler.toml`, despliegue con Workers Builds desde GitHub (`main`) |
| Autenticación | Firebase Auth (Google) | proyecto `dni-gym-c6fa2` |
| Base de datos | Firestore (cliente) | reglas en `firestore.rules` |
| IA | — | no existía |
| Pagos | — | no existen (la app es gratuita) |
| Tests | — | solo verificación manual con Playwright |

Estructura: `src/app` (rutas), `src/components` (UI), `src/data` (ejercicios, rutinas, retos, alimentos, guías, calculadoras), `src/lib` (cálculos, datos, plan, menú, adaptación), `public/` (imágenes de ejercicios y de marca, `sw.js`, `_headers`).

## 2. Rutas existentes (27 páginas + 6 rutas de texto/SEO)

Públicas: `/`, `/ejercicios`, `/ejercicios/[slug]` (84), `/rutinas`, `/rutinas/[slug]` (6), `/retos`, `/retos/[slug]` (4), `/calculadoras`, `/calculadoras/[slug]` (4), `/guias`, `/guias/[slug]` (6), `/privacidad`, `/terminos`, `/login`.
Privadas: `/bienvenida`, `/panel` (+ explorar, entrenar, retos, ejercicios, nutricion, progreso, historial, cuerpo, perfil), `/admin`.
SEO: `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `opengraph-image`, `llms.txt`, `llms-full.txt`.

## 3. Estado de las funcionalidades

Leyenda: ✅ implementada y comprobada · 🟡 parcial · 🎨 visual sin lógica · ❌ inexistente · 🔌 requiere servicio externo

| Funcionalidad | Estado | Comentario |
|---|---|---|
| Login con Google | ✅ | Firebase Auth (popup + redirección de respaldo) |
| Persistencia de datos de usuario | ✅ → migrando | Firestore; esta fase lo pasa a Cloudflare D1 |
| Cuestionario de bienvenida | ✅ | objetivo, sexo, edad, altura, peso, nivel, lugar, días, zonas, actividad, dieta, tiempo |
| Dashboard | ✅ | entreno de hoy, semana, anillos, menú, retos, logros, gráficas |
| Entreno guiado | ✅ | adaptación por tiempo/lugar/molestias, sustitución, 1RM, récords, diario |
| Registro manual de entrenos | ✅ | borrador local, temporizador de descanso |
| Biblioteca de ejercicios | ✅ (84) | técnica, mapa muscular, FAQ; lejos de 1.000 (ver roadmap) |
| Rutinas prediseñadas | ✅ (6) | — |
| Rutinas propias editables | 🟡 | se pueden crear entrenos libres, no guardar plantillas propias |
| Superseries / series descendentes / RIR / RPE | ❌ | roadmap FASE 3 |
| Nutrición: diario, macros, agua, menú diario | ✅ | +100 alimentos, dietas omnívora/vegetariana/vegana/sin lactosa |
| Recetas, lista de compra, código de barras, foto IA | ❌ / 🔌 | roadmap FASE 5 |
| Progreso: peso, medidas, récords, volumen, series por músculo | ✅ | fotos de progreso ❌ (necesita almacenamiento R2) |
| Retos 30 días, logros, niveles, racha con comodín | ✅ | — |
| Recordatorios | ✅ | calendario (.ics); push ❌ |
| Modo sin conexión | ✅ | service worker + caché |
| Panel de administración | ✅ | métricas, usuarios, bloqueo, errores de acceso |
| IA (DNI AI Coach) | ❌ → esta fase | Gemini vía Worker |
| Comunidad | ❌ | roadmap FASE 9 |
| Entrenadores / alumnos | ❌ | roadmap FASE 10 |
| Apple Health / Health Connect / wearables | 🔌 | requiere app nativa |
| Suscripciones / Stripe | ❌ | la app es gratuita por decisión de negocio |

## 4. Problemas detectados

| # | Severidad | Problema | Acción |
|---|---|---|---|
| 1 | Alta | El usuario quiere todos los datos y sesiones en Cloudflare; hoy están en Firestore | Worker + D1 + sesiones propias (esta fase) |
| 2 | Alta | Clave de Gemini compartida en un chat | Guardarla solo como secreto del Worker; recomendar rotarla |
| 3 | Media | `npm audit`: 4 avisos altos en `@grpc/grpc-js` (dependencia de Firestore para Node) | No afecta al navegador; desaparece al retirar Firestore tras la migración |
| 4 | Media | iOS: `env(safe-area-inset-*)` vale 0 sin `viewport-fit=cover` → la barra inferior podía quedar tapada | Añadir `viewportFit: "cover"` |
| 5 | Media | Sin tests automáticos | Script de pruebas de API contra `wrangler dev` + Playwright |
| 6 | Baja | Identidad en verde lima; el documento de marca pide naranja solar | Cambio de tokens (FASE 1) |
| 7 | Baja | El catálogo (84) no alcanza el objetivo de 1.000 ejercicios | Roadmap: importar y traducir catálogo con licencia abierta, verificando cada ficha |

## 5. Seguridad

- No hay secretos en el repositorio: la configuración web de Firebase es pública por diseño.
- Reglas de Firestore restringen cada usuario a sus datos; admin por lista de emails.
- Cabeceras de seguridad en `public/_headers` (HSTS, nosniff, frame, referrer, permissions).
- Faltaban: validación backend propia, limitación de solicitudes y registro de auditoría → se añaden en el Worker.
