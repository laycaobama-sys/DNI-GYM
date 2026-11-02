export const SITE = {
  name: "DNI GYM",
  shortName: "DNI GYM",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://dni-gym.pages.dev").replace(/\/$/, ""),
  locale: "es_ES",
  title: "DNI GYM — App de gimnasio y fitness gratis: rutinas, ejercicios, progreso y nutrición",
  description:
    "DNI GYM es la app de fitness 100% gratuita para entrenar en el gimnasio o en casa: 84 ejercicios con técnica explicada paso a paso, rutinas listas, registro de entrenamientos, seguimiento de peso y progreso, contador de calorías y macros. Entra con Google y guarda todo en la nube.",
  keywords: [
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
