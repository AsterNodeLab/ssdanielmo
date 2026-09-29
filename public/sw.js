const VERSION = "routine-os-v3";
const APP_BASE = new URL("./", self.location).pathname;
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_ENTRY = `${APP_BASE}index.html`;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const page = await fetch(OFFLINE_ENTRY, { cache: "no-store" });
    if (!page.ok) throw new Error("Could not cache the app shell");
    await cache.put(OFFLINE_ENTRY, page.clone());

    const html = await page.text();
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
      .map((match) => new URL(match[1], self.location.origin))
      .filter((url) => url.origin === self.location.origin && url.pathname.startsWith(APP_BASE))
      .map((url) => url.href);
    await cache.addAll(assets);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("routine-os-") && key !== STATIC_CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

async function remember(request, response) {
  if (response.ok) {
    try {
      await (await caches.open(STATIC_CACHE)).put(request, response.clone());
    } catch {
      // A full or unavailable cache must not block the online app.
    }
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith(APP_BASE)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then((response) => remember(OFFLINE_ENTRY, response)).catch(async () => (await caches.match(OFFLINE_ENTRY)) ?? Response.error()));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => remember(event.request, response)).catch(() => {
        return new Response("Offline", { status: 503, statusText: "Offline" });
      });
    }),
  );
});

