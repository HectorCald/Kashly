const CACHE_NAME = 'kashly-v5';
const STATIC_CACHE = 'kashly-static-v5';

// Recursos críticos que se cachean inmediatamente
const STATIC_RESOURCES = [
  '/',
  '/css/inicio.css',
  '/css/estilos-base.css',
  '/css/components/categorias.css',
  '/css/components/etiquetas.css',
  '/css/components/ajustes.css',
  '/css/components/entrada-manual.css',
  '/css/components/buscar-trans.css',
  '/js/inicio.js',
  '/js/components/ajustes.js',
  '/js/components/entrada-manual.js',
  '/js/components/buscar-trans.js',
  '/js/components/components.js',
  '/manifest.json',
  '/img/img-inicio/logo-trans.webp',  
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr'
];

// Instalación - Cachear recursos críticos inmediatamente
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Instalando y cacheando recursos críticos...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Cacheando recursos estáticos...');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('✅ Recursos críticos cacheados exitosamente');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error cacheando recursos:', error);
      })
  );
});

// Activación - Limpiar caches antiguos y tomar control
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Eliminar caches antiguos
            if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
              console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activado y listo');
        return self.clients.claim();
      })
  );
});

// Interceptar todas las peticiones
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estrategia: Cache First para recursos estáticos
  if (isStaticResource(request)) {
    event.respondWith(cacheFirst(request));
  }
  // Estrategia: Network First para la página principal
  else if (isPageRequest(request)) {
    event.respondWith(networkFirst(request));
  }
  // Para todo lo demás, usar cache si está disponible
  else {
    event.respondWith(cacheOrNetwork(request));
  }
});

// Función para identificar recursos estáticos
function isStaticResource(request) {
  const url = request.url;
  return (
    url.includes('.css') ||
    url.includes('.js') ||
    url.includes('.webp') ||
    url.includes('.png') ||
    url.includes('.jpg') ||
    url.includes('.jpeg') ||
    url.includes('.gif') ||
    url.includes('.svg') ||
    url.includes('cdnjs.cloudflare.com') ||
    url.includes('unpkg.com') ||
    url.includes('cdn.jsdelivr.net')
  );
}

// Función para identificar peticiones de página
function isPageRequest(request) {
  const url = new URL(request.url);
  return (
    request.method === 'GET' &&
    request.headers.get('accept').includes('text/html') &&
    url.origin === self.location.origin
  );
}

// Estrategia Cache First - Para recursos estáticos
async function cacheFirst(request) {
  try {
    // Buscar en cache primero
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('⚡ Sirviendo desde cache:', request.url);
      return cachedResponse;
    }

    // Si no está en cache, buscar en red
    const networkResponse = await fetch(request);
    
    // Cachear la respuesta para futuras peticiones (solo si es HTTP/HTTPS)
    if (networkResponse.ok && (request.url.startsWith('http://') || request.url.startsWith('https://'))) {
      try {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, networkResponse.clone());
      } catch (cacheError) {
        console.warn('⚠️ No se pudo cachear:', request.url, cacheError.message);
      }
    }

    return networkResponse;
  } catch (error) {
    console.error('❌ Error en cacheFirst:', error);
    // Si falla todo, intentar servir desde cache aunque sea viejo
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Estrategia Cache First - Para páginas principales también
async function networkFirst(request) {
  try {
    // Buscar en cache primero
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('⚡ Sirviendo página desde cache:', request.url);
      
      // NO actualizar en segundo plano - solo usar cache
      // El usuario debe presionar "Actualizar" para actualizar
      
      return cachedResponse;
    }

    // Si no está en cache, buscar en red
    const networkResponse = await fetch(request);
    
    // Cachear la respuesta exitosa
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 Red no disponible, sirviendo desde cache...');
    
    // Si falla la red, servir desde cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si no hay cache, mostrar página offline
          return caches.match('/');
  }
}

// Estrategia Cache o Network - Para otros recursos
async function cacheOrNetwork(request) {
  try {
    // Buscar en cache primero
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Si no está en cache, buscar en red
    const networkResponse = await fetch(request);
    
    // Cachear si es exitosa
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Si falla todo, intentar cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}



