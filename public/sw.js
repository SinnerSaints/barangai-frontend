const CACHE_NAME = "barangai-v1";

// App shell — the files needed to render the UI at all
const APP_SHELL = [
  "/",
  "/courses",
  "/quizzes",
];

// On install, cache the app shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - HTML pages → Network first, fall back to cache
// - JS/CSS/fonts/images → Cache first, fall back to network
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Don't intercept API calls — always need fresh data
  if (url.pathname.startsWith("/api") || url.hostname !== location.hostname) {
    return;
  }

  const isNavigation = request.mode === "navigate";

  e.respondWith(
    isNavigation
      ? // HTML: try network, serve cached on failure
        fetch(request)
          .then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            return res;
          })
          .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
      : // Assets: serve from cache instantly, update in background
        caches.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((res) => {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
              return res;
            })
        )
  );
});