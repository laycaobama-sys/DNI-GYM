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
  {
    slug: "fuerza-5x5",
    name: "Fuerza 5×5",
    tagline: "3 días · Básicos pesados · Gana fuerza rápido",
    description:
      "El clásico método 5×5: pocos ejercicios básicos, mucho peso y progresión semanal. Alterna los días A y B y sube 2,5 kg cada vez que completes todas las series. Ideal tras unos meses de experiencia.",
    level: "intermedio",
    goal: "fuerza",
    daysPerWeek: 3,
    minutes: 55,
    place: "gimnasio",
    days: [
      { name: "Día A", focus: "Sentadilla · Banca · Remo", items: [i("sentadilla-con-barra", 5, "5", 180), i("press-banca-con-barra", 5, "5", 180), i("remo-con-barra", 5, "5", 150), i("plancha-abdominal", 3, "45 s", 60)] },
      { name: "Día B", focus: "Sentadilla · Press militar · Peso muerto", items: [i("sentadilla-con-barra", 5, "5", 180), i("press-militar-con-barra", 5, "5", 180), i("peso-muerto", 1, "5", 180), i("dominadas", 3, "máx.", 120)] },
    ],
  },
  {
    slug: "rutina-5-dias-por-grupos",
    name: "Rutina de 5 días por grupos musculares",
    tagline: "5 días · Un grupo por día · Máximo volumen",
    description:
      "División clásica de culturismo: pecho, espalda, piernas, hombros y brazos en días separados. Mucho volumen por músculo y variedad de ejercicios con barra, mancuernas, polea y máquina.",
    level: "intermedio",
    goal: "hipertrofia",
    daysPerWeek: 5,
    minutes: 60,
    place: "gimnasio",
    days: [
      { name: "Pecho", focus: "Pecho completo", items: [i("press-banca-con-barra", 4, "8"), i("press-inclinado-con-mancuernas", 3, "10"), i("press-banca-declinado-con-barra", 3, "10"), i("aperturas-inclinadas-en-polea", 3, "12", 60), i("fondos-en-paralelas-pecho", 3, "máx.")] },
      { name: "Espalda", focus: "Anchura y grosor", items: [i("dominadas", 4, "máx.", 120), i("remo-con-barra", 4, "8"), i("jalon-agarre-cerrado", 3, "10"), i("remo-en-maquina", 3, "12"), i("encogimientos-con-barra", 3, "12", 60)] },
      { name: "Piernas", focus: "Cuádriceps, isquios y gemelos", items: [i("sentadilla-con-barra", 4, "8", 150), i("prensa-de-piernas", 3, "12"), i("peso-muerto-rumano", 3, "10"), i("extension-de-cuadriceps", 3, "15", 60), i("curl-femoral-tumbado", 3, "12", 60), i("gemelos-en-prensa", 4, "15", 45)] },
      { name: "Hombros", focus: "Deltoides 3 cabezas", items: [i("press-militar-sentado-con-barra", 4, "8"), i("elevaciones-laterales", 4, "15", 60), i("pajaros-en-polea", 3, "15", 60), i("press-arnold", 3, "10"), i("face-pull", 3, "15", 60)] },
      { name: "Brazos", focus: "Bíceps y tríceps", items: [i("curl-con-barra-z", 4, "10", 60), i("press-frances-con-barra-z", 4, "10", 60), i("curl-martillo", 3, "12", 60), i("extension-de-triceps-en-polea-con-cuerda", 3, "12", 60), i("curl-arana", 3, "12", 60), i("extension-de-triceps-en-polea-sobre-la-cabeza", 3, "12", 60)] },
    ],
  },
  {
    slug: "casa-con-mancuernas",
    name: "En casa con mancuernas",
    tagline: "4 días · Solo un par de mancuernas · Torso / pierna",
    description:
      "Rutina torso-pierna pensada para entrenar en casa con un par de mancuernas y una silla o banco. Suficiente para ganar músculo y fuerza durante meses si subes repeticiones o peso cada semana.",
    level: "principiante",
    goal: "hipertrofia",
    daysPerWeek: 4,
    minutes: 40,
    place: "casa",
    days: [
      { name: "Torso A", focus: "Empuje y tirón", items: [i("press-banca-con-mancuernas", 4, "10"), i("remo-con-mancuerna-a-una-mano", 4, "10 por lado"), i("press-de-hombro-con-mancuernas", 3, "10"), i("curl-con-mancuernas", 3, "12", 60), i("extension-de-triceps-de-pie-con-mancuerna", 3, "12", 60)] },
      { name: "Pierna A", focus: "Cuádriceps y glúteo", items: [i("sentadilla-goblet", 4, "12"), i("zancadas-con-mancuernas", 3, "10 por pierna"), i("puente-de-gluteo-a-una-pierna", 3, "12 por pierna", 60), i("elevacion-de-gemelos-de-pie", 4, "15", 45), i("plancha-abdominal", 3, "40 s", 45)] },
      { name: "Torso B", focus: "Hombro y espalda", items: [i("flexiones", 4, "máx."), i("pullover-con-mancuerna", 3, "12"), i("elevaciones-laterales", 4, "15", 60), i("pajaros-sentado-con-mancuernas", 3, "15", 60), i("curl-martillo", 3, "12", 60)] },
      { name: "Pierna B", focus: "Isquios y glúteo", items: [i("peso-muerto-rumano", 4, "10"), i("sentadilla-bulgara", 3, "10 por pierna"), i("sentadilla-sumo-con-mancuerna", 3, "15"), i("paseo-del-granjero", 3, "30 m", 60), i("giros-rusos", 3, "20", 45)] },
    ],
  },
  {
    slug: "maquinas-para-principiantes",
    name: "Máquinas para principiantes",
    tagline: "3 días · Solo máquinas y poleas · Seguro y fácil",
    description:
      "Tu primera rutina en el gimnasio usando máquinas guiadas y poleas: aprendes a entrenar con seguridad, sin necesidad de dominar la técnica de barra. Haz el mismo circuito los 3 días y sube peso poco a poco.",
    level: "principiante",
    goal: "salud",
    daysPerWeek: 3,
    minutes: 45,
    place: "gimnasio",
    days: [
      { name: "Cuerpo completo", focus: "Circuito de máquinas", items: [i("prensa-de-piernas", 3, "12"), i("press-de-pecho-en-maquina", 3, "12"), i("jalon-al-pecho", 3, "12"), i("press-de-hombro-en-maquina", 3, "12"), i("remo-en-maquina", 3, "12"), i("curl-femoral-sentado", 3, "12", 60), i("abductores-en-maquina", 2, "15", 45), i("crunch-en-polea", 3, "15", 45)] },
    ],
  },
  {
    slug: "express-30-minutos",
    name: "Express 30 minutos",
    tagline: "3 días · 30 min · Superseries sin perder tiempo",
    description:
      "Para semanas con poco tiempo: superseries de ejercicios opuestos (empuje + tirón, pierna + core) con descansos cortos. Mantienes músculo y quemas calorías en solo media hora.",
    level: "intermedio",
    goal: "pérdida de grasa",
    daysPerWeek: 3,
    minutes: 30,
    place: "gimnasio",
    days: [
      { name: "Express A", focus: "Pierna y empuje", items: [i("sentadilla-goblet", 3, "12", 45), i("press-banca-con-mancuernas", 3, "10", 45), i("zancadas-caminando", 3, "10 por pierna", 45), i("press-de-hombro-con-mancuernas", 3, "10", 45), i("escaladores", 3, "30 s", 30)] },
      { name: "Express B", focus: "Bisagra y tirón", items: [i("peso-muerto-rumano", 3, "10", 45), i("jalon-al-pecho", 3, "12", 45), i("hip-thrust", 3, "12", 45), i("remo-sentado-en-polea", 3, "12", 45), i("cuerdas-de-batalla", 4, "30 s", 30)] },
      { name: "Express C", focus: "Metabólico", items: [i("swing-con-kettlebell", 4, "15", 40), i("flexiones", 4, "12", 40), i("saltos-al-cajon-continuos", 4, "8", 40), i("remo-invertido", 4, "10", 40), i("empuje-de-trineo", 4, "20 m", 40)] },
    ],
  },
  {
    slug: "abdomen-y-core",
    name: "Abdomen y core en casa",
    tagline: "3 días · 20 minutos · Sin material",
    description:
      "Programa de abdomen completo para hacer en casa: recto abdominal, oblicuos y estabilidad del core. Combínalo con tu rutina principal o hazlo solo en días de descanso activo.",
    level: "principiante",
    goal: "salud",
    daysPerWeek: 3,
    minutes: 20,
    place: "casa",
    days: [
      { name: "Core A", focus: "Recto abdominal", items: [i("crunch-abdominal", 3, "20", 30), i("patadas-de-tijera", 3, "30 s", 30), i("abdominales-sit-up", 3, "15", 30), i("plancha-abdominal", 3, "45 s", 30)] },
      { name: "Core B", focus: "Oblicuos", items: [i("crunch-cruzado", 3, "15 por lado", 30), i("toques-de-talon", 3, "30", 30), i("plancha-lateral", 3, "30 s por lado", 30), i("giros-rusos", 3, "20", 30)] },
      { name: "Core C", focus: "Estabilidad", items: [i("dead-bug", 3, "10 por lado", 30), i("superman", 3, "12", 30), i("abdominal-navaja", 3, "12", 30), i("escaladores", 3, "30 s", 30)] },
    ],
  },
  {
    slug: "brazos-y-hombros",
    name: "Especialización brazos y hombros",
    tagline: "2 días · Añádelo a tu rutina · Brazos más grandes",
    description:
      "Bloque de especialización para dar prioridad a bíceps, tríceps y deltoides durante 6–8 semanas. Añade estos 2 días a tu semana o sustituye tus días de brazo actuales.",
    level: "intermedio",
    goal: "hipertrofia",
    daysPerWeek: 2,
    minutes: 45,
    place: "gimnasio",
    days: [
      { name: "Brazos y hombro A", focus: "Pesado", items: [i("press-banca-agarre-cerrado", 4, "8", 120), i("curl-de-biceps-con-barra", 4, "8"), i("press-de-hombro-con-mancuernas", 4, "8"), i("press-frances-con-barra-z", 3, "10", 60), i("curl-zottman", 3, "10", 60)] },
      { name: "Brazos y hombro B", focus: "Bombeo", items: [i("elevaciones-laterales", 4, "15", 45), i("curl-inclinado-con-mancuernas", 3, "12", 60), i("extension-de-triceps-en-polea-sobre-la-cabeza", 3, "12", 60), i("curl-martillo-en-polea", 3, "15", 45), i("flexiones-diamante", 3, "máx.", 60), i("pajaros-en-polea", 3, "15", 45)] },
    ],
  },
  {
    slug: "salud-y-movilidad-50",
    name: "Salud y fuerza +50",
    tagline: "3 días · Bajo impacto · Fuerza para el día a día",
    description:
      "Rutina suave de cuerpo completo para mayores de 50 o personas que vuelven a entrenar: fuerza funcional, equilibrio y cardio de bajo impacto. Consulta con tu médico si tienes alguna patología.",
    level: "principiante",
    goal: "salud",
    daysPerWeek: 3,
    minutes: 40,
    place: "gimnasio",
    days: [
      { name: "Fuerza funcional", focus: "Todo el cuerpo", items: [i("bicicleta-estatica", 1, "8 min", 0), i("sentadilla-sin-peso", 3, "12"), i("press-de-pecho-en-maquina", 3, "12"), i("remo-en-maquina", 3, "12"), i("puente-de-gluteo", 3, "12", 60), i("paseo-del-granjero", 3, "20 m", 60)] },
      { name: "Cardio suave y core", focus: "Corazón y estabilidad", items: [i("caminar-en-cinta", 1, "20 min", 0), i("subida-al-cajon-con-rodilla", 3, "8 por pierna"), i("press-pallof", 3, "10 por lado", 60), i("dead-bug", 3, "8 por lado", 45)] },
    ],
  },
];

export function getRoutine(slug: string) {
  return ROUTINES.find((r) => r.slug === slug);
}
