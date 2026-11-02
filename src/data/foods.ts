// Valores nutricionales aproximados por 100 g (o 100 ml) de alimento.
// Fuente: promedios de tablas de composición de alimentos (BEDCA / USDA). Orientativo.

export interface Food {
  id: string;
  name: string;
  category: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** ración típica en gramos */
  portion: number;
  portionLabel?: string;
}

type Row = [string, string, number, number, number, number, number, string?];

const ROWS: Row[] = [
  // Proteínas animales
  ["Pechuga de pollo (cocinada)", "Proteínas", 165, 31, 0, 3.6, 150],
  ["Muslo de pollo (cocinado)", "Proteínas", 209, 26, 0, 10.9, 150],
  ["Pechuga de pavo", "Proteínas", 135, 30, 0, 1, 150],
  ["Ternera magra (cocinada)", "Proteínas", 217, 26, 0, 12, 150],
  ["Carne picada de ternera 10%", "Proteínas", 176, 20, 0, 10, 150],
  ["Lomo de cerdo", "Proteínas", 143, 22, 0, 6, 150],
  ["Jamón serrano", "Proteínas", 241, 31, 0, 13, 40],
  ["Jamón cocido / York", "Proteínas", 107, 18, 1.5, 3, 50],
  ["Salmón", "Proteínas", 208, 20, 0, 13, 150],
  ["Atún al natural (lata)", "Proteínas", 116, 26, 0, 1, 80, "1 lata"],
  ["Atún en aceite (escurrido)", "Proteínas", 198, 29, 0, 8, 80, "1 lata"],
  ["Merluza", "Proteínas", 86, 17, 0, 1.8, 150],
  ["Bacalao", "Proteínas", 82, 18, 0, 0.7, 150],
  ["Gambas / langostinos", "Proteínas", 99, 24, 0.2, 0.3, 100],
  ["Sardinas en lata", "Proteínas", 208, 25, 0, 11, 80],
  ["Huevo entero", "Proteínas", 143, 12.6, 0.7, 9.5, 60, "1 huevo"],
  ["Clara de huevo", "Proteínas", 52, 11, 0.7, 0.2, 100],
  ["Proteína whey (polvo)", "Proteínas", 380, 78, 8, 5, 30, "1 scoop"],
  // Lácteos
  ["Leche entera", "Lácteos", 61, 3.2, 4.8, 3.3, 250, "1 vaso"],
  ["Leche semidesnatada", "Lácteos", 46, 3.3, 4.8, 1.6, 250, "1 vaso"],
  ["Leche desnatada", "Lácteos", 34, 3.4, 5, 0.1, 250, "1 vaso"],
  ["Bebida de avena", "Lácteos", 45, 1, 6.5, 1.5, 250, "1 vaso"],
  ["Yogur natural", "Lácteos", 61, 3.5, 4.7, 3.3, 125, "1 yogur"],
  ["Yogur griego", "Lácteos", 115, 6, 4, 9, 125, "1 yogur"],
  ["Yogur proteico / skyr", "Lácteos", 63, 11, 4, 0.2, 150],
  ["Queso fresco batido 0%", "Lácteos", 46, 8, 3.5, 0.2, 200],
  ["Queso fresco", "Lácteos", 174, 12, 3, 13, 60],
  ["Queso curado", "Lácteos", 400, 26, 0.5, 33, 30],
  ["Mozzarella", "Lácteos", 280, 22, 2.2, 20, 60],
  ["Requesón / cottage", "Lácteos", 98, 11, 3.4, 4.3, 100],
  // Cereales y tubérculos
  ["Arroz blanco (cocido)", "Carbohidratos", 130, 2.7, 28, 0.3, 200],
  ["Arroz integral (cocido)", "Carbohidratos", 123, 2.7, 25.6, 1, 200],
  ["Arroz (crudo)", "Carbohidratos", 360, 7, 79, 0.6, 80],
  ["Pasta (cocida)", "Carbohidratos", 158, 5.8, 31, 0.9, 200],
  ["Pasta (cruda)", "Carbohidratos", 359, 12.5, 72, 1.5, 80],
  ["Pan blanco", "Carbohidratos", 265, 9, 49, 3.2, 60],
  ["Pan integral", "Carbohidratos", 247, 13, 41, 3.4, 60],
  ["Copos de avena", "Carbohidratos", 379, 13, 67, 6.5, 50],
  ["Patata (cocida)", "Carbohidratos", 87, 1.9, 20, 0.1, 200],
  ["Boniato (asado)", "Carbohidratos", 90, 2, 21, 0.2, 200],
  ["Quinoa (cocida)", "Carbohidratos", 120, 4.4, 21, 1.9, 180],
  ["Cuscús (cocido)", "Carbohidratos", 112, 3.8, 23, 0.2, 180],
  ["Tortitas de arroz", "Carbohidratos", 387, 8, 81, 2.8, 20, "2 tortitas"],
  ["Cereales de desayuno", "Carbohidratos", 379, 7, 84, 1, 40],
  ["Tortilla de trigo (wrap)", "Carbohidratos", 312, 8, 52, 8, 60, "1 wrap"],
  // Legumbres
  ["Lentejas (cocidas)", "Legumbres", 116, 9, 20, 0.4, 200],
  ["Garbanzos (cocidos)", "Legumbres", 164, 8.9, 27, 2.6, 200],
  ["Alubias (cocidas)", "Legumbres", 127, 8.7, 22.8, 0.5, 200],
  ["Tofu", "Legumbres", 144, 15.5, 2.8, 8.7, 125],
  ["Edamame", "Legumbres", 121, 11.9, 8.9, 5.2, 100],
  ["Soja texturizada", "Legumbres", 330, 50, 30, 1, 50],
  // Frutas
  ["Plátano", "Frutas", 89, 1.1, 23, 0.3, 120, "1 plátano"],
  ["Manzana", "Frutas", 52, 0.3, 14, 0.2, 180, "1 manzana"],
  ["Naranja", "Frutas", 47, 0.9, 12, 0.1, 180, "1 naranja"],
  ["Fresas", "Frutas", 32, 0.7, 7.7, 0.3, 150],
  ["Arándanos", "Frutas", 57, 0.7, 14.5, 0.3, 100],
  ["Uvas", "Frutas", 69, 0.7, 18, 0.2, 150],
  ["Pera", "Frutas", 57, 0.4, 15, 0.1, 180],
  ["Kiwi", "Frutas", 61, 1.1, 15, 0.5, 90, "1 kiwi"],
  ["Piña", "Frutas", 50, 0.5, 13, 0.1, 150],
  ["Sandía", "Frutas", 30, 0.6, 7.6, 0.2, 300],
  ["Mango", "Frutas", 60, 0.8, 15, 0.4, 150],
  ["Dátiles", "Frutas", 282, 2.5, 75, 0.4, 30],
  // Verduras
  ["Brócoli", "Verduras", 34, 2.8, 7, 0.4, 150],
  ["Espinacas", "Verduras", 23, 2.9, 3.6, 0.4, 100],
  ["Lechuga / ensalada verde", "Verduras", 15, 1.4, 2.9, 0.2, 100],
  ["Tomate", "Verduras", 18, 0.9, 3.9, 0.2, 150],
  ["Pepino", "Verduras", 15, 0.7, 3.6, 0.1, 150],
  ["Zanahoria", "Verduras", 41, 0.9, 10, 0.2, 100],
  ["Pimiento", "Verduras", 26, 1, 6, 0.3, 150],
  ["Calabacín", "Verduras", 17, 1.2, 3.1, 0.3, 200],
  ["Cebolla", "Verduras", 40, 1.1, 9.3, 0.1, 80],
  ["Champiñones", "Verduras", 22, 3.1, 3.3, 0.3, 150],
  ["Judías verdes", "Verduras", 31, 1.8, 7, 0.2, 150],
  ["Coliflor", "Verduras", 25, 1.9, 5, 0.3, 150],
  ["Espárragos", "Verduras", 20, 2.2, 3.9, 0.1, 150],
  // Grasas y frutos secos
  ["Aceite de oliva", "Grasas", 884, 0, 0, 100, 10, "1 cucharada"],
  ["Aguacate", "Grasas", 160, 2, 8.5, 14.7, 100, "1/2 aguacate"],
  ["Almendras", "Grasas", 579, 21, 22, 50, 30, "1 puñado"],
  ["Nueces", "Grasas", 654, 15, 14, 65, 30, "1 puñado"],
  ["Cacahuetes", "Grasas", 567, 26, 16, 49, 30, "1 puñado"],
  ["Crema de cacahuete", "Grasas", 588, 25, 20, 50, 15, "1 cucharada"],
  ["Mantequilla", "Grasas", 717, 0.9, 0.1, 81, 10],
  ["Aceitunas", "Grasas", 145, 1, 3.8, 15, 30],
  ["Chocolate negro 85%", "Grasas", 600, 10, 20, 50, 20, "2 onzas"],
  ["Semillas de chía", "Grasas", 486, 17, 42, 31, 15],
  // Otros / platos
  ["Pizza (media)", "Platos", 266, 11, 33, 10, 300],
  ["Hamburguesa con pan", "Platos", 254, 13, 30, 9, 220],
  ["Tortilla de patatas", "Platos", 190, 6.5, 13, 12.5, 150, "1 pincho"],
  ["Paella", "Platos", 160, 7, 22, 4.5, 300],
  ["Ensalada César", "Platos", 190, 8, 8, 14, 250],
  ["Sushi (pieza)", "Platos", 150, 6, 28, 1.5, 200, "6 piezas"],
  ["Croissant", "Platos", 406, 8, 46, 21, 60],
  ["Galletas", "Platos", 480, 6, 66, 21, 30],
  ["Patatas fritas (bolsa)", "Platos", 536, 7, 53, 34, 40],
  // Bebidas
  ["Zumo de naranja", "Bebidas", 45, 0.7, 10.4, 0.2, 250, "1 vaso"],
  ["Refresco azucarado", "Bebidas", 42, 0, 10.6, 0, 330, "1 lata"],
  ["Cerveza", "Bebidas", 43, 0.5, 3.6, 0, 330, "1 caña/lata"],
  ["Vino tinto", "Bebidas", 85, 0.1, 2.6, 0, 150, "1 copa"],
  ["Café con leche", "Bebidas", 30, 1.7, 2.5, 1.5, 200, "1 taza"],
  ["Batido de proteínas con leche", "Bebidas", 90, 12, 6, 2, 300],
  ["Miel", "Otros", 304, 0.3, 82, 0, 15, "1 cucharada"],
  ["Azúcar", "Otros", 387, 0, 100, 0, 8, "1 sobre"],
  ["Mermelada", "Otros", 250, 0.4, 60, 0.1, 20],
  ["Hummus", "Otros", 166, 8, 14, 9.6, 50],
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const FOODS: Food[] = ROWS.map(([name, category, kcal, protein, carbs, fat, portion, portionLabel]) => ({
  id: slugify(name),
  name,
  category,
  kcal,
  protein,
  carbs,
  fat,
  portion,
  portionLabel,
}));

export const FOOD_CATEGORIES = Array.from(new Set(FOODS.map((f) => f.category)));
