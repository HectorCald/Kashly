// IndexedDB helpers con versión dinámica
const DB_NAME = 'KashlyDB';
const BASE_VERSION = 1;
const STORE_CATEGORIAS = 'categorias';
const STORE_ETIQUETAS = 'etiquetas';

let listenersCategorias = false;
let listenersEtiquetas = false;


/* ===== INDEXEDDB ===== */
function getCurrentVersion() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME);
        req.onsuccess = function(e) {
            const db = e.target.result;
            resolve(db.version);
            db.close();
        };
        req.onerror = () => resolve(BASE_VERSION);
        req.onupgradeneeded = function(e) {
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
            req.onsuccess = function(e) {
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
                    upgradeReq.onupgradeneeded = function(ev) {
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

/* ===== CATEGORIAS ===== */
function guardarCategoria(nombre) {
    return openDB([STORE_CATEGORIAS]).then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_CATEGORIAS, 'readwrite');
            const store = tx.objectStore(STORE_CATEGORIAS);
            const req = store.add({ nombre });
            req.onsuccess = () => { resolve(req.result); db.close(); };
            req.onerror = () => { reject(req.error); db.close(); };
        });
    });
}
async function borrarCategoriaPorId(id) {
    const db = await openDB([STORE_CATEGORIAS]);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CATEGORIAS, 'readwrite');
        const store = tx.objectStore(STORE_CATEGORIAS);
        const req = store.delete(id);
        req.onsuccess = () => { resolve(); db.close(); };
        req.onerror = () => { reject(req.error); db.close(); };
    });
}
function obtenerCategorias() {
    return openDB([STORE_CATEGORIAS]).then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_CATEGORIAS, 'readonly');
            const store = tx.objectStore(STORE_CATEGORIAS);
            const req = store.getAll();
            req.onsuccess = () => { resolve(req.result); db.close(); };
            req.onerror = () => { reject(req.error); db.close(); };
        });
    });
}
function mostrarCategorias() {
    const btnCategorias = document.querySelector('.categorias');
    const categoriasContainer = document.querySelector('.categorias-container');

    if (!listenersCategorias) {
        btnCategorias.addEventListener('click', () => {
            categoriasContainer.style.transform = 'translateY(0)';
            mostrarCategoriasContent(); // Cargar categorías guardadas
        });
        listenersCategorias = true;
    }
    ocultarEtiquetas();
    ascensorAjustes(categoriasContainer);
    categorias();
}
function categorias() {
    if (categorias._initialized) return;
    categorias._initialized = true;
    function agregarCategoria() {
        const inputCategoria = document.querySelector('.agregar-categoria input');
        inputCategoria.addEventListener('keydown', async (e) => {
            if (
                (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') &&
                inputCategoria.value.trim()
            ) {
                e.preventDefault();
                let nombre = inputCategoria.value.trim();
                nombre = capitalizeFirst(nombre);
                // Verifica duplicados (ignorando mayúsculas/minúsculas)
                const existentes = await obtenerCategorias();
                if (existentes.some(cat => cat.nombre.toLowerCase() === nombre.toLowerCase())) {
                    inputCategoria.value = '';
                    return;
                }
                inputCategoria.value = '';
                await guardarCategoria(nombre);
                inputCategoria.value = '';
                mostrarCategoriasContent(nombre); // Pasa el nombre para animar
            }
        });
        window.dispatchEvent(new Event('transaccionGuardada'));
    }
    agregarCategoria();
}
async function mostrarCategoriasContent(nombreAnimada = null) {
    const categoriasContent = document.querySelector('.categorias-container .categorias-content');
    Array.from(categoriasContent.children).forEach(child => {
        if (!child.classList.contains('agregar-categoria') && !child.classList.contains('guardar-categorias')) {
            categoriasContent.removeChild(child);
        }
    });
    const categorias = await obtenerCategorias();
    categorias.reverse();
    categorias.forEach(cat => {
        const div = document.createElement('div');
        div.classList.add('categoria');
        div.innerHTML = `<i class="fa-solid fa-tag"></i> <p>${cat.nombre}</p>`;
        if (nombreAnimada && cat.nombre === nombreAnimada) {
            div.classList.add('slide-in');
        }
        div.dataset.id = cat.id;
        div.dataset.nombre = cat.nombre;
        let deleteState = 0;
        div._deleteState = 0;
        div.addEventListener('click', async (e) => {
            e.stopPropagation();
            // Resetear todas las demás
            const allCategorias = document.querySelectorAll('.categorias-content .categoria');
            allCategorias.forEach(other => {
                if (other !== div) {
                    other.classList.remove('delete-pending');
                    other.querySelector('p').textContent = other.dataset.nombre;
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
                await borrarCategoriaPorId(cat.id);
                setTimeout(() => {
                    mostrarCategoriasContent();
                }, 300);
            }
        });
        document.addEventListener('click', function resetCategoria(e) {
            if (!div.contains(e.target)) {
                if (deleteState > 0) {
                    div.classList.remove('delete-pending');
                    div.querySelector('p').textContent = div.dataset.nombre;
                    deleteState = 0;
                    div._deleteState = 0;
                }
            }
        });
        categoriasContent.insertBefore(div, categoriasContent.querySelector('.agregar-categoria'));
    });
}
function ocultarCategorias() {
    const btnCerrarCategorias = document.querySelector('.categorias-container .cerrar-categorias');
    const categoriasContainer = document.querySelector('.categorias-container');

    btnCerrarCategorias.addEventListener('click', () => {
        categoriasContainer.style.transform = 'translateY(100%)';
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
function mostrarEtiquetas() {
    const btnEtiquetas = document.querySelector('.etiquetas');
    const etiquetasContainer = document.querySelector('.etiquetas-container');

    if (!listenersEtiquetas) {
        btnEtiquetas.addEventListener('click', () => {
            etiquetasContainer.style.transform = 'translateY(0)';
            mostrarEtiquetasContent(); // Cargar etiquetas guardadas
        });
        listenersEtiquetas = true;
    }
    ocultarCategorias();
    ascensorAjustes(etiquetasContainer);
    etiquetas();
}
function etiquetas() {
    if (etiquetas._initialized) return;
    etiquetas._initialized = true;
    function agregarEtiqueta() {
        const inputEtiqueta = document.querySelector('.agregar-etiqueta input');
        inputEtiqueta.addEventListener('keydown', async (e) => {
            if (
                (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') &&
                inputEtiqueta.value.trim()
            ) {
                e.preventDefault();
                let nombre = inputEtiqueta.value.trim().toLowerCase();
                // Verifica duplicados (ignorando mayúsculas/minúsculas)
                const existentes = await obtenerEtiquetas();
                if (existentes.some(et => et.nombre.toLowerCase() === nombre)) {
                    inputEtiqueta.value = '';
                    return;
                }
                inputEtiqueta.value = '';
                await guardarEtiqueta(nombre);
                inputEtiqueta.value = '';
                mostrarEtiquetasContent(nombre); // Pasa el nombre para animar
            }
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
function ocultarEtiquetas() {
    const btnCerrarEtiquetas = document.querySelector('.etiquetas-container .cerrar-etiquetas');
    const etiquetasContainer = document.querySelector('.etiquetas-container');

    btnCerrarEtiquetas.addEventListener('click', () => {
        etiquetasContainer.style.transform = 'translateY(100%)';
    });
}


/* ===== AJUSTES ===== */
export function mostrarAjustes() {
    const btnAjustes = document.querySelector('.ajustes');
    const ajustesContainer = document.querySelector('.ajustes-container');
    const overlay = document.querySelector('.overlay');

    btnAjustes.addEventListener('click', () => {
        ajustesContainer.style.transform = 'translateY(0)';
        mostrarCategorias();
        mostrarEtiquetas();
        overlay.classList.add('active');
    });
    ascensorAjustes(ajustesContainer);
}
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}