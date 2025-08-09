const CACHE_NAME = 'kashly-cache-v5';

// Archivos a cachear
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/index.css',
    '/src/main.jsx',
    '/src/App.jsx',
    '/src/App.css',
    '/src/components/ui/TransactionView.css',
    '/src/components/ui/TransactionView.jsx',
    '/src/components/ui/AddTransactionView.css',
    '/src/components/ui/AddTransactionView.jsx',
    '/src/components/ui/UndoNotification.css',
    '/src/components/ui/UndoNotification.jsx',
    '/src/components/ui/InputNormal.css',
    '/src/components/ui/InputNormal.jsx',
    '/src/components/ui/CustomSelect.css',
    '/src/components/ui/CustomSelect.jsx',
    '/src/components/PilarCategory.css',
    '/src/components/PilarCategory.jsx',
    '/src/components/Total.css',
    '/src/components/Total.jsx',
    '/src/components/Transactions.css',
    '/src/components/Transactions.jsx',
    '/src/components/Filters.css',
    '/src/components/Filters.jsx',
    '/src/components/AddTransaction.css',
    '/src/components/AddTransaction.jsx',
    '/src/components/Button.css',
    '/src/components/Button.jsx',
    '/src/components/ButtonIcon.css',
    '/src/components/ButtonIcon.jsx',
    '/src/components/Category.css',
    '/src/components/Category.jsx',
    '/src/components/Input.css',
    '/src/components/Input.jsx',
    '/src/components/InputOne.css',
    '/src/components/InputOne.jsx',
    '/src/components/Notification.css',
    '/src/components/Notification.jsx',
    '/src/components/SearchBar.css',
    '/src/components/SearchBar.jsx',
    '/src/utils/database.js',
    '/src/utils/globalState.js',
    '/src/utils/icons.js',
    '/src/utils/colors.js',
    '/src/utils/exampleData.js',
    '/src/hooks/useNotification.js',
    // Fuentes de Google
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    // Assets e iconos
    '/src/assets/react.svg',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/vite.svg'
];

// Instalar y cachear archivos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache abierto:', CACHE_NAME);
                return cache.addAll(FILES_TO_CACHE);
            })
            .catch((error) => {
                console.log('Error al cachear archivos:', error);
            })
    );
});

// Activar y limpiar caches viejos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache viejo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptar peticiones y SIEMPRE devolver del cache primero
self.addEventListener('fetch', (event) => {
    // Solo manejar peticiones GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // SIEMPRE devolver del cache si está disponible
                if (response) {
                    return response;
                }
                
                // Para URLs externas (como Google Fonts), intentar fetch
                if (event.request.url.startsWith('http')) {
                    return fetch(event.request)
                        .then((networkResponse) => {
                            // Cachear la respuesta para futuras peticiones
                            if (networkResponse.ok) {
                                const responseClone = networkResponse.clone();
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                            }
                            return networkResponse;
                        })
                        .catch(() => {
                            // Si falla, devolver respuesta offline
                            return new Response('Offline - Contenido no disponible', {
                                status: 503,
                                statusText: 'Service Unavailable'
                            });
                        });
                }
                
                // Para archivos locales, devolver respuesta offline
                return new Response('Offline - Archivo no encontrado', {
                    status: 404,
                    statusText: 'Not Found'
                });
            })
    );
});