import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * robots.txt (SEO + AEO): buscadores y rastreadores de IA permitidos de forma explícita,
 * con Content Signals (uso del contenido por IA) y el catálogo para agentes.
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

export function GET() {
  const disallow = ["/panel/", "/admin/", "/bienvenida/", "/restablecer/", "/api/"];
  const block = (agents: string[], extraAllow: string[] = []) =>
    [...agents.map((a) => `User-Agent: ${a}`), "Allow: /", ...extraAllow.map((a) => `Allow: ${a}`), ...disallow.map((d) => `Disallow: ${d}`)].join("\n");
  const body = [
    "# DNI GYM · entrenador personal gratis (https://dnigym.com)",
    "# Contenido público disponible para buscadores y asistentes de IA. Contacto: contacto@dnigym.com",
    "",
    "Content-Signal: search=yes, ai-input=yes, ai-train=yes",
    "",
    block(["*"], ["/api/public/"]),
    "",
    block(CRAWLERS, ["/llms.txt", "/llms-full.txt", "/api/public/", "/.well-known/"]),
    "",
    `Agentmap: ${absoluteUrl("/.well-known/ai-catalog.json")}`,
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    `Host: ${absoluteUrl("/")}`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
