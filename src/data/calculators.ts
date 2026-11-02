import type { CalculatorKind } from "@/components/calculators";

export interface CalculatorPage {
  slug: CalculatorKind;
  name: string;
  title: string;
  description: string;
  intro: string;
  explain: { h: string; p: string }[];
  faq: { q: string; a: string }[];
}

export const CALCULATORS: CalculatorPage[] = [
  {
    slug: "calorias",
    name: "Calculadora de calorías",
    title: "Calculadora de calorías diarias (TDEE) para perder grasa o ganar músculo",
    description:
      "Calcula gratis cuántas calorías necesitas al día según tu sexo, edad, peso, altura y actividad física. Obtén tu metabolismo basal, mantenimiento (TDEE) y calorías para adelgazar o ganar masa muscular.",
    intro: "Descubre cuántas calorías gastas al día y cuántas debes comer para alcanzar tu objetivo.",
    explain: [
      { h: "¿Cómo se calcula?", p: "Usamos la ecuación de Mifflin-St Jeor, la más precisa en población general, para estimar tu metabolismo basal (las calorías que gastas en reposo). Después la multiplicamos por un factor de actividad para obtener tu gasto energético total diario (TDEE)." },
      { h: "Calorías para perder grasa", p: "Un déficit moderado del 15–25% sobre tu mantenimiento permite perder entre 0,5 y 1% de tu peso por semana conservando la masa muscular, siempre que entrenes fuerza y comas suficiente proteína." },
      { h: "Calorías para ganar músculo", p: "Un superávit pequeño (5–10%) es suficiente para ganar músculo minimizando la grasa. Ganar más de 0,25–0,5% del peso corporal por semana suele traducirse en más grasa, no en más músculo." },
    ],
    faq: [
      { q: "¿Cuántas calorías debo comer para adelgazar?", a: "Como punto de partida, resta un 20% a tus calorías de mantenimiento. Si en 2–3 semanas tu peso medio no baja, reduce 100–200 kcal más." },
      { q: "¿Es exacta la calculadora?", a: "Es una estimación con un margen de error de ±10%. Úsala como punto de partida y ajusta según la evolución real de tu peso, que puedes registrar en DNI GYM." },
      { q: "¿Qué nivel de actividad elijo?", a: "Si trabajas sentado y entrenas 3–4 días por semana, «Moderado» suele ser adecuado. Ante la duda, elige el nivel inferior." },
    ],
  },
  {
    slug: "macros",
    name: "Calculadora de macros",
    title: "Calculadora de macros: proteína, carbohidratos y grasas para tu objetivo",
    description:
      "Calcula gratis tus macronutrientes diarios: gramos de proteína, carbohidratos y grasas según tu peso, actividad y objetivo (definición, volumen o mantenimiento).",
    intro: "Reparte tus calorías en proteína, carbohidratos y grasas de forma óptima para tu objetivo.",
    explain: [
      { h: "Proteína", p: "Fijamos la proteína entre 1,8 y 2,2 g por kg de peso corporal: más alta en definición para proteger el músculo, y suficiente en volumen para maximizar la ganancia muscular." },
      { h: "Grasas", p: "Las grasas suponen alrededor del 25% de las calorías (mínimo 0,7 g/kg) para mantener una buena salud hormonal." },
      { h: "Carbohidratos", p: "El resto de calorías se asigna a carbohidratos, la principal fuente de energía para entrenar con intensidad." },
    ],
    faq: [
      { q: "¿Cuánta proteína necesito para ganar músculo?", a: "La evidencia científica sitúa el óptimo entre 1,6 y 2,2 g de proteína por kg de peso corporal al día, repartidos en 3–5 comidas." },
      { q: "¿Tengo que contar macros para siempre?", a: "No. Contar durante unas semanas te enseña a estimar raciones. Después puedes registrar solo de forma ocasional." },
      { q: "¿Puedo comer carbohidratos por la noche?", a: "Sí. Lo importante es el total diario de calorías y macros, no la hora a la que los comes." },
    ],
  },
  {
    slug: "imc",
    name: "Calculadora de IMC",
    title: "Calculadora de IMC (índice de masa corporal) y peso saludable",
    description: "Calcula tu índice de masa corporal (IMC) gratis, conoce tu clasificación según la OMS y el rango de peso saludable para tu altura.",
    intro: "Calcula tu índice de masa corporal y el rango de peso saludable para tu altura.",
    explain: [
      { h: "¿Qué es el IMC?", p: "El índice de masa corporal es el peso en kilos dividido entre la altura en metros al cuadrado. Es una referencia rápida usada por la OMS para clasificar el peso." },
      { h: "Limitaciones", p: "El IMC no distingue entre masa muscular y grasa. Una persona musculada puede tener un IMC de «sobrepeso» con un porcentaje de grasa bajo. Complétalo con el perímetro de cintura y tu evolución." },
    ],
    faq: [
      { q: "¿Cuál es un IMC normal?", a: "Según la OMS, entre 18,5 y 24,9 se considera peso normal; de 25 a 29,9 sobrepeso y a partir de 30 obesidad." },
      { q: "¿Sirve el IMC si hago musculación?", a: "Solo como referencia orientativa. Es mejor seguir la evolución de tu peso, medidas y fuerza, algo que puedes hacer en DNI GYM." },
    ],
  },
  {
    slug: "1rm",
    name: "Calculadora de 1RM",
    title: "Calculadora de 1RM: calcula tu repetición máxima y porcentajes de carga",
    description: "Calcula tu repetición máxima (1RM) en press de banca, sentadilla o peso muerto sin arriesgarte, a partir del peso y las repeticiones que haces. Incluye tabla de porcentajes.",
    intro: "Estima tu repetición máxima a partir de una serie submáxima y obtén tus cargas de entrenamiento.",
    explain: [
      { h: "¿Qué es el 1RM?", p: "Es el peso máximo que puedes levantar en una sola repetición con buena técnica. Sirve para programar el entrenamiento por porcentajes y medir tu progreso de fuerza." },
      { h: "Fórmula de Epley", p: "1RM = peso × (1 + repeticiones / 30). Es más fiable con series de 2 a 10 repeticiones llevadas cerca del fallo técnico." },
    ],
    faq: [
      { q: "¿Es seguro probar mi 1RM real?", a: "Puede serlo con experiencia, calentamiento y ayudante, pero estimarlo con una serie de 3–6 repeticiones es mucho más seguro y suficientemente preciso." },
      { q: "¿DNI GYM calcula el 1RM automáticamente?", a: "Sí. Cada vez que registras una serie, la app calcula tu 1RM estimado y te muestra su evolución y tus récords personales." },
    ],
  },
];

export const getCalculator = (slug: string) => CALCULATORS.find((c) => c.slug === slug);
