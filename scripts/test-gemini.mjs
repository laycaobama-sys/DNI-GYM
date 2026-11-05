// Comprueba la conexión con Google Gemini sin exponer la clave.
// Uso:
//   GEMINI_API_KEY=... node scripts/test-gemini.mjs            → valida la clave y el modelo (gratis: solo lista modelos)
//   GEMINI_API_KEY=... node scripts/test-gemini.mjs --generate → además genera una frase corta (consume una petición de IA)
import { GoogleGenAI } from "@google/genai";

const key = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
if (!key) {
  console.error("✘ Falta la variable de entorno GEMINI_API_KEY.");
  process.exit(1);
}
console.log(`• GEMINI_API_KEY presente (${key.length} caracteres, no se muestra). Modelo: ${model}`);

const ai = new GoogleGenAI({ apiKey: key });
try {
  const names = [];
  const pager = await ai.models.list({ config: { pageSize: 100 } });
  for await (const m of pager) names.push(m.name?.replace("models/", ""));
  console.log(`✔ Clave válida: ${names.length} modelos disponibles.`);
  console.log(names.includes(model) ? `✔ El modelo ${model} está disponible para esta clave.` : `✘ El modelo ${model} NO aparece. Disponibles: ${names.filter((n) => /gemini/.test(n)).slice(0, 12).join(", ")}`);
} catch (e) {
  console.error(`✘ La clave no es válida o no tiene acceso: ${e.status ?? ""} ${String(e.message).slice(0, 200)}`);
  process.exit(1);
}

if (process.argv.includes("--generate")) {
  const res = await ai.models.generateContent({
    model,
    contents: "Responde solo con: DNI GYM conectado.",
    config: { maxOutputTokens: 600, temperature: 0 },
  });
  console.log(`✔ Respuesta: ${res.text?.trim()} (${res.usageMetadata?.totalTokenCount ?? "?"} tokens)`);
}
