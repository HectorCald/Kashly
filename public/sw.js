const CACHE_NAME = 'kashly-v1.0.0';
const urlsToCache = [
  '/',
  '/css/inicio.css',
  '/css/estilos-base.css',
  '/css/components/ajustes.css',
  '/css/components/buscar-trans.css',
  '/css/components/categorias.css',
  '/css/components/etiquetas.css',
  '/css/components/entrada-manual.css',
  '/js/inicio.js',
  '/js/components/ajustes.js',
  '/js/components/buscar-trans.js',
  '/js/components/components.js',
  '/js/components/entrada-manual.js',
  '/img/img-inicio/logo-trans.webp',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Instalación completada');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error en la instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activación completada');
      return self.clients.claim();
    })
  );
});

// Interceptación de peticiones
self.addEventListener('fetch', (event) => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Excluir peticiones a APIs externas
  if (event.request.url.includes('cdnjs.cloudflare.com') || 
      event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.url.includes('api.') ||
      event.request.url.includes('localhost:3000')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si encontramos la respuesta en cache, la devolvemos
        if (response) {
          console.log('Service Worker: Sirviendo desde cache:', event.request.url);
          return response;
        }

        // Si no está en cache, hacemos la petición a la red
        console.log('Service Worker: Descargando desde red:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Verificar que la respuesta sea válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para poder cachearla
            const responseToCache = response.clone();

            // Cachear la nueva respuesta
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('Service Worker: Cacheando nueva respuesta:', event.request.url);
              });

            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Error en fetch:', error);
            
            // Si es una petición de página, devolver la página principal desde cache
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
            
            return new Response('Error de conexión', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            });
          });
      })
  );
});

// Manejo de mensajes
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
}); 