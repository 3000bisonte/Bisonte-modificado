// Service Worker para PWA Móvil
// v2: No interceptar peticiones cross-origin (ej. Google CSP) para evitar errores no-cors/redirect
const CACHE_NAME = 'bisonte-mobile-v2';
const CORE_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/icon-256x256.png',
  '/icon-384x384.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo manejar GET del mismo origen. Dejar pasar cross-origin (Google, MP, etc.).
  if (req.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // No interferir con rutas sensibles si las hubiera (ejemplo: APIs auth)
  // if (url.pathname.startsWith('/api/')) return;

  // Estrategia: network-first para navegaciones, cache-first para estáticos
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/login') || caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
