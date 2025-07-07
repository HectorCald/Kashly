import { ocultarCategorias } from './categorias.js';

const DB_NAME = 'KashlyDB';
const BASE_VERSION = 1;
const STORE_ETIQUETAS = 'etiquetas';

let listenersEtiquetas = false;


/* ===== INDEXEDDB ===== */
function getCurrentVersion() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME);
        req.onsuccess = function (e) {
            const db = e.target.result;
            resolve(db.version);
            db.close();
        };
        req.onerror = () => resolve(BASE_VERSION);
        req.onupgradeneeded = function (e) {
            // Si la base no existe, devolverá BASE_VERSION
            resolve(e.target.result.version);
        };
    });
}
function openDB(requiredStores = []) {
    return getCurrentVersion().then(currentVersion => {
        return new Promise((resolve, reject) => {
            let needsUpgrade = false;
            let newVersion = currentVersion;
            // Abrir para ver si faltan stores
            const req = indexedDB.open(DB_NAME);
            req.onsuccess = function (e) {
                const db = e.target.result;
                const missingStores = requiredStores.filter(store => !db.objectStoreNames.contains(store));
                db.close();
                if (missingStores.length > 0) {
                    needsUpgrade = true;
                    newVersion = currentVersion + 1;
                }
                if (needsUpgrade) {
                    // Reabrir con nueva versión para crear los stores faltantes
                    const upgradeReq = indexedDB.open(DB_NAME, newVersion);
                    upgradeReq.onupgradeneeded = function (ev) {
                        const db2 = ev.target.result;
                        requiredStores.forEach(store => {
                            if (!db2.objectStoreNames.contains(store)) {
                                db2.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
                            }
                        });
                    };
                    upgradeReq.onsuccess = () => {
                        // ¡OJO! Espera a onsuccess del upgrade antes de usar la conexión
                        resolve(upgradeReq.result);
                    };
                    upgradeReq.onerror = () => reject(upgradeReq.error);
                } else {
                    // Ya existen todos los stores
                    // ¡OJO! Reabrir la conexión para usarla, no uses la que acabas de cerrar
                    const finalReq = indexedDB.open(DB_NAME, currentVersion);
                    finalReq.onsuccess = function (ev) {
                        resolve(finalReq.result);
                    };
                    finalReq.onerror = () => reject(finalReq.error);
                }
            };
            req.onerror = () => reject(req.error);
        });
    });
}


