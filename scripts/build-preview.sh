#!/usr/bin/env bash
# Genera una versión estática de vista previa en out/.
# Excluye temporalmente las rutas que necesitan servidor (llms.txt, sitemap, robots, manifest, imagen OG).
set -e
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
ITEMS="llms.txt llms-full.txt manifest.ts robots.ts sitemap.ts opengraph-image.tsx"
for i in $ITEMS; do mv "src/app/$i" "$TMP/"; done
trap 'for i in $ITEMS; do mv "$TMP/$i" src/app/; done' EXIT
rm -rf .next out
STATIC_EXPORT=1 npx next build
