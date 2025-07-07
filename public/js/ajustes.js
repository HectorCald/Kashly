import { mostrarCategorias } from './components/ajustes/categorias.js';
import { mostrarEtiquetas } from './components/ajustes/etiquetas.js';


/* ===== AJUSTES ===== */
export function mostrarAjustes() {
    const btnAjustes = document.querySelector('.ajustes');
    const ajustesContainer = document.querySelector('.ajustes-container');
    const overlay = document.querySelector('.overlay');

    btnAjustes.addEventListener('click', () => {
        ajustesContainer.style.transform = 'translateY(0)';
        mostrarCategorias();
        mostrarEtiquetas();
        mostrarVersionCache();
        overlay.classList.add('active');
    });
}
async function mostrarVersionCache() {
    const ajustesContainer = document.querySelector('.ajustes-container');
    
    // Remover versión anterior si existe
    const versionAnterior = ajustesContainer.querySelector('.version-cache');
    if (versionAnterior) {
        versionAnterior.remove();
    }
    
    // Crear elemento de versión
    const versionDiv = document.createElement('div');
    versionDiv.className = 'opcion version-cache';
    
    // Mostrar loading inicial
    versionDiv.innerHTML = `<p>Obteniendo versión...</p>`;
    
    // Agregar al final del contenedor de ajustes
    ajustesContainer.appendChild(versionDiv);
    
    try {
        // Obtener versión del cache actual del Service Worker
        let currentVersion = null;
        
        // Obtener versión desde el cache del SW
        if ('caches' in window) {
            try {
                // Buscar en los caches del SW
                const cacheNames = await caches.keys();
                console.log('📦 Caches disponibles:', cacheNames);
                
                // Buscar en el cache principal de Kashly
                for (const cacheName of cacheNames) {
                    if (cacheName.includes('kashly')) {
                        const cache = await caches.open(cacheName);
                        console.log('🔍 Revisando cache:', cacheName);
                        
                        // Intentar obtener la versión desde el cache
                        const versionResponse = await cache.match('/api/version');
                        if (versionResponse) {
                            const versionData = await versionResponse.json();
                            currentVersion = versionData.version;
                            console.log('📱 Versión encontrada en cache:', currentVersion);
                            break;
                        }
                        
                        // Si no hay /api/version, usar el nombre del cache como versión
                        if (cacheName.includes('kashly-v')) {
                            const versionMatch = cacheName.match(/kashly-v(\d+)/);
                            if (versionMatch) {
                                currentVersion = `Version: beta ${versionMatch[1]}`;
                                console.log('📱 Versión del cache SW:', currentVersion);
                                break;
                            }
                        }
                    }
                }
            } catch (error) {
                console.log('⚠️ Error obteniendo versión del cache SW:', error.message);
            }
        }
        
        // Actualizar visualización
        if (currentVersion) {
            versionDiv.innerHTML = `<p>${currentVersion}</p>`;
        } else {
            versionDiv.innerHTML = `<p>No disponible</p>`;
        }
        
    } catch (error) {
        console.error('❌ Error obteniendo versión:', error);
        versionDiv.innerHTML = `<p>Error</p>`;
    }
}