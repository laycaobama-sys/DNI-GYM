// geminiService — integración con Google Gemini mediante el SDK oficial @google/genai.
// La clave se lee de la variable de entorno GEMINI_API_KEY (secreto del Worker) y nunca se expone al navegador.
import { GoogleGenAI, type Content } from "@google/genai";
import { HttpError } from "./http";

export const DEFAULT_MODEL = "gemini-2.5-pro";

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

function statusOf(e: unknown): number {
  const s = (e as { status?: number; code?: number })?.status ?? (e as { code?: number })?.code;
  if (typeof s === "number") return s;
  const m = /"code":\s*(\d{3})|\b(429|500|503)\b/.exec(String((e as Error)?.message ?? e));
  return m ? Number(m[1] ?? m[2]) : 0;
}

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
  const st = statusOf(last);
  if (st === 429) throw new HttpError(429, "La IA está recibiendo demasiadas peticiones. Inténtalo en un minuto.");
  if (st === 400 || st === 403) throw new HttpError(502, "La IA rechazó la petición. Revisa la clave y el modelo configurados.");
  throw new HttpError(502, "La IA no está disponible en este momento. Inténtalo de nuevo.");
}

export function createGeminiService(apiKey: string | undefined, model = DEFAULT_MODEL) {
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  // En Gemini 2.5 el razonamiento interno consume tokens de salida: lo acotamos para controlar coste y latencia.
  const thinking = /2\.5/.test(model) ? { thinkingConfig: { thinkingBudget: /flash/.test(model) ? 0 : 512 } } : {};
  const config = (o: GenOptions) => ({
    systemInstruction: o.system,
    temperature: o.temperature ?? 0.6,
    maxOutputTokens: (o.maxOutputTokens ?? 1500) + (/2\.5-pro/.test(model) ? 512 : 0),
    ...thinking,
  });
  const toContents = (history: ChatTurn[], message: string): Content[] => [
    ...history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    { role: "user", parts: [{ text: message }] },
  ];

  return {
    model,

    /** Genera texto simple. */
    async generateText(prompt: string, o: GenOptions = {}) {
      const res = await withRetry(() => ai.models.generateContent({ model, contents: prompt, config: config(o) }));
      return { text: res.text ?? "", usage: { tokens: res.usageMetadata?.totalTokenCount ?? 0 } };
    },

    /** Genera JSON validado contra un esquema (para propuestas estructuradas, p. ej. un entreno). */
    async generateJson<T>(prompt: string, schema: Record<string, unknown>, o: GenOptions = {}) {
      const res = await withRetry(() =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: { ...config(o), responseMimeType: "application/json", responseJsonSchema: schema },
        }),
      );
      try {
        return { data: JSON.parse(res.text ?? "null") as T, usage: { tokens: res.usageMetadata?.totalTokenCount ?? 0 } };
      } catch {
        throw new HttpError(502, "La IA devolvió una respuesta no válida. Inténtalo de nuevo.");
      }
    },

    /** Chat con historial en streaming: devuelve un generador de fragmentos de texto. */
    async *streamChat(history: ChatTurn[], message: string, o: GenOptions = {}, usage?: UsageInfo): AsyncGenerator<string> {
      const stream = await withRetry(() => ai.models.generateContentStream({ model, contents: toContents(history, message), config: config(o) }));
      for await (const chunk of stream) {
        if (usage && chunk.usageMetadata?.totalTokenCount) usage.tokens = chunk.usageMetadata.totalTokenCount;
        const t = chunk.text;
        if (t) yield t;
      }
    },
  };
}

export type GeminiService = NonNullable<ReturnType<typeof createGeminiService>>;
