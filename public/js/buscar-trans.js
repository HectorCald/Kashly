/* ===== INDEXEDDB ===== */
const STORE_TRANSACCIONES = 'transacciones';
const DB_NAME = 'KashlyDB';

// Variables globales para filtros persistentes
let filtroActivo = '';
let categoriaFiltroActiva = null;

function getCurrentVersionBuscar() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME);
        req.onsuccess = function(e) {
            const db = e.target.result;
            resolve(db.version);
            db.close();
        };
        req.onerror = () => resolve(1);
        req.onupgradeneeded = function(e) {
            resolve(e.target.result.version);
        };
    });
}
function openDBBuscar(requiredStores = []) {
    return getCurrentVersionBuscar().then(currentVersion => {
        return new Promise((resolve, reject) => {
            let needsUpgrade = false;
            let newVersion = currentVersion;
            const req = indexedDB.open(DB_NAME);
            req.onsuccess = function(e) {
                const db = e.target.result;
                const missingStores = requiredStores.filter(store => !db.objectStoreNames.contains(store));
                db.close();
                if (missingStores.length > 0) {
                    needsUpgrade = true;
                    newVersion = currentVersion + 1;
                }
                if (needsUpgrade) {
                    const upgradeReq = indexedDB.open(DB_NAME, newVersion);
                    upgradeReq.onupgradeneeded = function(ev) {
                        const db2 = ev.target.result;
                        requiredStores.forEach(store => {
                            if (!db2.objectStoreNames.contains(store)) {
                                db2.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
                            }
                        });
                    };
                    upgradeReq.onsuccess = () => {
                        resolve(upgradeReq.result);
                    };
                    upgradeReq.onerror = () => reject(upgradeReq.error);
                } else {
                    const finalReq = indexedDB.open(DB_NAME, currentVersion);
                    finalReq.onsuccess = function(ev) {
                        resolve(finalReq.result);
                    };
                    finalReq.onerror = () => reject(finalReq.error);
                }
            };
            req.onerror = () => reject(req.error);
        });
    });
}

/* ===== TRANSACCIONES ===== */
function obtenerTransaccionesBuscar() {
    return openDBBuscar([STORE_TRANSACCIONES]).then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_TRANSACCIONES, 'readonly');
            const store = tx.objectStore(STORE_TRANSACCIONES);
            const req = store.getAll();
            req.onsuccess = () => { resolve(req.result); db.close(); };
            req.onerror = () => { reject(req.error); db.close(); };
        });
    });
}
function obtenerCategoriasBuscar() {
    return openDBBuscar(['categorias']).then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('categorias', 'readonly');
            const store = tx.objectStore('categorias');
            const req = store.getAll();
            req.onsuccess = () => { resolve(req.result); db.close(); };
            req.onerror = () => { reject(req.error); db.close(); };
        });
    });
}
function obtenerEtiquetasBuscar() {
    return openDBBuscar(['etiquetas']).then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('etiquetas', 'readonly');
            const store = tx.objectStore('etiquetas');
            const req = store.getAll();
            req.onsuccess = () => { resolve(req.result); db.close(); };
            req.onerror = () => { reject(req.error); db.close(); };
        });
    });
}
/* ===== BUSCAR TRANSACCIONES ===== */
// Función renderTransacciones eliminada - ahora se usa buscarYRenderizarTransacciones del módulo buscar.js

// Variable para controlar si ya se inicializaron los listeners
let listenersBuscarTransInicializados = false;

import { renderFiltrosBuscar, onCambioFiltros, sincronizarConDashboard } from './components/transacciones/filtros.js';
import { buscarYRenderizarTransacciones, inicializarBuscarInputYFiltros, setCategoriaFiltroActiva } from './components/transacciones/buscar.js';

export function limpiarCategoriaFiltro() {
    categoriaFiltroActiva = null;
}

export function limpiarBusquedaInput() {
    const input = document.querySelector('.buscador-transacciones .search input');
    if (input) input.value = '';
}

// Función global para sincronizar filtros del buscador con el dashboard
export function sincronizarFiltrosBuscador() {
    sincronizarConDashboard();
    // Re-renderizar transacciones con los nuevos filtros
    buscarYRenderizarTransacciones();
}

