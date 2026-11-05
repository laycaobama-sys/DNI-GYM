import type { NextConfig } from "next";

// La web se exporta como sitio estático (carpeta out/) que sirve el Worker de Cloudflare.
// Cuentas, sesiones y datos viven en el Worker (worker/) con Cloudflare D1.
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
