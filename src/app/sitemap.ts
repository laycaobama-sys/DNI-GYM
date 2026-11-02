import type { MetadataRoute } from "next";
import { EXERCISES } from "@/data/exercises";
import { ROUTINES } from "@/data/routines";
import { CALCULATORS } from "@/data/calculators";
import { CHALLENGES } from "@/data/challenges";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-02");
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly") => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "daily"),
    page("/ejercicios", 0.9),
    page("/rutinas", 0.9),
    page("/calculadoras", 0.8),
    page("/retos", 0.9),
    ...CHALLENGES.map((c) => page(`/retos/${c.slug}`, 0.8)),
    ...CALCULATORS.map((c) => page(`/calculadoras/${c.slug}`, 0.8)),
    ...ROUTINES.map((r) => page(`/rutinas/${r.slug}`, 0.8)),
    ...EXERCISES.map((e) => ({ ...page(`/ejercicios/${e.slug}`, 0.7, "monthly"), images: [absoluteUrl(`/ejercicios/${e.src}-1.webp`)] })),
    page("/login", 0.5, "monthly"),
    page("/privacidad", 0.2, "yearly"),
    page("/terminos", 0.2, "yearly"),
  ];
}
