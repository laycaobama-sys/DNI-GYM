// Descarga las imágenes (dominio público, free-exercise-db / Unlicense) de los
// ejercicios definidos en src/data/exercises.ts y las convierte a WebP.
// Uso: node scripts/fetch-exercise-images.mjs
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const main = await fs.readFile(path.join(root, "src/data/exercises.ts"), "utf8");
const extra = await fs.readFile(path.join(root, "src/data/exercises-extra.ts"), "utf8");
const ids = [
  ...[...main.matchAll(/src:\s*"([^"]+)"/g)].map((m) => m[1]),
  // filas compactas: [slug, nombre, grupo, src, ...]
  ...[...extra.matchAll(/^\s*\["[^"]+", "[^"]+", "(?:pecho|espalda|piernas|gluteos|hombros|biceps|triceps|abdomen|cardio)", "([^"]+)"/gm)].map((m) => m[1]),
];
const outDir = path.join(root, "public/ejercicios");
await fs.mkdir(outDir, { recursive: true });
const base = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

let ok = 0;
for (const id of ids) {
  for (const frame of [0, 1]) {
    const file = path.join(outDir, `${id}-${frame}.webp`);
    try {
      await fs.access(file);
      continue;
    } catch {}
    const res = await fetch(`${base}/${id}/${frame}.jpg`);
    if (!res.ok) {
      console.error("FALTA", id, frame, res.status);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 74 }).toFile(file);
    ok++;
  }
}
console.log(`${ids.length} ejercicios, ${ok} imágenes nuevas`);
