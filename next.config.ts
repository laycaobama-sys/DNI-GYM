import type { NextConfig } from "next";

// STATIC_EXPORT=1 genera una versión 100% estática (carpeta out/) para previsualizar sin servidor.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const, trailingSlash: true, assetPrefix: "/app-assets", images: { unoptimized: true } } : {}),
  cacheComponents: !staticExport,
  partialPrefetching: !staticExport,
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
