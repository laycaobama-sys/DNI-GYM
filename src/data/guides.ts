export interface Guide {
  slug: string;
  title: string;
  description: string;
  /** respuesta directa en 2–3 frases (para buscadores y asistentes de IA) */
  answer: string;
  category: "Entrenamiento" | "Nutrición" | "Principiantes";
  cover: string;
  minutes: number;
  sections: { h: string; p: string[]; list?: string[] }[];
  faq: { q: string; a: string }[];
  related: { exercises?: string[]; routines?: string[]; calculators?: string[]; challenges?: string[] };
}

export const GUIDES: Guide[] = [
  {
    slug: "rutina-gimnasio-principiantes",
    title: "Rutina de gimnasio para principiantes: plan de 3 días para empezar bien",
    description: "La mejor rutina de gimnasio para principiantes: cuerpo completo 3 días por semana, ejercicios, series, repeticiones, descansos y cómo progresar sin lesionarte.",
    answer:
      "La mejor rutina para empezar en el gimnasio es un cuerpo completo (full body) 3 días por semana, con 5–6 ejercicios básicos por sesión, 3 series de 8–12 repeticiones y 1–2 repeticiones en reserva. Sube el peso cuando completes todas las series en el tope del rango.",
    category: "Principiantes",
    cover: "/brand/p-full-body-principiante.webp",
    minutes: 6,
    sections: [
      {
        h: "Por qué un full body de 3 días",
        p: [
          "Cuando empiezas, cada músculo responde muy bien a estímulos frecuentes y moderados. Entrenar todo el cuerpo tres veces por semana (por ejemplo lunes, miércoles y viernes) te permite practicar la técnica de los ejercicios básicos muchas veces y recuperarte entre sesiones.",
          "Además es fácil de cumplir: si un día fallas, no se queda un grupo muscular sin entrenar en toda la semana.",
        ],
      },
      {
        h: "La rutina (alterna día A y día B)",
        p: ["Día A: sentadilla goblet, press de banca con mancuernas, jalón al pecho, puente de glúteo, elevaciones laterales y plancha.", "Día B: prensa de piernas, peso muerto rumano, press de hombro con mancuernas, remo sentado en polea, curl de bíceps y extensión de tríceps en polea."],
        list: ["3 series por ejercicio", "8–12 repeticiones (plancha: 30–45 s)", "Descanso: 90 s en los básicos, 60 s en los accesorios", "Duración: unos 50 minutos"],
      },
      {
        h: "Cómo progresar semana a semana",
        p: [
          "Usa la doble progresión: cuando completes las 3 series en el número máximo de repeticiones (12) con buena técnica, sube el peso un 2,5–5 % y vuelve a empezar desde 8 repeticiones.",
          "Registra cada sesión: en DNI GYM verás tu marca anterior en cada serie y un aviso cuando batas un récord, así sabes exactamente qué peso usar.",
        ],
      },
      {
        h: "Errores típicos al empezar",
        p: ["Querer hacer 6 días desde la primera semana, copiar rutinas de culturistas avanzados, no calentar y cambiar de rutina cada semana. La constancia durante 8–12 semanas es lo que da resultados."],
      },
    ],
    faq: [
      { q: "¿Cuántos días a la semana debe entrenar un principiante?", a: "Tres días por semana es lo ideal para empezar: suficiente estímulo y tiempo para recuperarse. Puedes pasar a 4 días a partir de los 3–6 meses." },
      { q: "¿Cuánto tiempo tardaré en ver resultados?", a: "Notarás más fuerza en 2–4 semanas y cambios visibles a partir de las 8–12 semanas si entrenas con constancia, duermes bien y comes suficiente proteína." },
      { q: "¿Tengo que hacer cardio?", a: "Es recomendable para la salud: 2–3 sesiones de 20–30 minutos de cardio moderado o caminar 8.000–10.000 pasos al día son suficientes." },
    ],
    related: { exercises: ["sentadilla-goblet", "press-banca-con-mancuernas", "jalon-al-pecho", "peso-muerto-rumano"], routines: ["full-body-principiante"], calculators: ["calorias"] },
  },
  {
    slug: "cuantas-veces-entrenar-a-la-semana",
    title: "¿Cuántas veces entrenar a la semana para ganar músculo o perder grasa?",
    description: "Cuántos días a la semana hay que entrenar según tu objetivo y nivel, cuántas series por músculo y cuánto descansar. Respuesta basada en la evidencia.",
    answer:
      "Para la mayoría de personas, 3–4 días de fuerza por semana son suficientes para ganar músculo y perder grasa. Lo importante es entrenar cada músculo unas 2 veces por semana y sumar 10–20 series semanales por grupo muscular.",
    category: "Entrenamiento",
    cover: "/brand/p-torso-pierna-4-dias.webp",
    minutes: 5,
    sections: [
      { h: "Frecuencia según tu nivel", p: ["Principiante: 3 días de cuerpo completo. Intermedio: 4 días (torso/pierna). Avanzado: 4–6 días (push/pull/legs o similar). Más días no es mejor si no te recuperas."] },
      { h: "Volumen: series por músculo", p: ["La investigación sitúa el rango más eficaz para ganar músculo entre 10 y 20 series efectivas por músculo a la semana, repartidas en al menos 2 sesiones. En DNI GYM puedes ver tus series por grupo muscular en la sección Progreso."] },
      { h: "Si tu objetivo es perder grasa", p: ["El entreno de fuerza mantiene tu músculo mientras pierdes grasa, pero la pérdida de grasa la marca el déficit calórico. Combina 3–4 días de fuerza con pasos diarios y una dieta ajustada a tus calorías."] },
      { h: "Descanso y recuperación", p: ["Deja al menos 48 horas antes de volver a entrenar duro el mismo músculo, duerme 7–9 horas y toma 1,6–2,2 g de proteína por kg de peso."] },
    ],
    faq: [
      { q: "¿Es malo entrenar todos los días?", a: "No necesariamente, si alternas grupos musculares e intensidades. Pero para la mayoría de personas 3–5 días con buena calidad dan mejores resultados que 7 días agotado." },
      { q: "¿Sirve entrenar solo 2 días a la semana?", a: "Sí. Dos sesiones de cuerpo completo bien hechas producen resultados claros, sobre todo si eres principiante o tienes poco tiempo." },
    ],
    related: { routines: ["torso-pierna-4-dias", "push-pull-legs"], exercises: ["sentadilla-con-barra", "press-banca-con-barra"] },
  },
  {
    slug: "cuanta-proteina-necesito",
    title: "¿Cuánta proteína necesito al día para ganar músculo o perder grasa?",
    description: "Cuántos gramos de proteína tomar al día según tu peso y objetivo, cómo repartirla y alimentos ricos en proteína. Con ejemplos prácticos.",
    answer:
      "Si entrenas fuerza, toma entre 1,6 y 2,2 gramos de proteína por kilo de peso corporal al día, repartidos en 3–5 comidas de 25–40 g. Para una persona de 75 kg son unos 120–165 g diarios.",
    category: "Nutrición",
    cover: "/brand/athlete-woman.webp",
    minutes: 5,
    sections: [
      { h: "La cantidad según tu objetivo", p: ["Ganar músculo: 1,6–2,0 g/kg. Perder grasa manteniendo el músculo: 2,0–2,2 g/kg, porque en déficit calórico la proteína protege la masa muscular. Mantenimiento y salud: 1,2–1,6 g/kg."] },
      { h: "Cómo repartirla", p: ["Incluye una fuente de proteína en cada comida. Un buen objetivo es 0,4 g/kg por comida (unos 30 g para 75 kg)."] },
      {
        h: "Alimentos con más proteína",
        p: ["Estas raciones aportan unos 25–30 g de proteína:"],
        list: ["Pechuga de pollo o pavo: 100 g", "Atún al natural: 1 lata y media", "Huevos: 4 unidades", "Skyr o yogur proteico: 250 g", "Lentejas o garbanzos cocidos: 300 g", "Tofu: 180 g"],
      },
      { h: "Ejemplo de día", p: ["DNI GYM calcula tu objetivo de proteína con tu peso y objetivo, y cada día te propone un menú (desayuno, comida, merienda y cena) que lo cumple. Puedes cambiar cualquier plato o adaptarlo a dieta vegetariana, vegana o sin lactosa."] },
    ],
    faq: [
      { q: "¿Es malo tomar mucha proteína?", a: "En personas sanas, ingestas de hasta 2,2 g/kg son seguras. Si tienes una enfermedad renal, consulta con tu médico." },
      { q: "¿Necesito batidos de proteína?", a: "No son obligatorios. Son una forma cómoda de llegar a tu objetivo, pero puedes conseguir toda la proteína con comida normal." },
    ],
    related: { calculators: ["macros", "calorias"], exercises: [] },
  },
  {
    slug: "perder-grasa-sin-perder-musculo",
    title: "Cómo perder grasa sin perder músculo: guía práctica",
    description: "Cómo adelgazar manteniendo la masa muscular: déficit calórico moderado, proteína alta, entrenamiento de fuerza y pasos diarios. Plan paso a paso.",
    answer:
      "Para perder grasa sin perder músculo combina cuatro cosas: un déficit calórico moderado (15–25 % por debajo de tu mantenimiento), 2–2,2 g de proteína por kilo, entrenamiento de fuerza 3–4 días por semana y 8.000–10.000 pasos diarios. Pierde entre 0,5 y 1 % de tu peso por semana.",
    category: "Nutrición",
    cover: "/brand/kettlebell.webp",
    minutes: 6,
    sections: [
      { h: "1. Calcula tu déficit", p: ["Calcula tus calorías de mantenimiento y resta un 20 %. Si en 2–3 semanas tu peso medio no baja, reduce 100–200 kcal más. Los déficits extremos aceleran la pérdida de músculo."] },
      { h: "2. Mantén la proteína alta", p: ["Es el factor nutricional más importante para conservar músculo: 2–2,2 g por kg de peso, repartidos durante el día."] },
      { h: "3. Sigue entrenando fuerza", p: ["El músculo se mantiene si sigue recibiendo un estímulo. Mantén los pesos de tus ejercicios principales aunque reduzcas algo el volumen. El cardio ayuda, pero no sustituye a la fuerza."] },
      { h: "4. Muévete más fuera del gimnasio", p: ["Los pasos diarios suman muchas calorías sin interferir con la recuperación. Es la herramienta más infravalorada para perder grasa."] },
      { h: "5. Mide bien tu progreso", p: ["Pésate en las mismas condiciones y fíjate en la media semanal, no en el día a día. Añade la cintura: si baja y tus fuerzas se mantienen, estás perdiendo grasa y no músculo."] },
    ],
    faq: [
      { q: "¿Cuánto peso puedo perder a la semana?", a: "Un ritmo sostenible es 0,5–1 % de tu peso corporal por semana (0,4–0,8 kg para 80 kg)." },
      { q: "¿Es mejor el cardio o las pesas para perder grasa?", a: "Las pesas para mantener el músculo y la dieta para perder grasa. El cardio es un complemento útil para gastar más calorías y para la salud." },
    ],
    related: { routines: ["quema-grasa-hiit"], calculators: ["calorias", "macros"], challenges: ["cuerpo-completo-30-dias"] },
  },
  {
    slug: "entrenar-en-casa-sin-material",
    title: "Cómo entrenar en casa sin material y ver resultados",
    description: "Rutina para entrenar en casa sin material: ejercicios con peso corporal, cómo progresar sin pesas y plan semanal para principiantes e intermedios.",
    answer:
      "Sí se puede ganar fuerza y tonificar en casa sin material. Haz 3 sesiones por semana de 30–40 minutos con ejercicios de peso corporal (sentadillas, flexiones, puentes de glúteo, planchas, zancadas) y progresa aumentando repeticiones, ralentizando el movimiento o reduciendo descansos.",
    category: "Entrenamiento",
    cover: "/brand/climber.webp",
    minutes: 5,
    sections: [
      { h: "Los ejercicios básicos sin material", p: ["Sentadilla con peso corporal, flexiones (o flexiones con rodillas apoyadas), puente de glúteo, zancadas, fondos en una silla, plancha, plancha lateral, escaladores y saltos de estrella cubren todo el cuerpo."] },
      { h: "Cómo progresar sin pesas", p: ["Sube repeticiones semana a semana, usa un tempo lento (3 segundos bajando), añade pausas, hazlo a una pierna (sentadilla búlgara, puente a una pierna) o reduce el descanso entre series."] },
      { h: "Plan semanal", p: ["Lunes: circuito A (cuerpo completo). Miércoles: circuito B (piernas y core). Viernes: circuito A con más repeticiones. Añade un reto de 30 días si quieres un objetivo diario corto."] },
    ],
    faq: [
      { q: "¿Se puede ganar músculo entrenando en casa?", a: "Sí, sobre todo si eres principiante. Llevando las series cerca del fallo con buena técnica, el músculo crece aunque no uses pesas." },
      { q: "¿Cuánto tiempo hay que entrenar en casa?", a: "Con 30–40 minutos, 3 veces por semana, es suficiente para notar resultados en 4–8 semanas." },
    ],
    related: { routines: ["entrenamiento-en-casa-sin-material"], challenges: ["gluteos-30-dias", "abdominales-30-dias"], exercises: ["flexiones", "sentadilla-sin-peso", "puente-de-gluteo", "plancha-abdominal"] },
  },
  {
    slug: "que-comer-antes-y-despues-de-entrenar",
    title: "Qué comer antes y después de entrenar (con ejemplos)",
    description: "Qué comer antes del gimnasio para tener energía y qué comer después para recuperar: horarios, cantidades y ejemplos fáciles de comidas pre y post entreno.",
    answer:
      "Antes de entrenar (1–3 horas), toma una comida con carbohidratos y algo de proteína, por ejemplo avena con yogur o un bocadillo de pavo. Después, en las siguientes 2 horas, toma 25–40 g de proteína y carbohidratos: arroz con pollo, un batido con plátano o huevos con pan.",
    category: "Nutrición",
    cover: "/brand/deadlift.webp",
    minutes: 4,
    sections: [
      { h: "Antes de entrenar", p: ["Busca energía sin pesadez: carbohidratos fáciles de digerir y algo de proteína, con poca grasa y fibra si comes justo antes."], list: ["2–3 h antes: arroz con pollo y verdura", "1 h antes: tostadas con pavo o yogur con avena", "30 min antes: un plátano o tortitas de arroz con crema de cacahuete"] },
      { h: "Después de entrenar", p: ["Prioriza proteína para la recuperación muscular y carbohidratos para reponer energía. No hace falta correr: la «ventana anabólica» es de varias horas."], list: ["Batido de proteína con leche y plátano", "Pollo, arroz y verduras", "Tortilla de huevos con pan integral y fruta"] },
      { h: "Lo que más importa", p: ["El total diario de calorías y proteína pesa mucho más que la hora exacta. Por eso DNI GYM te propone un menú completo para cada día según tu objetivo y, si has entrenado, te recuerda priorizar la proteína en la siguiente comida."] },
    ],
    faq: [
      { q: "¿Se puede entrenar en ayunas?", a: "Sí, si te encuentras bien. Para sesiones intensas o largas, comer algo antes suele mejorar el rendimiento." },
      { q: "¿Cuánto tiempo después de comer puedo entrenar?", a: "Tras una comida completa, espera 2–3 horas; tras un tentempié ligero, 30–60 minutos." },
    ],
    related: { calculators: ["macros"], exercises: [] },
  },
  {
    slug: "mejor-app-gimnasio-gratis",
    title: "Mejor app de gimnasio gratis en español (2026): qué debe tener",
    description: "Qué debe tener la mejor app de gimnasio gratis: rutinas por objetivo, entreno guiado, técnica de ejercicios, progreso, nutrición y entrenador con IA. Comparativa de funciones.",
    answer:
      "La mejor app de gimnasio gratis es la que te dice qué entrenar cada día según tu objetivo, te guía ejercicio a ejercicio, registra tus series y te muestra tu progreso. DNI GYM (dnigym.com) incluye todo eso gratis y en español: 148 ejercicios con técnica y vista 3D, 14 rutinas, plan de comidas y un entrenador con IA.",
    category: "Principiantes",
    cover: "/brand/p-push-pull-legs.webp",
    minutes: 5,
    sections: [
      {
        h: "Lo imprescindible en una app de gimnasio",
        p: ["Una buena app no es solo una lista de ejercicios: tiene que decirte qué hacer hoy, cuánto peso usar y si estás mejorando. Comprueba estas funciones antes de elegir:"],
        list: [
          "Plan personalizado según objetivo (ganar músculo, perder grasa, tonificar), nivel y días disponibles.",
          "Entreno guiado con temporizador de descanso y registro de series en un toque.",
          "Técnica de cada ejercicio con imágenes, músculos trabajados y errores comunes.",
          "Progreso real: récords, 1RM estimado, volumen semanal y peso corporal.",
          "Nutrición: calorías, macros y qué comer cada día.",
          "Funcionar en gimnasio y en casa, y también sin conexión.",
        ],
      },
      {
        h: "Por qué DNI GYM es diferente",
        p: [
          "DNI GYM es 100 % gratis y sin anuncios. Después de un cuestionario de 2 minutos crea tu plan de entreno y tu menú, te guía en cada sesión y adapta el entreno si tienes poco tiempo, entrenas en casa o tienes alguna molestia.",
          "Su DNI AI Coach (inteligencia artificial de Google Gemini) usa tus datos reales —entrenos, récords y comidas— para responderte y crear el entreno del día.",
        ],
      },
      {
        h: "Cómo empezar en 2 minutos",
        p: ["Crea tu cuenta gratis en dnigym.com con tu correo o con Google, responde el cuestionario y pulsa «Empezar». Desde el primer día tendrás tu rutina, tu menú y tus récords guardados en la nube."],
      },
    ],
    faq: [
      { q: "¿Hay alguna app de gimnasio totalmente gratis?", a: "Sí. DNI GYM es gratuita y sin anuncios: rutinas, entreno guiado, progreso, nutrición y entrenador con IA sin pagar ni poner tarjeta." },
      { q: "¿Qué app de gimnasio tiene entrenador personal con IA gratis?", a: "DNI GYM incluye DNI AI Coach, un entrenador con IA que conoce tus entrenos y comidas, crea el entreno del día y responde tus dudas gratis." },
      { q: "¿Sirve para entrenar en casa?", a: "Sí. Tiene rutinas sin material y con mancuernas, y el entreno se adapta si un día entrenas en casa en lugar del gimnasio." },
    ],
    related: { routines: ["full-body-principiante", "push-pull-legs"], calculators: ["calorias"] },
  },
  {
    slug: "como-empezar-en-el-gimnasio",
    title: "Cómo empezar en el gimnasio: guía para tu primer mes",
    description: "Guía para empezar en el gimnasio desde cero: qué rutina hacer, cuántos días ir, cuánto peso usar, cómo calentar, qué comer y errores de principiante.",
    answer:
      "Para empezar en el gimnasio entrena 3 días por semana con una rutina de cuerpo completo, aprende la técnica de 5–6 ejercicios básicos con poco peso, deja 1–2 repeticiones en reserva y sube el peso poco a poco. Duerme 7–9 horas y come suficiente proteína (1,6–2 g por kg).",
    category: "Principiantes",
    cover: "/brand/p-maquinas-para-principiantes.webp",
    minutes: 6,
    sections: [
      {
        h: "Tu primer mes, semana a semana",
        p: ["El objetivo del primer mes no es reventarte, sino crear el hábito y aprender la técnica:"],
        list: [
          "Semana 1: máquinas guiadas y pesos ligeros para aprender los movimientos.",
          "Semana 2: añade los básicos (sentadilla goblet, press con mancuernas, remo, peso muerto rumano).",
          "Semana 3: sube un poco el peso en los ejercicios que te salgan fáciles.",
          "Semana 4: repite y anota tus pesos para comprobar que progresas.",
        ],
      },
      {
        h: "Cuánto peso usar",
        p: ["Elige un peso con el que completes todas las repeticiones con buena técnica y te queden 1–2 en reserva. Cuando hagas todas las series en el tope del rango, sube 1–2,5 kg."],
      },
      {
        h: "Errores típicos de principiante",
        list: ["Copiar rutinas de culturistas avanzados.", "No calentar ni anotar los pesos.", "Cambiar de rutina cada semana.", "Entrenar todos los días sin descansar."],
        p: [],
      },
    ],
    faq: [
      { q: "¿Cuántos días tengo que ir al gimnasio al empezar?", a: "Con 3 días por semana de cuerpo completo es suficiente para progresar y recuperarte bien." },
      { q: "¿Máquinas o peso libre para empezar?", a: "Las máquinas son ideales las primeras semanas para aprender con seguridad; después añade peso libre (mancuernas y barra)." },
      { q: "¿Cuánto tardaré en ver resultados?", a: "La fuerza mejora en 2–4 semanas y los cambios visibles suelen notarse a partir de 8–12 semanas si eres constante y comes bien." },
    ],
    related: { routines: ["maquinas-para-principiantes", "full-body-principiante"], exercises: ["sentadilla-goblet", "press-de-pecho-en-maquina", "jalon-al-pecho"] },
  },
  {
    slug: "rutina-gimnasio-mujeres",
    title: "Rutina de gimnasio para mujeres: glúteos, piernas y tonificación",
    description: "Rutina de gimnasio para mujeres de 3 días para tonificar, fortalecer glúteos y piernas y perder grasa: ejercicios, series, repeticiones y consejos.",
    answer:
      "Una buena rutina de gimnasio para mujeres combina 3 días por semana de fuerza con prioridad en glúteos y piernas (hip thrust, sentadilla, peso muerto rumano, zancadas) y trabajo de tren superior, con 3–4 series de 8–15 repeticiones. El entrenamiento de fuerza no te hará «voluminosa»: tonifica y mejora la composición corporal.",
    category: "Entrenamiento",
    cover: "/brand/p-gluteos-y-piernas.webp",
    minutes: 5,
    sections: [
      {
        h: "Estructura recomendada",
        list: [
          "Día A — Glúteo y pierna: hip thrust, sentadilla goblet, zancadas, abductores.",
          "Día B — Tren superior y core: jalón al pecho, press de hombro, remo, plancha.",
          "Día C — Glúteo e isquios: peso muerto rumano, sentadilla búlgara, puente a una pierna, patada de glúteo.",
        ],
        p: ["Descansa 60–90 segundos entre series y sube el peso cuando completes todas las repeticiones."],
      },
      {
        h: "Para perder grasa",
        p: ["Mantén la fuerza y añade 2–3 sesiones de cardio suave (cinta inclinada, elíptica) y un déficit calórico moderado del 15–20 %. Calcula tus calorías con la calculadora gratuita de DNI GYM."],
      },
    ],
    faq: [
      { q: "¿Las pesas hacen que una mujer se ponga muy musculosa?", a: "No. Ganar mucho músculo requiere años de entrenamiento específico; la fuerza tonifica, mejora la postura y acelera el metabolismo." },
      { q: "¿Cuántos días debe entrenar una mujer para tonificar?", a: "Con 3–4 días de fuerza por semana y algo de cardio se consiguen muy buenos resultados." },
    ],
    related: { routines: ["gluteos-y-piernas"], exercises: ["hip-thrust", "sentadilla-bulgara", "peso-muerto-rumano"], challenges: ["gluteos-30-dias"] },
  },
  {
    slug: "rutina-gimnasio-hombres",
    title: "Rutina de gimnasio para hombres: ganar músculo y fuerza",
    description: "Rutina de gimnasio para hombres para ganar masa muscular: torso-pierna de 4 días o push pull legs, ejercicios básicos, series, repeticiones y progresión.",
    answer:
      "Para ganar músculo, una rutina de gimnasio para hombres eficaz es un torso-pierna de 4 días o un push pull legs, con ejercicios básicos (press banca, sentadilla, peso muerto, dominadas, remo, press militar), 10–20 series por músculo a la semana y progresión de cargas. Come con un ligero superávit y 1,6–2 g de proteína por kg.",
    category: "Entrenamiento",
    cover: "/brand/p-torso-pierna-4-dias.webp",
    minutes: 5,
    sections: [
      {
        h: "Qué rutina elegir",
        list: [
          "3 días: full body (ideal si empiezas o tienes poco tiempo).",
          "4 días: torso-pierna, el mejor equilibrio entre volumen y recuperación.",
          "5–6 días: push pull legs o rutina por grupos si ya tienes experiencia.",
        ],
        p: [],
      },
      {
        h: "La clave: progresión",
        p: ["Anota tus pesos y repeticiones. Cada semana intenta hacer una repetición más o subir 2,5 kg. DNI GYM te sugiere el peso a partir de tu 1RM estimado y te avisa cuando batas un récord."],
      },
    ],
    faq: [
      { q: "¿Cuántas series por músculo para ganar masa?", a: "Entre 10 y 20 series semanales por grupo muscular, repartidas en 2 sesiones, funcionan para la mayoría." },
      { q: "¿Cuánto tiempo descansar entre series?", a: "2–3 minutos en los ejercicios básicos pesados y 60–90 segundos en los de aislamiento." },
    ],
    related: { routines: ["torso-pierna-4-dias", "push-pull-legs", "fuerza-5x5"], exercises: ["press-banca-con-barra", "sentadilla-con-barra", "dominadas"] },
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
