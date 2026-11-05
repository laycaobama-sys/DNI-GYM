import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Buscadores y rastreadores de IA permitidos de forma explícita (SEO + AEO).
 * Todos pueden leer el contenido público; nadie puede entrar en zonas privadas ni en la API.
 */
const CRAWLERS = [
  // OpenAI (ChatGPT)
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ChatGPT Agent",
  // Google (Búsqueda, Gemini, AI Overviews)
  "Googlebot", "Googlebot-Image", "Google-Extended", "GoogleOther", "Google-CloudVertexBot", "Gemini-Deep-Research",
  // Anthropic (Claude)
  "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai", "claude-web",
  // Perplexity
  "PerplexityBot", "Perplexity-User",
  // Microsoft (Bing, Copilot)
  "Bingbot", "BingPreview", "msnbot",
  // Amazon (Alexa, Rufus, Nova)
  "Amazonbot", "Amazon-User", "NovaAct",
  // Apple (Siri, Spotlight, Apple Intelligence)
  "Applebot", "Applebot-Extended",
  // Meta (Meta AI)
  "meta-externalagent", "meta-externalfetcher", "FacebookBot", "facebookexternalhit",
  // Cohere
  "cohere-ai", "cohere-training-data-crawler",
  // Mistral, DuckDuckGo, You.com, Brave, Kagi, Phind, Andi
  "MistralAI-User", "DuckAssistBot", "DuckDuckBot", "YouBot", "Bravebot", "Kagibot", "PhindBot", "Andibot",
  // xAI (Grok), DeepSeek, ByteDance, Baidu, Yandex, Naver
  "GrokBot", "xAI-Bot", "DeepSeekBot", "Bytespider", "TikTokSpider", "Baiduspider", "YandexBot", "Yeti",
  // Common Crawl (base de muchos modelos), AI2, Diffbot, Timpi, Webz, Omgili
  "CCBot", "AI2Bot", "Ai2Bot-Dolma", "Diffbot", "Timpibot", "webzio-extended", "omgili",
  // Agentes y lectores de enlaces
  "LinkedInBot", "Twitterbot", "Slackbot", "Discordbot", "WhatsApp", "TelegramBot",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/panel/", "/admin/", "/bienvenida/", "/restablecer/", "/api/"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }, { userAgent: CRAWLERS, allow: ["/", "/llms.txt", "/llms-full.txt"], disallow }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
