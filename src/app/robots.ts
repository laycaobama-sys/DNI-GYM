import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

// Permitimos explícitamente a buscadores y asistentes de IA (Google, Bing, ChatGPT, Claude, Perplexity, Gemini…)
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Bytespider", "meta-externalagent", "cohere-ai", "YouBot", "DuckAssistBot", "MistralAI-User"];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/panel", "/admin", "/bienvenida"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }, ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow }))],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
