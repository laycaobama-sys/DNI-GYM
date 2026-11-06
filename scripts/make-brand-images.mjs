// Genera las imágenes editoriales (monocromo, alto contraste) de /public/brand
// a partir de las fotos de dominio público de /public/ejercicios.
// Uso: node scripts/make-brand-images.mjs
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
import fs from "node:fs";
// Fuente: foto original en alta resolución (ORIG_DIR, descargada de free-exercise-db) o, si no, el webp publicado.
const ORIG = process.env.ORIG_DIR;
const src = (n) => (ORIG && fs.existsSync(path.join(ORIG, `${n}.jpg`)) ? path.join(ORIG, `${n}.jpg`) : path.join(root, "public/ejercicios", `${n}.webp`));
const out = (n) => path.join(root, "public/brand", `${n}.webp`);

// [salida, origen, ancho, alto, posición del recorte]
const JOBS = [
  ["hero", "Split_Squat_with_Dumbbells-1", 850, 1040, "center"],
  ["hero-wide", "Inchworm-1", 1600, 900, "center"],
  ["athlete-woman", "Pallof_Press-1", 800, 1000, "center"],
  ["jump", "Star_Jump-1", 800, 1000, "center"],
  ["climber", "Mountain_Climbers-0", 1000, 700, "center"],
  ["deadlift", "Sumo_Deadlift-1", 800, 1000, "right"],
  ["kettlebell", "Kettlebell_Thruster-1", 800, 1000, "center"],
  // grupos musculares
  ["g-pecho", "Dumbbell_Flyes-1", 700, 875, "center"],
  ["g-espalda", "Chin-Up-1", 700, 875, "center"],
  ["g-piernas", "Barbell_Full_Squat-1", 700, 875, "right"],
  ["g-gluteos", "Barbell_Hip_Thrust-1", 700, 875, "center"],
  ["g-hombros", "Arnold_Dumbbell_Press-1", 700, 875, "center"],
  ["g-biceps", "Preacher_Curl-1", 700, 875, "center"],
  ["g-triceps", "Dips_-_Triceps_Version-0", 700, 875, "center"],
  ["g-abdomen", "Hanging_Leg_Raise-1", 700, 875, "center"],
  ["g-cardio", "Star_Jump-1", 700, 875, "center"],
  // retos y programas
  ["c-abdomen", "Plank-0", 900, 600, "center"],
  ["c-gluteos", "Butt_Lift_Bridge-1", 900, 600, "center"],
  ["c-flexiones", "Pushups-1", 900, 600, "center"],
  ["c-fullbody", "Freehand_Jump_Squat-0", 900, 600, "center"],
  ["p-full-body-principiante", "Goblet_Squat-1", 900, 600, "center"],
  ["p-torso-pierna-4-dias", "Barbell_Bench_Press_-_Medium_Grip-1", 900, 600, "center"],
  ["p-push-pull-legs", "Barbell_Deadlift-1", 900, 600, "center"],
  ["p-gluteos-y-piernas", "Barbell_Hip_Thrust-0", 900, 600, "center"],
  ["p-entrenamiento-en-casa-sin-material", "Mountain_Climbers-1", 900, 600, "center"],
  ["p-quema-grasa-hiit", "One-Arm_Kettlebell_Swings-1", 900, 600, "center"],
  ["p-fuerza-5x5", "Barbell_Full_Squat-1", 900, 600, "center"],
  ["p-rutina-5-dias-por-grupos", "Decline_Barbell_Bench_Press-1", 900, 600, "center"],
  ["p-casa-con-mancuernas", "Dumbbell_Squat-1", 900, 600, "center"],
  ["p-maquinas-para-principiantes", "Machine_Bench_Press-1", 900, 600, "center"],
  ["p-express-30-minutos", "Battling_Ropes-1", 900, 600, "center"],
  ["p-abdomen-y-core", "Jackknife_Sit-Up-1", 900, 600, "center"],
  ["p-brazos-y-hombros", "EZ-Bar_Curl-1", 900, 600, "center"],
  ["p-salud-y-movilidad-50", "Elliptical_Trainer-1", 900, 600, "center"],
];

for (const [name, from, w0, h0, pos] of JOBS) {
  // nunca ampliar: si la foto es más pequeña que el recorte pedido, se reduce el recorte manteniendo la proporción
  const meta = await sharp(src(from)).metadata();
  const k = Math.min(1, meta.width / w0, meta.height / h0) < 1 ? Math.max(meta.width / w0, meta.height / h0) > 1 ? Math.min(meta.width / w0, meta.height / h0) : Math.min(meta.width / w0, meta.height / h0) : 1;
  const w = Math.round(w0 * Math.min(1, k)), h = Math.round(h0 * Math.min(1, k));
  await sharp(src(from))
    .resize(w, h, { fit: "cover", position: pos })
    .sharpen({ sigma: 0.7 })
    .grayscale()
    .linear(1.35, -38)
    .modulate({ brightness: 0.92 })
    .webp({ quality: 82 })
    .toFile(out(name));
}
console.log(`${JOBS.length} imágenes generadas en public/brand`);
