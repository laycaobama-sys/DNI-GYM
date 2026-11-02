import type { NextConfig } from "next";

// La web se publica como sitio estático (carpeta out/) en Cloudflare Pages.
// Toda la lógica de usuario corre en el navegador contra Firebase (Auth + Firestore).
// ARTIFACT_PREVIEW=1 solo se usa para la vista previa privada en Claude.
const artifactPreview = process.env.ARTIFACT_PREVIEW === "1";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(artifactPreview ? { assetPrefix: "/app-assets" } : {}),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
