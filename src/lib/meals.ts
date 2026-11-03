// Generador del menú diario de DNI GYM.
// Combina platos reales con los alimentos de la base de datos y ajusta las cantidades
// a las calorías y la proteína objetivo de cada cliente según su perfil.

import { FOODS, type Food } from "@/data/foods";
import type { FoodEntry, Meal, UserProfile } from "./types";
import { uid as newId } from "./fitness";

export type Diet = "omnivora" | "vegetariana" | "vegana" | "sin-lactosa";

export const DIET_LABELS: Record<Diet, string> = {
  omnivora: "Como de todo",
  vegetariana: "Vegetariana",
  vegana: "Vegana",
  "sin-lactosa": "Sin lactosa",
};

type Slot = Exclude<Meal, "snack">;

interface Template {
  id: string;
  slot: Slot;
  name: string;
  /** [id de alimento, gramos base] */
  items: [string, number][];
  /** apta para vegetarianos */
  veg?: boolean;
  /** apta para veganos */
  vegan?: boolean;
  /** contiene lactosa */
  lactose?: boolean;
  /** consejo breve */
  tip?: string;
}

const T: Template[] = [
  // ── Desayunos ──
  { id: "d-avena", slot: "desayuno", name: "Avena con leche, plátano y almendras", items: [["copos-de-avena", 60], ["leche-semidesnatada", 250], ["platano", 120], ["almendras", 15]], veg: true, lactose: true, tip: "Carbohidratos de absorción lenta para tener energía toda la mañana." },
  { id: "d-huevos", slot: "desayuno", name: "Tostadas integrales con huevos, aguacate y tomate", items: [["pan-integral", 80], ["huevo-entero", 120], ["aguacate", 50], ["tomate", 100]], veg: true },
  { id: "d-skyr", slot: "desayuno", name: "Skyr con arándanos, avena y nueces", items: [["yogur-proteico-skyr", 200], ["arandanos", 100], ["copos-de-avena", 40], ["nueces", 15]], veg: true, lactose: true, tip: "Mucha proteína y poca grasa: ideal si buscas definir." },
  { id: "d-pavo", slot: "desayuno", name: "Tostadas con pavo, queso fresco y kiwi", items: [["pan-integral", 80], ["pechuga-de-pavo", 60], ["queso-fresco", 40], ["kiwi", 90]], lactose: true },
  { id: "d-porridge", slot: "desayuno", name: "Porridge de avena con plátano y crema de cacahuete", items: [["copos-de-avena", 60], ["bebida-de-avena", 250], ["platano", 120], ["crema-de-cacahuete", 15]], veg: true, vegan: true },
  { id: "d-hummus", slot: "desayuno", name: "Tostadas con hummus y tomate + naranja", items: [["pan-integral", 80], ["hummus", 50], ["tomate", 100], ["naranja", 180]], veg: true, vegan: true },
  { id: "d-claras", slot: "desayuno", name: "Tortilla de claras con pan integral y fresas", items: [["clara-de-huevo", 200], ["huevo-entero", 60], ["pan-integral", 60], ["fresas", 150]], veg: true },
  // ── Comidas ──
  { id: "c-pollo", slot: "comida", name: "Pollo a la plancha con arroz y brócoli", items: [["pechuga-de-pollo-cocinada", 160], ["arroz-blanco-cocido", 200], ["brocoli", 150], ["aceite-de-oliva", 10]], tip: "El clásico del gimnasio: proteína magra + carbohidrato + verdura." },
  { id: "c-salmon", slot: "comida", name: "Salmón con patata asada y ensalada", items: [["salmon", 150], ["patata-cocida", 250], ["lechuga-ensalada-verde", 100], ["aceite-de-oliva", 10]], tip: "Omega-3 para la recuperación muscular." },
  { id: "c-lentejas", slot: "comida", name: "Lentejas estofadas con verduras", items: [["lentejas-cocidas", 300], ["zanahoria", 100], ["cebolla", 50], ["pimiento", 80], ["aceite-de-oliva", 10]], veg: true, vegan: true },
  { id: "c-pasta", slot: "comida", name: "Pasta integral con atún y tomate", items: [["pasta-cocida", 220], ["atun-al-natural-lata", 80], ["tomate", 150], ["aceite-de-oliva", 10]] },
  { id: "c-ternera", slot: "comida", name: "Ternera con quinoa y calabacín", items: [["ternera-magra-cocinada", 150], ["quinoa-cocida", 180], ["calabacin", 150], ["aceite-de-oliva", 10]], tip: "Hierro y proteína completa para ganar fuerza." },
  { id: "c-tofu", slot: "comida", name: "Tofu salteado con arroz integral y judías verdes", items: [["tofu", 180], ["arroz-integral-cocido", 200], ["judias-verdes", 150], ["aceite-de-oliva", 10]], veg: true, vegan: true },
  { id: "c-garbanzos", slot: "comida", name: "Garbanzos con espinacas y huevo", items: [["garbanzos-cocidos", 250], ["espinacas", 100], ["huevo-entero", 60], ["aceite-de-oliva", 10]], veg: true },
  { id: "c-merluza", slot: "comida", name: "Merluza con boniato y espárragos", items: [["merluza", 180], ["boniato-asado", 200], ["esparragos", 150], ["aceite-de-oliva", 10]] },
  // ── Meriendas ──
  { id: "m-griego", slot: "merienda", name: "Yogur griego con nueces y manzana", items: [["yogur-griego", 125], ["nueces", 15], ["manzana", 180]], veg: true, lactose: true },
  { id: "m-tortitas", slot: "merienda", name: "Tortitas de arroz con crema de cacahuete y plátano", items: [["tortitas-de-arroz", 20], ["crema-de-cacahuete", 15], ["platano", 120]], veg: true, vegan: true, tip: "Perfecta 60–90 minutos antes de entrenar." },
  { id: "m-batido", slot: "merienda", name: "Batido de proteína con leche y plátano", items: [["proteina-whey-polvo", 30], ["leche-semidesnatada", 250], ["platano", 120]], veg: true, lactose: true, tip: "Ideal después de entrenar." },
  { id: "m-requeson", slot: "merienda", name: "Requesón con fresas", items: [["requeson-cottage", 150], ["fresas", 150]], veg: true, lactose: true },
  { id: "m-hummus", slot: "merienda", name: "Hummus con bastones de zanahoria y tortitas", items: [["hummus", 60], ["zanahoria", 120], ["tortitas-de-arroz", 20]], veg: true, vegan: true },
  { id: "m-bocata", slot: "merienda", name: "Mini bocadillo de jamón serrano con tomate", items: [["pan-integral", 60], ["jamon-serrano", 30], ["tomate", 50]] },
  { id: "m-edamame", slot: "merienda", name: "Edamame y una naranja", items: [["edamame", 120], ["naranja", 180]], veg: true, vegan: true },
  // ── Cenas ──
  { id: "n-tortilla", slot: "cena", name: "Tortilla francesa con ensalada y pan", items: [["huevo-entero", 120], ["lechuga-ensalada-verde", 150], ["tomate", 100], ["pan-integral", 50], ["aceite-de-oliva", 10]], veg: true },
  { id: "n-pavo", slot: "cena", name: "Pavo a la plancha con calabacín y boniato", items: [["pechuga-de-pavo", 150], ["calabacin", 200], ["boniato-asado", 150], ["aceite-de-oliva", 10]] },
  { id: "n-merluza", slot: "cena", name: "Merluza con judías verdes y patata", items: [["merluza", 200], ["judias-verdes", 200], ["patata-cocida", 150], ["aceite-de-oliva", 10]], tip: "Cena ligera y alta en proteína para dormir mejor." },
  { id: "n-tofu", slot: "cena", name: "Revuelto de tofu con champiñones, espinacas y pan", items: [["tofu", 200], ["champinones", 150], ["espinacas", 100], ["pan-integral", 50], ["aceite-de-oliva", 10]], veg: true, vegan: true },
  { id: "n-ensalada", slot: "cena", name: "Ensalada de atún, garbanzos y tomate", items: [["atun-al-natural-lata", 80], ["garbanzos-cocidos", 150], ["lechuga-ensalada-verde", 100], ["tomate", 100], ["aceite-de-oliva", 10]] },
  { id: "n-salmon", slot: "cena", name: "Salmón con espárragos y quinoa", items: [["salmon", 130], ["esparragos", 150], ["quinoa-cocida", 120]] },
  { id: "n-wrap", slot: "cena", name: "Wrap de pollo con lechuga, tomate y queso fresco", items: [["tortilla-de-trigo-wrap", 60], ["pechuga-de-pollo-cocinada", 120], ["lechuga-ensalada-verde", 50], ["tomate", 80], ["queso-fresco", 30]], lactose: true },
  { id: "n-crema", slot: "cena", name: "Crema de calabacín con huevo duro y pan", items: [["calabacin", 300], ["cebolla", 50], ["huevo-entero", 120], ["pan-integral", 40], ["aceite-de-oliva", 10]], veg: true },
];

