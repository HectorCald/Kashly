const CACHE_NAME = 'kashly-v1';
const STATIC_CACHE = 'kashly-static-v1';

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

// Mensajes del Service Worker
self.addEventListener('message', (event) => {
  // Verificar versión en Vercel
  if (event.data && event.data.type === 'CHECK_VERSION') {
    console.log('🔍 Verificando versión en Vercel...');
    event.waitUntil(
      checkVersionInVercel()
        .then((versionInfo) => {
          console.log('📋 Información de versión:', versionInfo);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ 
              success: true, 
              versionInfo: versionInfo 
            });
          }
        })
        .catch((error) => {
          console.error('❌ Error verificando versión:', error);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ 
              success: false, 
              error: error.message 
            });
          }
        })
    );
  }

  // Actualizar desde Vercel
  if (event.data && event.data.type === 'UPDATE_FROM_VERCEL') {
    console.log('🔄 Actualizando desde Vercel...');
    event.waitUntil(
      updateFromVercel()
        .then((result) => {
          console.log('✅ Actualización completada:', result);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ 
              success: true, 
              result: result 
            });
          }
        })
        .catch((error) => {
          console.error('❌ Error en actualización:', error);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ 
              success: false, 
              error: error.message 
            });
          }
        })
    );
  }

  // Actualizar cache manualmente (mantener compatibilidad)
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    console.log('🔄 Actualizando cache manualmente...');
    event.waitUntil(
      caches.open(STATIC_CACHE)
        .then((cache) => cache.addAll(STATIC_RESOURCES))
        .then(() => {
          console.log('✅ Cache actualizado manualmente');
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          console.error('❌ Error actualizando cache:', error);
          event.ports[0].postMessage({ success: false, error: error.message });
        })
    );
  }
});

// Función para verificar versión en el servidor
async function checkVersionInVercel() {
  try {
    // Obtener versión actual desde el cache local
    let currentVersion = 'kashly v1'; // Versión por defecto
    
    // Intentar obtener la versión actual desde el cache
    try {
      const cachedResponse = await caches.match('/');
      if (cachedResponse) {
        const text = await cachedResponse.text();
        const metaMatch = text.match(/<meta name="app-version" content="([^"]+)"/i);
        if (metaMatch) {
          currentVersion = metaMatch[1];
        }
      }
    } catch (error) {
      console.log('⚠️ No se pudo obtener versión del cache:', error.message);
    }
    
    console.log('🔍 Versión actual (cache):', currentVersion);
    
    // Intentar obtener información de versión desde el servidor
    let serverVersion = null;
    let hasUpdate = false;
    
    try {
      // Primero intentar con la API
      const apiResponse = await fetch('/api/version?t=' + Date.now());
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        serverVersion = data.version;
        hasUpdate = serverVersion !== currentVersion;
        console.log('📋 Versión del servidor obtenida desde API:', serverVersion);
        console.log('🔄 ¿Hay actualización?', hasUpdate);
        
        // Si las versiones son iguales, no hay actualización
        if (!hasUpdate) {
          console.log('✅ Versiones coinciden, no hay actualización disponible');
        }
      } else {
        console.log('⚠️ Error HTTP al obtener versión desde API:', apiResponse.status);
        
        // Fallback: obtener desde HTML
        const response = await fetch('/?version-check=' + Date.now());
        if (response.ok) {
          const text = await response.text();
          console.log('📄 HTML del servidor obtenido, buscando versión...');
          
          // Buscar versión en el meta tag
          const metaMatch = text.match(/<meta name="app-version" content="([^"]+)"/i);
          if (metaMatch) {
            serverVersion = metaMatch[1];
            hasUpdate = serverVersion !== currentVersion;
            console.log('📋 Versión del servidor encontrada en meta tag:', serverVersion);
            console.log('🔄 ¿Hay actualización?', hasUpdate);
          } else {
            console.log('⚠️ No se encontró versión en el HTML del servidor');
          }
        } else {
          console.log('⚠️ Error HTTP al obtener HTML del servidor:', response.status);
        }
      }
    } catch (error) {
      console.log('🌐 No se pudo verificar versión del servidor:', error.message);
    }
    
    const result = {
      currentVersion: currentVersion,
      serverVersion: serverVersion,
      hasUpdate: hasUpdate,
      lastCheck: new Date().toISOString()
    };
    
    console.log('📊 Resultado final de verificación:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en checkVersionInVercel:', error);
    throw new Error(`Error verificando versión: ${error.message}`);
  }
}

// Función para actualizar desde el servidor
async function updateFromVercel() {
  const results = {
    updated: [],
    failed: [],
    version: 'Actualizada'
  };
  
  try {
    console.log('🔄 Iniciando actualización completa...');
    
    // 1. Actualizar recursos estáticos
    const staticCache = await caches.open(STATIC_CACHE);
    
    for (const resource of STATIC_RESOURCES) {
      try {
        console.log('🔄 Actualizando recurso estático:', resource);
        const response = await fetch(resource + '?t=' + Date.now());
        
        if (response.ok) {
          await staticCache.put(resource, response);
          results.updated.push(resource);
          console.log('✅ Recurso estático actualizado:', resource);
        } else {
          results.failed.push({ resource, error: `HTTP ${response.status}` });
          console.warn('⚠️ Falló actualización de recurso estático:', resource, response.status);
        }
      } catch (error) {
        results.failed.push({ resource, error: error.message });
        console.warn('⚠️ Error actualizando recurso estático:', resource, error.message);
      }
    }
    
    // 2. Actualizar página principal
    try {
      console.log('🔄 Actualizando página principal...');
      const mainCache = await caches.open(CACHE_NAME);
      const pageResponse = await fetch('/?t=' + Date.now());
      
      if (pageResponse.ok) {
        // Clonar la respuesta antes de leer el texto
        const responseClone = pageResponse.clone();
        
        // Cachear la respuesta
        await mainCache.put('/', pageResponse);
        results.updated.push('Página principal');
        console.log('✅ Página principal actualizada');
        
        // Verificar nueva versión usando el clone
        const text = await responseClone.text();
        const versionMatch = text.match(/<meta name="app-version" content="([^"]+)"/i);
        if (versionMatch) {
          results.version = versionMatch[1];
          console.log('📋 Nueva versión detectada:', results.version);
        }
      } else {
        results.failed.push({ resource: 'Página principal', error: `HTTP ${pageResponse.status}` });
        console.warn('⚠️ Falló actualización de página principal:', pageResponse.status);
      }
    } catch (error) {
      results.failed.push({ resource: 'Página principal', error: error.message });
      console.warn('⚠️ Error actualizando página principal:', error.message);
    }
    
    // 3. Limpiar caches antiguos
    try {
      console.log('🧹 Limpiando caches antiguos...');
      const cacheNames = await caches.keys();
      const cachesToDelete = cacheNames.filter(name => 
        name !== STATIC_CACHE && name !== CACHE_NAME
      );
      
      for (const cacheName of cachesToDelete) {
        await caches.delete(cacheName);
        console.log('🗑️ Cache eliminado:', cacheName);
      }
    } catch (error) {
      console.warn('⚠️ Error limpiando caches:', error.message);
    }
    
    console.log('✅ Actualización completada:', results);
    return results;
  } catch (error) {
    console.error('❌ Error en actualización:', error);
    throw new Error(`Error en actualización: ${error.message}`);
  }
}