/* ===== ETIQUETAS ===== */
function guardarEtiqueta(nombre) {
    return openDB([STORE_ETIQUETAS]).then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_ETIQUETAS, 'readwrite');
            const store = tx.objectStore(STORE_ETIQUETAS);
            const req = store.add({ nombre });
            req.onsuccess = () => { resolve(req.result); db.close(); };
            req.onerror = () => { reject(req.error); db.close(); };
        });
    });
}
async function borrarEtiquetaPorId(id) {
    const db = await openDB([STORE_ETIQUETAS]);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_ETIQUETAS, 'readwrite');
        const store = tx.objectStore(STORE_ETIQUETAS);
        const req = store.delete(id);
        req.onsuccess = () => { resolve(); db.close(); };
        req.onerror = () => { reject(req.error); db.close(); };
    });
}
function obtenerEtiquetas() {
    return openDB([STORE_ETIQUETAS]).then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_ETIQUETAS, 'readonly');
            const store = tx.objectStore(STORE_ETIQUETAS);
            const req = store.getAll();
            req.onsuccess = () => { resolve(req.result); db.close(); };
            req.onerror = () => { reject(req.error); db.close(); };
        });
    });
}
export function mostrarEtiquetas() {
    const btnEtiquetas = document.querySelector('.etiquetas');
    const etiquetasContainer = document.querySelector('.etiquetas-container');
    const overlay2 = document.querySelector('.overlay2');
    if (!listenersEtiquetas) {
        btnEtiquetas.addEventListener('click', () => {
            etiquetasContainer.style.transform = 'translateY(0)';
            overlay2.classList.add('active');
            mostrarEtiquetasContent(); // Cargar etiquetas guardadas
        });
        listenersEtiquetas = true;
    }
    ocultarCategorias();
    etiquetas();
}
function etiquetas() {
    if (etiquetas._initialized) return;
    etiquetas._initialized = true;
    function agregarEtiqueta() {
        const inputEtiqueta = document.querySelector('.agregar-etiqueta input');
        const btnAgregar = document.querySelector('.btn-agregar-etiqueta');

        // Función para agregar etiqueta
        async function agregarEtiquetaFunc() {
            let nombre = inputEtiqueta.value.trim().toLowerCase();
            if (!nombre) return;

            // Verifica duplicados (ignorando mayúsculas/minúsculas)
            const existentes = await obtenerEtiquetas();
            if (existentes.some(et => et.nombre.toLowerCase() === nombre)) {
                inputEtiqueta.value = '';
                inputEtiqueta.blur(); // Forzar blur para limpiar autocompletado
                return;
            }

            await guardarEtiqueta(nombre);
            inputEtiqueta.value = '';
            inputEtiqueta.blur(); // Forzar blur para limpiar autocompletado
            mostrarEtiquetasContent(nombre); // Pasa el nombre para animar
        }



        // Agregar etiqueta con el botón
        btnAgregar.addEventListener('click', async (e) => {
            e.preventDefault();
            await agregarEtiquetaFunc();
        });
    }
    agregarEtiqueta();
}
async function mostrarEtiquetasContent(nombreAnimada = null) {
    const etiquetasContent = document.querySelector('.etiquetas-container .etiquetas-content');
    Array.from(etiquetasContent.children).forEach(child => {
        if (!child.classList.contains('agregar-etiqueta')) {
            etiquetasContent.removeChild(child);
        }
    });
    const etiquetas = await obtenerEtiquetas();
    etiquetas.reverse();
    etiquetas.forEach(et => {
        const div = document.createElement('div');
        div.classList.add('etiqueta');
        div.innerHTML = `<p>#${et.nombre}</p>`;
        if (nombreAnimada && et.nombre === nombreAnimada) {
            div.classList.add('slide-in');
        }
        div.dataset.id = et.id;
        div.dataset.nombre = et.nombre;
        let deleteState = 0;
        div._deleteState = 0;
        div.addEventListener('click', async (e) => {
            e.stopPropagation();
            // Resetear todas las demás
            const allEtiquetas = document.querySelectorAll('.etiquetas-content .etiqueta');
            allEtiquetas.forEach(other => {
                if (other !== div) {
                    other.classList.remove('delete-pending');
                    other.querySelector('p').textContent = '#' + other.dataset.nombre;
                    other._deleteState = 0;
                }
            });
            if (deleteState === 0) {
                div.classList.add('delete-pending');
                div.querySelector('p').textContent = 'Eliminar?';
                deleteState = 1;
                div._deleteState = 1;
            } else if (deleteState === 1) {
                div.querySelector('p').textContent = 'Confirmar?';
                deleteState = 2;
                div._deleteState = 2;
            } else if (deleteState === 2) {
                div.classList.add('slide-out');
                await borrarEtiquetaPorId(et.id);
                setTimeout(() => {
                    mostrarEtiquetasContent();
                }, 300);
            }
        });
        document.addEventListener('click', function resetEtiqueta(e) {
            if (!div.contains(e.target)) {
                if (deleteState > 0) {
                    div.classList.remove('delete-pending');
                    div.querySelector('p').textContent = '#' + div.dataset.nombre;
                    deleteState = 0;
                    div._deleteState = 0;
                }
            }
        });
        etiquetasContent.appendChild(div);
    });
}
export function ocultarEtiquetas() {
    const btnCerrarEtiquetas = document.querySelector('.etiquetas-container .cerrar-etiquetas');
    const etiquetasContainer = document.querySelector('.etiquetas-container');
    const overlay2 = document.querySelector('.overlay2');
    btnCerrarEtiquetas.addEventListener('click', () => {
        etiquetasContainer.style.transform = 'translateY(100%)';
        overlay2.classList.remove('active');
    });
}


