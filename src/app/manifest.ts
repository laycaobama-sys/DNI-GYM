import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — Entrenamiento, progreso y nutrición`,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/panel",
    display: "standalone",
    background_color: "#070708",
    theme_color: "#070708",
    lang: "es",
    categories: ["health", "fitness", "sports", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Entrenar", url: "/panel/entrenar" },
      { name: "Nutrición", url: "/panel/nutricion" },
      { name: "Progreso", url: "/panel/progreso" },
    ],
  };
}
