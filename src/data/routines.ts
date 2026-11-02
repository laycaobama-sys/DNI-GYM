export interface RoutineItem {
  slug: string; // slug del ejercicio
  sets: number;
  reps: string;
  rest: number; // segundos
}

export interface RoutineDay {
  name: string;
  focus: string;
  items: RoutineItem[];
}

export interface Routine {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  level: "principiante" | "intermedio" | "avanzado";
  goal: "fuerza" | "hipertrofia" | "pérdida de grasa" | "salud";
  daysPerWeek: number;
  minutes: number;
  place: "gimnasio" | "casa";
  days: RoutineDay[];
}

const i = (slug: string, sets: number, reps: string, rest = 90): RoutineItem => ({ slug, sets, reps, rest });

export const ROUTINES: Routine[] = [
  {
    slug: "full-body-principiante",
    name: "Full Body para principiantes",
    tagline: "3 días · Todo el cuerpo · Ideal para empezar",
    description:
      "Rutina de cuerpo completo 3 días por semana para aprender los patrones básicos (sentadilla, empuje, tirón y bisagra) y ganar fuerza de forma segura. Alterna los días A y B.",
    level: "principiante",
    goal: "salud",
    daysPerWeek: 3,
    minutes: 50,
    place: "gimnasio",
    days: [
      {
        name: "Día A",
        focus: "Sentadilla · Empuje horizontal · Remo",
        items: [
          i("sentadilla-goblet", 3, "10–12"),
          i("press-banca-con-mancuernas", 3, "8–12"),
          i("jalon-al-pecho", 3, "10–12"),
          i("puente-de-gluteo", 3, "15"),
          i("elevaciones-laterales", 2, "12–15", 60),
          i("plancha-abdominal", 3, "30 s", 45),
        ],
      },
      {
        name: "Día B",
        focus: "Bisagra · Empuje vertical · Remo",
        items: [
          i("prensa-de-piernas", 3, "10–12"),
          i("peso-muerto-rumano", 3, "10"),
          i("press-de-hombro-con-mancuernas", 3, "10"),
          i("remo-sentado-en-polea", 3, "10–12"),
          i("curl-con-mancuernas", 2, "12", 60),
          i("extension-de-triceps-en-polea-con-cuerda", 2, "12", 60),
          i("dead-bug", 3, "10 por lado", 45),
        ],
      },
    ],
  },
  {
    slug: "torso-pierna-4-dias",
    name: "Torso / Pierna (4 días)",
    tagline: "4 días · Hipertrofia y fuerza · Intermedio",
    description:
      "La división más equilibrada para ganar músculo: cada grupo muscular se entrena dos veces por semana con un volumen óptimo. Lunes torso, martes pierna, jueves torso, viernes pierna.",
    level: "intermedio",
    goal: "hipertrofia",
    daysPerWeek: 4,
    minutes: 65,
    place: "gimnasio",
    days: [
      {
        name: "Torso 1 (fuerza)",
        focus: "Pecho · Espalda · Hombros",
        items: [
          i("press-banca-con-barra", 4, "6–8", 150),
          i("remo-con-barra", 4, "6–8", 150),
          i("press-militar-con-barra", 3, "8", 120),
          i("dominadas", 3, "máx.", 120),
          i("curl-de-biceps-con-barra", 3, "10", 60),
          i("press-frances", 3, "10", 60),
        ],
      },
      {
        name: "Pierna 1 (fuerza)",
        focus: "Cuádriceps · Glúteo · Isquios",
        items: [
          i("sentadilla-con-barra", 4, "5–8", 180),
          i("peso-muerto-rumano", 3, "8", 120),
          i("prensa-de-piernas", 3, "10–12", 90),
          i("curl-femoral-tumbado", 3, "12", 60),
          i("elevacion-de-gemelos-de-pie", 4, "12–15", 60),
          i("elevacion-de-piernas-colgado", 3, "10", 60),
        ],
      },
      {
        name: "Torso 2 (hipertrofia)",
        focus: "Pecho superior · Espalda · Brazos",
        items: [
          i("press-inclinado-con-mancuernas", 4, "8–12"),
          i("remo-con-mancuerna-a-una-mano", 3, "10–12"),
          i("jalon-al-pecho", 3, "10–12"),
          i("cruces-en-polea", 3, "12–15", 60),
          i("elevaciones-laterales", 4, "15", 60),
          i("face-pull", 3, "15", 60),
          i("curl-martillo", 3, "12", 60),
          i("extension-de-triceps-en-polea-con-cuerda", 3, "12", 60),
        ],
      },
      {
        name: "Pierna 2 (hipertrofia)",
        focus: "Glúteo · Cuádriceps · Core",
        items: [
          i("hip-thrust", 4, "8–12", 120),
          i("sentadilla-bulgara", 3, "10 por pierna"),
          i("sentadilla-hack", 3, "10–12"),
          i("extension-de-cuadriceps", 3, "15", 60),
          i("curl-femoral-sentado", 3, "12", 60),
          i("elevacion-de-gemelos-sentado", 3, "15–20", 60),
          i("crunch-en-polea", 3, "12–15", 60),
        ],
      },
    ],
  },
  {
    slug: "push-pull-legs",
    name: "Push / Pull / Legs (PPL)",
    tagline: "3–6 días · Empuje, tirón y pierna · Intermedio-avanzado",
    description:
      "La clásica rutina PPL: empuje (pecho, hombro, tríceps), tirón (espalda, bíceps) y pierna. Hazla 3 días por semana o repítela dos veces (6 días) para el máximo volumen.",
    level: "avanzado",
    goal: "hipertrofia",
    daysPerWeek: 6,
    minutes: 70,
    place: "gimnasio",
    days: [
      {
        name: "Push (empuje)",
        focus: "Pecho · Hombro · Tríceps",
        items: [
          i("press-banca-con-barra", 4, "6–8", 150),
          i("press-inclinado-con-mancuernas", 3, "8–10"),
          i("press-de-hombro-con-mancuernas", 3, "8–10"),
          i("elevaciones-laterales", 4, "12–15", 60),
          i("fondos-en-paralelas-pecho", 3, "8–12"),
          i("extension-de-triceps-sobre-la-cabeza", 3, "12", 60),
        ],
      },
      {
        name: "Pull (tirón)",
        focus: "Espalda · Bíceps · Deltoides posterior",
        items: [
          i("peso-muerto", 3, "5", 180),
          i("dominadas", 4, "máx.", 120),
          i("remo-en-t", 3, "8–10"),
          i("remo-sentado-en-polea", 3, "10–12"),
          i("face-pull", 3, "15", 60),
          i("curl-inclinado-con-mancuernas", 3, "10–12", 60),
          i("curl-martillo", 3, "12", 60),
        ],
      },
      {
        name: "Legs (pierna)",
        focus: "Cuádriceps · Glúteo · Isquios · Gemelo",
        items: [
          i("sentadilla-con-barra", 4, "6–8", 180),
          i("hip-thrust", 3, "10", 120),
          i("prensa-de-piernas", 3, "10–12"),
          i("curl-femoral-tumbado", 3, "12", 60),
          i("extension-de-cuadriceps", 3, "15", 60),
          i("elevacion-de-gemelos-de-pie", 4, "15", 60),
        ],
      },
    ],
  },
  {
    slug: "gluteos-y-piernas",
    name: "Glúteos y piernas",
    tagline: "3 días · Enfoque glúteo · Todos los niveles",
    description:
      "Programa centrado en el desarrollo del glúteo y la pierna, con hip thrust, peso muerto rumano, zancadas y trabajo accesorio. Incluye un día de tren superior para mantener el equilibrio.",
    level: "intermedio",
    goal: "hipertrofia",
    daysPerWeek: 3,
    minutes: 60,
    place: "gimnasio",
    days: [
      {
        name: "Día 1 · Glúteo dominante",
        focus: "Hip thrust · Bisagra",
        items: [
          i("hip-thrust", 4, "8–12", 120),
          i("peso-muerto-rumano", 3, "10"),
          i("sentadilla-bulgara", 3, "10 por pierna"),
          i("pull-through-en-polea", 3, "15", 60),
          i("patada-de-gluteo", 3, "15 por pierna", 45),
        ],
      },
      {
        name: "Día 2 · Tren superior",
        focus: "Espalda · Hombros · Core",
        items: [
          i("jalon-al-pecho", 3, "10–12"),
          i("press-de-hombro-con-mancuernas", 3, "10"),
          i("remo-sentado-en-polea", 3, "12"),
          i("flexiones", 3, "máx."),
          i("elevaciones-laterales", 3, "15", 60),
          i("plancha-abdominal", 3, "40 s", 45),
        ],
      },
      {
        name: "Día 3 · Cuádriceps y glúteo",
        focus: "Sentadilla · Zancada",
        items: [
          i("sentadilla-goblet", 4, "10–12"),
          i("prensa-de-piernas", 3, "12"),
          i("zancadas-con-mancuernas", 3, "12 por pierna"),
          i("puente-de-gluteo-con-barra", 3, "15", 60),
          i("curl-femoral-sentado", 3, "12", 60),
          i("elevacion-de-gemelos-de-pie", 3, "15", 45),
        ],
      },
    ],
  },
  {
    slug: "entrenamiento-en-casa-sin-material",
    name: "Entrenamiento en casa sin material",
    tagline: "3 días · Peso corporal · Sin equipamiento",
    description:
      "Entrena donde quieras solo con tu peso corporal. Circuito de fuerza y resistencia para todo el cuerpo: perfecto si no tienes acceso a un gimnasio o viajas.",
    level: "principiante",
    goal: "salud",
    daysPerWeek: 3,
    minutes: 35,
    place: "casa",
    days: [
      {
        name: "Circuito A",
        focus: "Cuerpo completo",
        items: [
          i("sentadilla-sin-peso", 4, "15–20", 45),
          i("flexiones", 4, "máx.", 60),
          i("puente-de-gluteo", 3, "20", 45),
          i("fondos-en-banco", 3, "12–15", 60),
          i("plancha-abdominal", 3, "40 s", 30),
          i("escaladores", 3, "30 s", 30),
        ],
      },
      {
        name: "Circuito B",
        focus: "Piernas y core",
        items: [
          i("sentadilla-con-salto", 4, "12", 60),
          i("patada-de-gluteo", 3, "15 por pierna", 30),
          i("plancha-lateral", 3, "30 s por lado", 30),
          i("crunch-bicicleta", 3, "20", 30),
          i("dead-bug", 3, "10 por lado", 30),
          i("saltos-de-estrella", 3, "30 s", 30),
        ],
      },
    ],
  },
  {
    slug: "quema-grasa-hiit",
    name: "Quema grasa: fuerza + HIIT",
    tagline: "4 días · Pérdida de grasa · Intermedio",
    description:
      "Combina entrenamiento de fuerza para mantener el músculo con circuitos metabólicos de alta intensidad para maximizar el gasto calórico. Acompáñalo de un ligero déficit calórico.",
    level: "intermedio",
    goal: "pérdida de grasa",
    daysPerWeek: 4,
    minutes: 45,
    place: "gimnasio",
    days: [
      {
        name: "Fuerza tren superior + finisher",
        focus: "Empuje · Tirón · HIIT",
        items: [
          i("press-banca-con-mancuernas", 3, "10"),
          i("remo-con-mancuerna-a-una-mano", 3, "10"),
          i("press-de-hombro-con-mancuernas", 3, "10"),
          i("jalon-al-pecho", 3, "12"),
          i("saltar-a-la-comba", 5, "1 min", 30),
        ],
      },
      {
        name: "Fuerza tren inferior + finisher",
        focus: "Sentadilla · Bisagra · HIIT",
        items: [
          i("sentadilla-goblet", 4, "12"),
          i("peso-muerto-rumano", 3, "10"),
          i("zancadas-con-mancuernas", 3, "10 por pierna"),
          i("swing-con-kettlebell", 4, "20", 45),
          i("escaladores", 4, "30 s", 30),
        ],
      },
      {
        name: "Circuito metabólico",
        focus: "Todo el cuerpo",
        items: [
          i("thruster-con-kettlebell", 4, "10", 45),
          i("salto-al-cajon", 4, "8", 45),
          i("remo-invertido", 4, "10", 45),
          i("flexiones", 4, "12", 45),
          i("giros-rusos", 3, "20", 30),
        ],
      },
      {
        name: "Cardio continuo",
        focus: "Zona 2",
        items: [i("remo-ergometro", 1, "20 min", 0), i("correr-en-cinta", 1, "20 min", 0)],
      },
    ],
  },
];

export function getRoutine(slug: string) {
  return ROUTINES.find((r) => r.slug === slug);
}
