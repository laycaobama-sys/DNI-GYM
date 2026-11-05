export const SITE = {
  name: "DNI GYM",
  shortName: "DNI GYM",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://dni-gym.ibraguimova19.workers.dev").replace(/\/$/, ""),
  locale: "es_ES",
  title: "DNI GYM · Tu entrenador personal gratis para el gym y en casa",
  tagline: "Tu entrenador personal gratis · Gym y casa",
  description:
    "DNI GYM es tu entrenador personal gratis: plan de entreno y de comidas personalizado según tu objetivo, entreno guiado para gimnasio o en casa sin material, 84 ejercicios con técnica, registro con un toque, récords, rachas y progreso. Entra con Google y empieza hoy.",
  keywords: [
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

export const absoluteUrl = (path = "/") => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;

/** Administradores principales (el servidor usa ADMIN_EMAILS de wrangler.toml; más admins desde el panel). */
export const ADMIN_EMAILS = ["ibraguimova19@gmail.com"];
