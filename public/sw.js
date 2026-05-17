const CACHE_NAME = "bloxbuild-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// 1. Install Event: Cache critical app shell resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Pre-caching static assets");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log("[Service Worker] Removing outdated cache:", key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intercept queries and handle caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip dynamic database API endpoints and Supabase streams
  if (
    request.url.includes("/api/") ||
    request.url.includes("supabase.co") ||
    request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // If response is invalid, don't cache it
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Offline fallback when navigation fails
          if (request.mode === "navigate") {
            return caches.match("/");
          }
        });
    })
  );
});
