// geminiService — integración con Google Gemini mediante el SDK oficial @google/genai.
// La clave se lee de la variable de entorno GEMINI_API_KEY (secreto del Worker) y nunca se expone al navegador.
import { GoogleGenAI, type Content } from "@google/genai";
import { HttpError } from "./http";

export const DEFAULT_MODEL = "gemini-3.8-flash";

export interface GenOptions {
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

export interface UsageInfo {
  tokens: number;
}

const RETRYABLE = new Set([429, 500, 503]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Modelos de respaldo (nivel gratuito) si el configurado deja de existir o no está disponible para la clave. */
const FALLBACKS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
/** Último modelo que funcionó en esta instancia del Worker. */
let workingModel: string | null = null;
/** Último error real de Gemini (sin datos sensibles), para el diagnóstico. */
let lastError: { model: string; status: number; message: string } | null = null;

function statusOf(e: unknown): number {
  const s = (e as { status?: number; code?: number })?.status ?? (e as { code?: number })?.code;
  if (typeof s === "number") return s;
  const m = /"code":\s*(\d{3})|\b(400|401|403|404|429|500|503)\b/.exec(String((e as Error)?.message ?? e));
  return m ? Number(m[1] ?? m[2]) : 0;
}

const msgOf = (e: unknown) => String((e as Error)?.message ?? e).replace(/key=[A-Za-z0-9_-]+/g, "key=***").slice(0, 400);
const modelMissing = (e: unknown) => statusOf(e) === 404 || /not found|is not supported|no longer available|deprecated|unknown model/i.test(msgOf(e));

/** Reintentos con espera exponencial ante límites de uso (429) o errores temporales (500/503). */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const st = statusOf(e);
      if (!RETRYABLE.has(st) || i === attempts - 1) break;
      await sleep(600 * 2 ** i + Math.random() * 300);
    }
  }
  throw last;
}

/** Traduce el error de Gemini a un mensaje claro y lo deja registrado (sin datos sensibles). */
function friendly(e: unknown, model: string): never {
  if (e instanceof HttpError) throw e;
  const st = statusOf(e);
  console.error("gemini_error", JSON.stringify({ model, status: st, message: msgOf(e) }));
  lastError = { model, status: st, message: msgOf(e) };
  if (st === 429) throw new HttpError(429, "La IA está recibiendo demasiadas peticiones o se ha agotado el cupo gratuito de hoy. Inténtalo en unos minutos.");
  if (st === 401 || st === 403 || /API key|API_KEY|permission/i.test(msgOf(e))) throw new HttpError(502, "La clave de la IA no es válida o no tiene permiso. El administrador debe revisarla.");
  if (modelMissing(e)) throw new HttpError(502, "El modelo de IA configurado no está disponible. Inténtalo de nuevo en un momento.");
  if (st === 400) throw new HttpError(502, "La IA no ha podido procesar esta petición. Prueba a reformular la pregunta.");
  throw new HttpError(502, "La IA no está disponible en este momento. Inténtalo de nuevo.");
}

