/*
 * Service worker for the laboratory-inspections PWA.
 *
 * Cache policy:
 * - Navigations: network first, then the cached app shell.
 * - Next.js static assets: cache first.
 * - APIs, non-GET requests, and cross-origin requests: never cached here.
 */

const CACHE_PREFIX = "pwa-inspections-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const APP_SHELL_URL = "/";
const NEXT_STATIC_PATH = "/_next/static/";

const isCacheableResponse = (response) => response && response.ok;

async function cacheResponse(request, response) {
  if (!isCacheableResponse(response)) {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    await cacheResponse(APP_SHELL_URL, response);
    return response;
  } catch {
    const cachedAppShell = await caches.match(APP_SHELL_URL);

    if (cachedAppShell) {
      return cachedAppShell;
    }

    return new Response(
      "<!doctype html><html lang=\"es-MX\"><meta charset=\"utf-8\"><title>Sin conexión</title><body><main><h1>Sin conexión</h1><p>Abre esta aplicación una vez con Internet para usar la pantalla inicial sin conexión.</p></main></body></html>",
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}

async function cacheFirstStaticAsset(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  await cacheResponse(request, response);
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(APP_SHELL_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith(NEXT_STATIC_PATH)) {
    event.respondWith(cacheFirstStaticAsset(request));
  }
});
