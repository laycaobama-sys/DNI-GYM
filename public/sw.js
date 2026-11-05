/* DNI GYM · service worker: modo sin conexión.
   - Páginas: red primero (siempre la versión más reciente) y, sin cobertura, la última guardada.
   - Recursos estáticos e imágenes: caché primero y actualización en segundo plano.
   La API (/api/*) no pasa por aquí: la app guarda una copia local de tus datos y encola lo que guardes sin red. */
const VERSION = "dnigym-v4";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const PRECACHE = ["/", "/panel/", "/panel/entrenar/", "/panel/nutricion/", "/panel/progreso/", "/panel/coach/", "/panel/perfil/", "/panel/ejercicios/", "/login/", "/bienvenida/", "/logo.svg", "/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/ejercicios/") && /\.(webp|png|jpg)$/.test(url.pathname) ||
  url.pathname.startsWith("/brand/") ||
  /\.(woff2|svg|png|webp)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(PAGES).then((c) => c.put(req, copy));
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match(url.pathname.startsWith("/panel") ? "/panel/" : "/")) || Response.error()),
    );
    return;
  }

  if (isAsset(url)) {
    event.respondWith(
      caches.open(ASSETS).then(async (c) => {
        const cached = await c.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) c.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