export function mostrarBuscarTrans() {
    // Evitar inicialización múltiple
    if (listenersBuscarTransInicializados) return;
    listenersBuscarTransInicializados = true;
    
    const btnBuscarTrans = document.querySelector('.buscar');
    const buscarTransContainer = document.querySelector('.buscador-transacciones');
    const overlay = document.querySelector('.overlay');
    const input = document.querySelector('.search input');
    const btnCerrar = document.querySelector('.buscador-transacciones .cerrar');

    btnBuscarTrans.addEventListener('click', async () => {
        buscarTransContainer.style.transform = 'translateY(0)';
        overlay.classList.add('active');
        // Restaurar título por defecto
        const titulo = buscarTransContainer.querySelector('.titulo p');
        if (titulo) titulo.textContent = 'Todas las transacciones';
        // Limpiar filtros
        input.value = '';
        // Limpiar filtro de categoría cuando se abre desde el menú
        categoriaFiltroActiva = null;
        // Renderizar filtros
        await renderFiltrosBuscar();
        inicializarBuscarInputYFiltros();
        // Callback para cambios de filtros
        onCambioFiltros(() => {
            buscarYRenderizarTransacciones();
        });
        // Cargar transacciones iniciales
        buscarYRenderizarTransacciones();
        // Agregar escape handler cuando se abre
        agregarEscapeHandler();
    });
    
    // Escuchar evento para abrir con filtro de categoría
    window.addEventListener('abrirBuscadorConFiltro', (event) => {
        const { categoriaId, categoriaNombre } = event.detail;
        buscarTransContainer.style.transform = 'translateY(0)';
        overlay.classList.add('active');
        // Cambiar título al nombre de la categoría
        const titulo = buscarTransContainer.querySelector('.titulo p');
        if (titulo) titulo.textContent = categoriaNombre;
        // Limpiar input y filtros
        input.value = '';
        // Establecer filtro de categoría activo
        setCategoriaFiltroActiva(categoriaId, categoriaNombre);
        // Renderizar filtros
        renderFiltrosBuscar();
        inicializarBuscarInputYFiltros();
        onCambioFiltros(() => {
            buscarYRenderizarTransacciones();
        });
        // Cargar transacciones iniciales
        buscarYRenderizarTransacciones();
        // Agregar escape handler cuando se abre
        agregarEscapeHandler();
    });

    // Remover el event listener cuando se cierra el buscador
    btnCerrar.addEventListener('click', () => {
        removerEscapeHandler();
    });
    overlay.addEventListener('click', () => {
        if (buscarTransContainer.style.transform === 'translateY(0)') {
            removerEscapeHandler();
        }
    });
}
window.addEventListener('transaccionEliminadaUI', (event) => {
    // Siempre re-filtrar usando el filtrado unificado
    buscarYRenderizarTransacciones();
});

window.addEventListener('transaccionRestauradaUI', async (event) => {
    buscarYRenderizarTransacciones();
});

window.addEventListener('transaccionEditadaUI', () => {
    buscarYRenderizarTransacciones();
});

// Función específica para actualizar pilares
export function actualizarPilares() {
    if (typeof window.actualizarDashboard === 'function') {
        window.actualizarDashboard();
    }
}

// Exportar funciones de IndexedDB
export { obtenerCategoriasBuscar, obtenerEtiquetasBuscar };

// Hacer disponible globalmente la función de sincronización
window.sincronizarFiltrosBuscador = sincronizarFiltrosBuscador;

// Definir escape handler para cerrar el buscador con Escape
let escapeHandlerBuscarTrans = null;
function agregarEscapeHandler() {
    if (escapeHandlerBuscarTrans) return;
    escapeHandlerBuscarTrans = (e) => {
        const buscarTransContainer = document.querySelector('.buscador-transacciones');
        const overlay = document.querySelector('.overlay');
        if (e.key === 'Escape' && buscarTransContainer.style.transform === 'translateY(0)') {
            buscarTransContainer.style.transform = 'translateY(100%)';
            overlay.classList.remove('active');
            removerEscapeHandler();
        }
    };
    document.addEventListener('keydown', escapeHandlerBuscarTrans);
}
function removerEscapeHandler() {
    if (escapeHandlerBuscarTrans) {
        document.removeEventListener('keydown', escapeHandlerBuscarTrans);
        escapeHandlerBuscarTrans = null;
    }
}