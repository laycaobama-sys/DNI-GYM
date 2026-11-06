export const SITE = {
  name: "DNI GYM",
  shortName: "DNI GYM",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://dnigym.com").replace(/\/$/, ""),
  locale: "es_ES",
  title: "DNI GYM (dnigym.com) · App de gimnasio y entrenador personal gratis",
  /** variantes de la marca para buscadores (Google usa WebSite.alternateName) */
  alternateNames: ["DNIGYM", "dnigym", "DNI Gym", "dnigym.com", "DNI GYM app"],
  tagline: "Tu entrenador personal gratis · Gym y casa",
  description:
    "DNI GYM es tu entrenador personal gratis: plan de entreno y de comidas personalizado según tu objetivo, entreno guiado para gimnasio o en casa sin material, 148 ejercicios con técnica y variantes, coach con IA, registro con un toque, récords, rachas y progreso. Crea tu cuenta gratis y empieza hoy.",
  /** versión corta para la meta description (≤ 155 caracteres) */
  metaDescription: "Entrenador personal gratis con IA: plan de entreno y comidas a tu medida, 148 ejercicios con técnica y rutinas para gimnasio o casa. Crea tu cuenta gratis.",
  keywords: [
    "DNI GYM",
    "dnigym",
    "dni gym app",
    "app de gimnasio",
    "app gym",
    "gym",
    "gimnasio",
    "app de entrenamiento",
    "entrenador personal con IA",
    "entrenador personal con inteligencia artificial",
    "mejor app de gimnasio gratis",
    "app para ir al gimnasio",
    "rutina de gimnasio para hombres",
    "rutina de gimnasio para mujeres",
    "rutina de gimnasio 3 días",
    "rutina full body",
    "ejercicios de gimnasio",
    "entrenador personal gratis",
    "entrenador personal online",
    "app entrenar en casa sin material",
    "plan de comidas personalizado",
    "qué comer para ganar músculo",
    "dieta para perder grasa",
    "app gimnasio gratis",
    "app fitness gratis",
    "rutinas de gimnasio",
    "rutina de gimnasio para principiantes",
    "ejercicios de gimnasio con imágenes",
    "cómo hacer sentadilla correctamente",
    "registro de entrenamientos",
    "diario de entrenamiento",
    "seguimiento de progreso gym",
    "contador de calorías gratis",
    "calculadora de macros",
    "calculadora de calorías",
    "calculadora IMC",
    "calculadora 1RM",
    "rutina torso pierna",
    "rutina push pull legs",
    "rutina en casa sin material",
    "entrenamiento de glúteos",
    "app para ganar masa muscular",
    "app para perder grasa",
  ],
};

/** Título SEO corto (≤ 50 caracteres + « | DNI GYM»): corta por «:» o por « para » en preguntas, o por palabras. */
export function seoTitle(t: string, max = 50) {
  if (t.length <= max) return t;
  const colon = t.split(":")[0].trim();
  if (colon.length <= max && colon.length >= 12) return colon;
  if (t.endsWith("?") && t.includes(" para ")) {
    const q = `${t.split(" para ")[0].trim()}?`;
    if (q.length <= max) return q;
  }
  return t.slice(0, max).replace(/\s+\S*$/, "");
}

/** Meta description de 120–155 caracteres cortada por palabra completa. */
export function seoDesc(d: string, max = 155) {
  const s = d.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).replace(/[\s,;:.]+\S*$/, "")}…`;
}

export const absoluteUrl = (path = "/") => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;

/** Administradores principales (el servidor usa ADMIN_EMAILS de wrangler.toml; más admins desde el panel). */
export const ADMIN_EMAILS = ["ibraguimova19@gmail.com"];