export function createGeminiService(apiKey: string | undefined, model = DEFAULT_MODEL) {
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  const candidates = [...new Set([workingModel, model, ...FALLBACKS].filter(Boolean) as string[])];
  // En Gemini 2.5 el razonamiento interno consume tokens de salida: lo acotamos para controlar coste y latencia.
  // Gemini 3+ razona antes de responder: nivel de razonamiento bajo (rápido) y margen de tokens para que la respuesta no salga vacía.
  const gen3 = (m: string) => !/^gemini-(1|2)\./.test(m);
  const config = (m: string, o: GenOptions) => ({
    systemInstruction: o.system,
    temperature: o.temperature ?? 0.6,
    maxOutputTokens: (o.maxOutputTokens ?? 1500) + (gen3(m) ? 1024 : /2\.5-pro/.test(m) ? 512 : 0),
    ...(gen3(m)
      ? { thinkingConfig: { thinkingLevel: "LOW" as never } }
      : /2\.5/.test(m)
        ? { thinkingConfig: { thinkingBudget: /flash/.test(m) ? 0 : 512 } }
        : {}),
  });
  const toContents = (history: ChatTurn[], message: string): Content[] => [
    ...history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    { role: "user", parts: [{ text: message }] },
  ];

  /** Ejecuta la llamada con el primer modelo disponible; si un modelo ya no existe, prueba el siguiente. */
  async function run<T>(call: (m: string) => Promise<T>): Promise<T> {
    let last: unknown;
    for (const m of candidates) {
      try {
        const r = await withRetry(() => call(m));
        if (workingModel !== m) {
          if (m !== model) console.warn("gemini_fallback", JSON.stringify({ configured: model, using: m }));
          workingModel = m;
        }
        return r;
      } catch (e) {
        last = e;
        if (!modelMissing(e)) friendly(e, m);
        console.warn("gemini_model_unavailable", JSON.stringify({ model: m, message: msgOf(e) }));
      }
    }
    friendly(last, model);
  }

  return {
    get model() {
      return workingModel ?? model;
    },

    /** Genera texto simple. */
    async generateText(prompt: string, o: GenOptions = {}) {
      const res = await run((m) => ai.models.generateContent({ model: m, contents: prompt, config: config(m, o) }));
      return { text: res.text ?? "", usage: { tokens: res.usageMetadata?.totalTokenCount ?? 0 } };
    },

    /** Genera JSON validado contra un esquema (para propuestas estructuradas, p. ej. un entreno). */
    async generateJson<T>(prompt: string, schema: Record<string, unknown>, o: GenOptions = {}) {
      const res = await run((m) => ai.models.generateContent({ model: m, contents: prompt, config: { ...config(m, o), responseMimeType: "application/json", responseJsonSchema: schema } }));
      try {
        return { data: JSON.parse(res.text ?? "null") as T, usage: { tokens: res.usageMetadata?.totalTokenCount ?? 0 } };
      } catch {
        throw new HttpError(502, "La IA devolvió una respuesta no válida. Inténtalo de nuevo.");
      }
    },

    /** Chat con historial en streaming: devuelve un generador de fragmentos de texto. */
    async *streamChat(history: ChatTurn[], message: string, o: GenOptions = {}, usage?: UsageInfo): AsyncGenerator<string> {
      let usedModel = workingModel ?? model;
      const stream = await run((m) => {
        usedModel = m;
        return ai.models.generateContentStream({ model: m, contents: toContents(history, message), config: config(m, o) });
      });
      try {
        for await (const chunk of stream) {
          if (usage && chunk.usageMetadata?.totalTokenCount) usage.tokens = chunk.usageMetadata.totalTokenCount;
          const t = chunk.text;
          if (t) yield t;
        }
      } catch (e) {
        friendly(e, usedModel);
      }
    },
  };
}

/** Diagnóstico gratuito (no genera texto): comprueba la clave y qué modelos responden. */
export async function diagnoseGemini(apiKey: string | undefined, model = DEFAULT_MODEL) {
  if (!apiKey) return { configured: false, ok: false, model, available: [] as string[], error: "Falta GEMINI_API_KEY" };
  const ai = new GoogleGenAI({ apiKey });
  const available: string[] = [];
  let error: string | null = null;
  for (const m of [...new Set([model, ...FALLBACKS])]) {
    try {
      await ai.models.get({ model: m });
      available.push(m);
    } catch (e) {
      const st = statusOf(e);
      if (st === 401 || st === 403 || st === 400) {
        error = `Clave rechazada por Google (${st}): ${msgOf(e)}`;
        break;
      }
    }
  }
  return { configured: true, ok: available.length > 0, model, configuredAvailable: available.includes(model), available, using: workingModel, error };
}

/** Prueba mínima de generación (≈10 tokens) para comprobar que la IA responde de verdad. */
export async function probeGemini(apiKey: string | undefined, model = DEFAULT_MODEL) {
  const g = createGeminiService(apiKey, model);
  if (!g) return { ok: false, error: "Falta GEMINI_API_KEY" };
  const t0 = Date.now();
  try {
    const r = await g.generateText("Responde solo con la palabra OK.", { maxOutputTokens: 8, temperature: 0 });
    let streamed = "";
    for await (const c of g.streamChat([], "Responde solo con la palabra OK.", { maxOutputTokens: 8, temperature: 0 })) streamed += c;
    return { ok: true, model: g.model, text: r.text.trim().slice(0, 40), stream: streamed.trim().slice(0, 40), ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, model: g.model, error: e instanceof Error ? e.message : String(e), raw: lastError, ms: Date.now() - t0 };
  }
}

export type GeminiService = NonNullable<ReturnType<typeof createGeminiService>>;