const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

/** reparto de calorías por comida */
const SPLIT: Record<Slot, number> = { desayuno: 0.25, comida: 0.35, merienda: 0.13, cena: 0.27 };
export const SLOTS: { id: Slot; label: string; time: string }[] = [
  { id: "desayuno", label: "Desayuno", time: "08:00" },
  { id: "comida", label: "Comida", time: "14:00" },
  { id: "merienda", label: "Merienda", time: "17:30" },
  { id: "cena", label: "Cena", time: "21:00" },
];

export interface PlannedMeal {
  slot: Slot;
  label: string;
  time: string;
  templateId: string;
  name: string;
  tip?: string;
  entries: Omit<FoodEntry, "id">[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function allowed(t: Template, diet: Diet) {
  if (diet === "vegana") return t.vegan;
  if (diet === "vegetariana") return t.veg;
  if (diet === "sin-lactosa") return !t.lactose;
  return true;
}

function round5(n: number) {
  return Math.max(5, Math.round(n / 5) * 5);
}

function buildMeal(t: Template, targetKcal: number): PlannedMeal {
  const base = t.items.map(([id, g]) => ({ f: FOOD_BY_ID[id], g })).filter((x) => x.f);
  const baseKcal = base.reduce((a, x) => a + (x.f.kcal * x.g) / 100, 0);
  const factor = Math.min(1.9, Math.max(0.6, targetKcal / Math.max(1, baseKcal)));
  const slot = SLOTS.find((s) => s.id === t.slot)!;
  const entries = base.map(({ f, g }) => {
    // el aceite y las grasas no se escalan tanto para no disparar las calorías
    const k = f.category === "Grasas" ? Math.min(factor, 1.2) : factor;
    const grams = round5(g * k);
    const m = grams / 100;
    return {
      foodId: f.id,
      name: f.name,
      grams,
      kcal: Math.round(f.kcal * m),
      protein: Math.round(f.protein * m * 10) / 10,
      carbs: Math.round(f.carbs * m * 10) / 10,
      fat: Math.round(f.fat * m * 10) / 10,
      meal: t.slot as Meal,
    };
  });
  const sum = (k: "kcal" | "protein" | "carbs" | "fat") => Math.round(entries.reduce((a, e) => a + e[k], 0));
  return { slot: t.slot, label: slot.label, time: slot.time, templateId: t.id, name: t.name, tip: t.tip, entries, kcal: sum("kcal"), protein: sum("protein"), carbs: sum("carbs"), fat: sum("fat") };
}

/**
 * Menú del día: determinista por usuario y fecha (cada día cambia) y
 * `shuffle` permite pedir otra opción para una comida concreta.
 */
export function dailyMealPlan(profile: Partial<UserProfile> | null | undefined, date: string, shuffle: Partial<Record<Slot, number>> = {}) {
  const diet = (profile?.diet as Diet) ?? "omnivora";
  const kcal = profile?.calorieGoal ?? 2000;
  const seedBase = `${profile?.uid ?? "anon"}:${date}`;
  const meals = SLOTS.map(({ id }) => {
    let pool = T.filter((t) => t.slot === id && allowed(t, diet));
    if (!pool.length) pool = T.filter((t) => t.slot === id);
    // objetivo: prioriza platos más proteicos cuando se busca perder grasa
    if (profile?.goal === "perder") pool = [...pool].sort((a, b) => (b.tip ? 1 : 0) - (a.tip ? 1 : 0));
    const idx = (hash(seedBase + id) + (shuffle[id] ?? 0)) % pool.length;
    return buildMeal(pool[idx], kcal * SPLIT[id]);
  });
  const totals = meals.reduce((a, m) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  return { meals, totals, diet };
}

export function mealToEntries(m: PlannedMeal): FoodEntry[] {
  return m.entries.map((e) => ({ ...e, id: newId() }));
}

export function nutritionTip(profile: Partial<UserProfile> | null | undefined, trainedToday: boolean) {
  const goal = profile?.goal;
  if (trainedToday) return "Hoy has entrenado: prioriza proteína y carbohidratos en la siguiente comida para recuperar.";
  if (goal === "perder") return "Para perder grasa: llena medio plato de verdura, no te saltes la proteína y bebe agua antes de comer.";
  if (goal === "ganar") return "Para ganar músculo: reparte la proteína en 4 comidas y no temas a los carbohidratos alrededor del entreno.";
  return "Para mantenerte: comida real, proteína en cada plato y 2–3 piezas de fruta al día.";
}
