const CACHE_NAME = 'kashly-v24';

// Instalación básica
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalado');
  self.skipWaiting();
});

// Activación básica
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activado');
  event.waitUntil(self.clients.claim());
});

// Solo cachear la página principal para offline
self.addEventListener('fetch', (event) => {
  // Solo manejar la página principal
  if (event.request.url.includes('/') && !event.request.url.includes('.')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/');
        })
    );
  }
  // Para todo lo demás, no hacer nada (dejar que el navegador maneje)
}); 