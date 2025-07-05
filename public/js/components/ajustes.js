// IndexedDB helpers con versión dinámica
const DB_NAME = 'KashlyDB';
const BASE_VERSION = 1;
const STORE_CATEGORIAS = 'categorias';
const STORE_ETIQUETAS = 'etiquetas';
const STORE_TRANSACCIONES = 'transacciones';

let listenersCategorias = false;
let listenersEtiquetas = false;

// Variables para guardar icono/color seleccionados temporalmente
let iconoCategoriaSeleccionado = 'fa:fa-tag';
let colorCategoriaSeleccionado = '#fff';

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

/* ===== CATEGORIAS ===== */
// Paleta de colores para categorías
export const CATEGORIA_COLORES = [
    '#CC831F', // naranja más oscuro
    '#CC5734', // naranja oscuro
    '#FF7043', // naranja
    '#FFAD8A', // naranja claro
    '#FFCA7F', // naranja aún más claro
    '#1C82AC', // azul oscuro
    '#29B6F6', // azul
    '#6ECFF9', // azul claro
    '#4A8C4D', // verde oscuro
    '#66BB6A', // verde
    '#98D89E', // verde claro
    '#873995', // morado oscuro
    '#AB47BC', // morado
    '#C88ED3', // morado claro
    '#B93161', // rosa oscuro
    '#EC407A', // rosa
    '#F279A3', // rosa claro
    '#1D7E76', // turquesa oscuro
    '#26A69A', // turquesa
    '#5CD0C7', // turquesa claro
    '#CC9F20', // amarillo oscuro
    '#FFCA28', // amarillo
    '#FFE066', // amarillo claro
    '#6F554E', // marrón oscuro
    '#8D6E63', // marrón
    '#B39B94', // marrón claro
    '#5C6D78', // gris azulado oscuro
    '#78909C', // gris azulado
    '#A7B6C0', // gris azulado claro
];




// Obtener el siguiente color disponible
export async function obtenerColorCategoria() {
    const cats = await obtenerCategorias();
    const usados = cats.map(c => c.color);
    const libre = CATEGORIA_COLORES.find(c => !usados.includes(c));
    if (libre) return libre;
    // Si se acaban, asignar aleatorio
    return CATEGORIA_COLORES[Math.floor(Math.random() * CATEGORIA_COLORES.length)];
}

function guardarCategoria(nombre, icono, color) {
    return openDB([STORE_CATEGORIAS]).then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_CATEGORIAS, 'readwrite');
            const store = tx.objectStore(STORE_CATEGORIAS);
            const req = store.add({ nombre, icono, color });
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

function obtenerTransacciones() {
    return openDB([STORE_TRANSACCIONES]).then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_TRANSACCIONES, 'readonly');
            const store = tx.objectStore(STORE_TRANSACCIONES);
            const req = store.getAll();
            req.onsuccess = () => { resolve(req.result); db.close(); };
            req.onerror = () => { reject(req.error); db.close(); };
        });
    });
}

async function verificarCategoriaEnUso(categoriaId) {
    const transacciones = await obtenerTransacciones();
    return transacciones.some(tr => tr.idCategoria === categoriaId);
}



function mostrarNotificacion(mensaje, tipo = 'error') {
    const notificacion = document.querySelector('.notificacion-toast');
    if (notificacion) {
        notificacion.textContent = mensaje;
        notificacion.className = `notificacion-toast ${tipo}`;
        notificacion.classList.add('mostrar');

        // Ocultar después de 3 segundos
        setTimeout(() => {
            notificacion.classList.remove('mostrar');
        }, 3000);
    }
}
function mostrarCategorias() {
    const btnCategorias = document.querySelector('.categorias');
    const categoriasContainer = document.querySelector('.categorias-container');
    const overlay2 = document.querySelector('.overlay2');

    if (!listenersCategorias) {
        btnCategorias.addEventListener('click', () => {
            categoriasContainer.style.transform = 'translateY(0)';
            overlay2.classList.add('active');
            mostrarCategoriasContent(); // Cargar categorías guardadas
        });
        listenersCategorias = true;
    }
    ocultarEtiquetas();
    ocultarCategorias();
    categorias();
}
function categorias() {
    // Limpiar listeners anteriores si existen
    const btnIcono = document.querySelector('.icono-categoria');
    const btnAgregar = document.querySelector('.btn-agregar-categoria');
    const inputCategoria = document.querySelector('.agregar-categoria input');

    if (btnIcono) {
        const btnIconoClone = btnIcono.cloneNode(true);
        btnIcono.parentNode.replaceChild(btnIconoClone, btnIcono);
    }

    if (btnAgregar) {
        const btnAgregarClone = btnAgregar.cloneNode(true);
        btnAgregar.parentNode.replaceChild(btnAgregarClone, btnAgregar);
    }

    function agregarCategoria() {
        const inputCategoria = document.querySelector('.agregar-categoria input');
        const btnIconoActual = document.querySelector('.icono-categoria');
        const btnAgregarActual = document.querySelector('.btn-agregar-categoria');

        // Función para agregar categoría
        async function agregarCategoriaFunc() {
            let nombre = inputCategoria.value.trim();
            if (!nombre) return;
            nombre = capitalizeFirst(nombre);
            // Verifica duplicados (ignorando mayúsculas/minúsculas)
            const existentes = await obtenerCategorias();
            if (existentes.some(cat => cat.nombre.toLowerCase() === nombre.toLowerCase())) {
                inputCategoria.value = '';
                inputCategoria.blur(); // Forzar blur para limpiar autocompletado
                return;
            }
            // Usar icono/color seleccionados o por defecto
            const icono = iconoCategoriaSeleccionado || 'fa:fa-tag';
            const color = colorCategoriaSeleccionado || '#fff';
            await guardarCategoria(nombre, icono, color);
            inputCategoria.value = '';
            inputCategoria.blur(); // Forzar blur para limpiar autocompletado
            mostrarCategoriasContent(nombre); // Pasa el nombre para animar
            // Reset icono/color a por defecto
            iconoCategoriaSeleccionado = 'fa:fa-tag';
            colorCategoriaSeleccionado = '#fff';
            btnIconoActual.innerHTML = `<i class="fa-solid fa-tag" style="color:#fff"></i>`;
        }

        // Modal solo se abre al pulsar el botón de icono
        btnIconoActual.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            mostrarModalIconos((iconoSeleccionado, colorSeleccionado) => {
                // Guardar selección y reflejar en el botón
                iconoCategoriaSeleccionado = iconoSeleccionado || 'fa:fa-tag';
                colorCategoriaSeleccionado = colorSeleccionado || '#fff';
                // Renderizar icono y color en el botón
                if (iconoCategoriaSeleccionado.startsWith('bx:')) {
                    btnIconoActual.innerHTML = `<i class="bx ${iconoCategoriaSeleccionado.split(':')[1]}" style="color:${colorCategoriaSeleccionado}"></i>`;
                } else {
                    btnIconoActual.innerHTML = `<i class="fa-solid ${iconoCategoriaSeleccionado.split(':')[1]}" style="color:${colorCategoriaSeleccionado}"></i>`;
                }
            }, null, null, inputCategoria);
        });



        // Agregar categoría con el botón
        btnAgregarActual.addEventListener('click', async (e) => {
            e.preventDefault();
            await agregarCategoriaFunc();
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
        let iconHtml = '';
        if (cat.icono && cat.icono.startsWith('bx:')) {
            iconHtml = `<i class="bx ${cat.icono.split(':')[1]}" style="color:${cat.color || '#888'}"></i>`;
        } else if (cat.icono && cat.icono.startsWith('fa:')) {
            iconHtml = `<i class="fa-solid ${cat.icono.split(':')[1]}" style="color:${cat.color || '#888'}"></i>`;
        } else {
            iconHtml = `<i class="fa-solid fa-tag" style="color:${cat.color || '#888'}"></i>`;
        }
        div.innerHTML = `${iconHtml} <p>${cat.nombre}</p>`;
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
                // Verificar si la categoría está en uso antes de eliminar
                const categoriaEnUso = await verificarCategoriaEnUso(cat.id);
                if (categoriaEnUso) {
                    // La categoría está en uso, mostrar notificación y resetear
                    mostrarNotificacion(`No se puede eliminar "${cat.nombre}" porque está siendo usada en transacciones`, 'error');
                    div.classList.remove('delete-pending');
                    div.querySelector('p').textContent = div.dataset.nombre;
                    deleteState = 0;
                    div._deleteState = 0;
                } else {
                    // La categoría no está en uso, proceder con la eliminación
                    div.classList.add('slide-out');
                    await borrarCategoriaPorId(cat.id);
                    mostrarNotificacion(`Categoría "${cat.nombre}" eliminada`, 'error');
                    setTimeout(() => {
                        mostrarCategoriasContent();
                    }, 300);
                }
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
    const overlay2 = document.querySelector('.overlay2');   
    btnCerrarCategorias.addEventListener('click', () => {
        categoriasContainer.style.transform = 'translateY(100%)';
        overlay2.classList.remove('active');
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
function ocultarEtiquetas() {
    const btnCerrarEtiquetas = document.querySelector('.etiquetas-container .cerrar-etiquetas');
    const etiquetasContainer = document.querySelector('.etiquetas-container');
    const overlay2 = document.querySelector('.overlay2');
    btnCerrarEtiquetas.addEventListener('click', () => {
        etiquetasContainer.style.transform = 'translateY(100%)';
        overlay2.classList.remove('active');
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
}
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Iconos ya usados en los grupos principales
const ICON_GROUPS_BASE = [
    // ... igual que antes, todos los grupos menos 'Otros' ...
    // (copiar los grupos anteriores menos 'Otros')
    {
        nombre: 'Comida',
        iconos: [
            { type: 'bx', name: 'bxs-bowl-hot' },
            { type: 'bx', name: 'bx-bowl-hot' },
            { type: 'bx', name: 'bxs-pizza' },
            { type: 'bx', name: 'bxs-baguette' },
            { type: 'bx', name: 'bx-baguette' },
            { type: 'fa', name: 'fa-utensils' },
            { type: 'fa', name: 'fa-ice-cream' },
            { type: 'fa', name: 'fa-apple-whole' },
            { type: 'fa', name: 'fa-burger' },
        ]
    },
    {
        nombre: 'Transporte',
        iconos: [
            { type: 'bx', name: 'bxs-car' },
            { type: 'bx', name: 'bxs-bus' },
            { type: 'bx', name: 'bxs-plane' },
            { type: 'bx', name: 'bxs-taxi' },
            { type: 'bx', name: 'bx-car' },
            { type: 'bx', name: 'bx-bus' },
            { type: 'bx', name: 'bx-taxi' },
            { type: 'fa', name: 'fa-car' },
            { type: 'fa', name: 'fa-bus' },
            { type: 'fa', name: 'fa-plane' },
            { type: 'fa', name: 'fa-motorcycle' },
        ]
    },
    {
        nombre: 'Compras',
        iconos: [
            { type: 'bx', name: 'bx-cart' },
            { type: 'bx', name: 'bxs-cart' },
            { type: 'fa', name: 'fa-shopping-cart' },
            { type: 'bx', name: 'bx-wallet' },
            { type: 'bx', name: 'bxs-wallet' },
            { type: 'fa', name: 'fa-wallet' },
            { type: 'bx', name: 'bx-store' },
            { type: 'bx', name: 'bxs-store' },
            { type: 'fa', name: 'fa-store' }
        ]
    },
    {
        nombre: 'Entretenimiento',
        iconos: [
            { type: 'bx', name: 'bx-movie' },
            { type: 'bx', name: 'bxs-movie' },
            { type: 'fa', name: 'fa-film' },
            { type: 'bx', name: 'bx-music' },
            { type: 'bx', name: 'bxs-music' },
            { type: 'fa', name: 'fa-music' },
            { type: 'bx', name: 'bx-game' },
            { type: 'bx', name: 'bxs-game' },
            { type: 'fa', name: 'fa-gamepad' },
            { type: 'bx', name: 'bx-tv' },
            { type: 'bx', name: 'bxs-tv' },
            { type: 'fa', name: 'fa-tv' },
            { type: 'bx', name: 'bx-camera-movie' },
            { type: 'bx', name: 'bxs-camera-movie' },
            { type: 'fa', name: 'fa-video' }
        ]
    },
    {
        nombre: 'Personas',
        iconos: [
            { type: 'bx', name: 'bxs-user' },
            { type: 'bx', name: 'bx-user' },
            { type: 'bx', name: 'bxs-user-account' },
            { type: 'bx', name: 'bxs-user-circle' },
            { type: 'bx', name: 'bx-user-circle' },
            { type: 'fa', name: 'fa-user' },
            { type: 'fa', name: 'fa-users' },
            { type: 'fa', name: 'fa-child' },
        ]
    },
    {
        nombre: 'Hogar',
        iconos: [
            { type: 'bx', name: 'bxs-home' },
            { type: 'bx', name: 'bx-home' },
            { type: 'bx', name: 'bxs-building' },
            { type: 'bx', name: 'bx-building' },
            { type: 'fa', name: 'fa-house' },
            { type: 'fa', name: 'fa-couch' },
        ]
    },
    {
        nombre: 'Mascotas',
        iconos: [
            { type: 'bx', name: 'bxs-dog' },
            { type: 'bx', name: 'bxs-cat' },
            { type: 'fa', name: 'fa-dog' },
            { type: 'fa', name: 'fa-cat' },
            { type: 'fa', name: 'fa-paw' },
        ]
    },
    {
        nombre: 'Regalos',
        iconos: [
            { type: 'bx', name: 'bxs-gift' },
            { type: 'bx', name: 'bx-gift' },
            { type: 'fa', name: 'fa-gift' },
        ]
    },
    {
        nombre: 'Salud',
        iconos: [
            { type: 'bx', name: 'bxs-heart' },
            { type: 'bx', name: 'bx-heart' },
            { type: 'bx', name: 'bxs-capsule' },
            { type: 'bx', name: 'bx-capsule' },
            { type: 'fa', name: 'fa-heart' },
            { type: 'fa', name: 'fa-notes-medical' },
        ]
    },
    {
        nombre: 'Tecnología',
        iconos: [
            { type: 'bx', name: 'bx-laptop' },
            { type: 'bx', name: 'bxs-phone' },
            { type: 'bx', name: 'bx-phone' },
            { type: 'fa', name: 'fa-laptop' },
            { type: 'fa', name: 'fa-mobile' },
        ]
    },
    {
        nombre: 'Limpieza',
        iconos: [
            { type: 'bx', name: 'bx-shower' },
            { type: 'fa', name: 'fa-shower' },
            { type: 'bx', name: 'bx-bath' },
            { type: 'fa', name: 'fa-bath' },
            { type: 'fa', name: 'fa-bucket' },
            { type: 'bx', name: 'bx-brush' },
            { type: 'fa', name: 'fa-broom' },
            { type: 'bx', name: 'bx-droplet' },
            { type: 'fa', name: 'fa-tint' },
            { type: 'bx', name: 'bx-recycle' },
            { type: 'fa', name: 'fa-recycle' },
        ]
    },
    {
        nombre: 'Deporte',
        iconos: [
            { type: 'bx', name: 'bx-football' },
            { type: 'fa', name: 'fa-futbol' },
            { type: 'bx', name: 'bx-basketball' },
            { type: 'bx', name: 'bxs-basketball' },
            { type: 'fa', name: 'fa-basketball-ball' },
            { type: 'bx', name: 'bx-dumbbell' },
            { type: 'fa', name: 'fa-dumbbell' },
            { type: 'bx', name: 'bx-cricket-ball' },
            { type: 'bx', name: 'bxs-cricket-ball' },
            { type: 'fa', name: 'fa-baseball-ball' },
            { type: 'bx', name: 'bx-tennis-ball' },
            { type: 'bx', name: 'bxs-tennis-ball' },
            { type: 'fa', name: 'fa-table-tennis' }
        ]
    },
    {
        nombre: 'Educación',
        iconos: [
            { type: 'bx', name: 'bx-book' },
            { type: 'bx', name: 'bxs-book' },
            { type: 'fa', name: 'fa-book' },
            { type: 'bx', name: 'bx-pencil' },
            { type: 'bx', name: 'bxs-pencil' },
            { type: 'fa', name: 'fa-pencil-alt' },
            { type: 'bx', name: 'bxs-graduation' },
            { type: 'fa', name: 'fa-graduation-cap' },
            { type: 'bx', name: 'bx-chalkboard' },
            { type: 'bx', name: 'bxs-chalkboard' },
            { type: 'fa', name: 'fa-chalkboard-teacher' },
            { type: 'bx', name: 'bx-notepad' },
            { type: 'bx', name: 'bxs-notepad' },
            { type: 'fa', name: 'fa-clipboard' }
        ]
    },
    {
        nombre: 'Viajes',
        iconos: [
            { type: 'bx', name: 'bxs-plane' },
            { type: 'fa', name: 'fa-plane' },
            { type: 'bx', name: 'bx-map' },
            { type: 'bx', name: 'bxs-map' },
            { type: 'fa', name: 'fa-map' },
            { type: 'fa', name: 'fa-suitcase' },
            { type: 'bx', name: 'bx-compass' },
            { type: 'bx', name: 'bxs-compass' },
            { type: 'fa', name: 'fa-compass' }
        ]
    },
    {
        nombre: 'Oficina',
        iconos: [
            { type: 'bx', name: 'bx-briefcase' },
            { type: 'bx', name: 'bxs-briefcase' },
            { type: 'fa', name: 'fa-briefcase' },
            { type: 'bx', name: 'bx-printer' },
            { type: 'bx', name: 'bxs-printer' },
            { type: 'fa', name: 'fa-print' },
            { type: 'bx', name: 'bx-envelope' },
            { type: 'bx', name: 'bxs-envelope' },
            { type: 'fa', name: 'fa-envelope' },
            { type: 'bx', name: 'bx-file' },
            { type: 'bx', name: 'bxs-file' },
            { type: 'fa', name: 'fa-file-alt' }
        ]
    },
    {
        nombre: 'Fiesta',
        iconos: [
            { type: 'bx', name: 'bx-party' },
            { type: 'bx', name: 'bxs-party' },
            { type: 'fa', name: 'fa-glass-cheers' },
            { type: 'bx', name: 'bx-cake' },
            { type: 'bx', name: 'bxs-cake' },
            { type: 'fa', name: 'fa-birthday-cake' },
            { type: 'bx', name: 'bx-music' },
            { type: 'bx', name: 'bxs-music' },
            { type: 'fa', name: 'fa-music' },
            { type: 'bx', name: 'bx-drink' },
            { type: 'bx', name: 'bxs-drink' },
            { type: 'fa', name: 'fa-cocktail' }
        ]
    },
    {
        nombre: 'Naturaleza',
        iconos: [
            { type: 'bx', name: 'bx-leaf' },
            { type: 'bx', name: 'bxs-leaf' },
            { type: 'fa', name: 'fa-leaf' },
            { type: 'bx', name: 'bxs-tree' },
            { type: 'fa', name: 'fa-tree' },
            { type: 'bx', name: 'bx-water' },
            { type: 'fa', name: 'fa-tint' },
            { type: 'bx', name: 'bx-sun' },
            { type: 'bx', name: 'bxs-sun' },
            { type: 'fa', name: 'fa-sun' }
        ]
    },
    {
        nombre: 'Seguridad',
        iconos: [
            { type: 'bx', name: 'bx-shield' },
            { type: 'bx', name: 'bxs-shield' },
            { type: 'fa', name: 'fa-shield-alt' },
            { type: 'bx', name: 'bx-lock' },
            { type: 'bx', name: 'bxs-lock' },
            { type: 'fa', name: 'fa-lock' },
            { type: 'bx', name: 'bx-key' },
            { type: 'bx', name: 'bxs-key' },
            { type: 'fa', name: 'fa-key' },
            { type: 'bx', name: 'bx-fingerprint' },
            { type: 'fa', name: 'fa-fingerprint' }
        ]
    },
    {
        nombre: 'Religión',
        iconos: [
            { type: 'bx', name: 'bx-church' },
            { type: 'bx', name: 'bxs-church' },
            { type: 'fa', name: 'fa-church' },
            { type: 'fa', name: 'fa-praying-hands' },
            { type: 'bx', name: 'bx-cross' },
            { type: 'fa', name: 'fa-cross' },
            { type: 'bx', name: 'bx-star' },
            { type: 'bx', name: 'bxs-star' },
            { type: 'fa', name: 'fa-star-of-david' }
        ]
    },
    {
        nombre: 'Finanzas',
        iconos: [
            { type: 'bx', name: 'bx-money' },
            { type: 'fa', name: 'fa-money-bill' },
            { type: 'bx', name: 'bx-wallet' },
            { type: 'bx', name: 'bxs-wallet' },
            { type: 'fa', name: 'fa-wallet' },
            { type: 'bx', name: 'bx-credit-card' },
            { type: 'bx', name: 'bxs-credit-card' },
            { type: 'fa', name: 'fa-credit-card' },
            { type: 'bx', name: 'bx-bar-chart-alt-2' },
            { type: 'bx', name: 'bxs-bar-chart-alt-2' },
            { type: 'fa', name: 'fa-chart-bar' },
            { type: 'bx', name: 'bx-trending-up' },
            { type: 'fa', name: 'fa-chart-line' },
            { type: 'bx', name: 'bx-dollar' },
            { type: 'bx', name: 'bxs-dollar-circle' },
            { type: 'fa', name: 'fa-dollar-sign' },
            { type: 'bx', name: 'bx-yen' },
            { type: 'fa', name: 'fa-yen-sign' },
            { type: 'bx', name: 'bx-euro' },
            { type: 'fa', name: 'fa-euro-sign' },
            { type: 'bx', name: 'bx-pound' },
        ]
    }

];
const ICON_GROUPS = ICON_GROUPS_BASE;


function getAllIcons() {
    return ICON_GROUPS.flatMap(grupo => grupo.iconos);
}
function mostrarModalIconos(onSelect, sugerenciaIcono = null, sugerenciaColor = null, inputCategoria = null) {
    // Forzar blur de todos los inputs activos para cerrar teclado
    setTimeout(() => {
        document.querySelectorAll('input:focus').forEach(input => input.blur());
    }, 10);
    if (inputCategoria) inputCategoria.blur(); // Oculta teclado móvil (extra)
    let modal = document.querySelector('.modal-iconos-popover');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.className = 'modal-iconos-popover';
    // Modal estructura: preview, iconos, siguiente, colores, confirmar
    modal.innerHTML = `
        <div class="modal-step-title">Selecciona un icono </div>
        <div class="preview-icono"></div>
        <div class="iconos-grupos"></div>
        <button class="btn-siguiente" disabled>Siguiente</button>
        <div class="colores-list" style="display:none;"></div>
        <button class="btn-confirmar" style="display:none;" disabled>Confirmar</button>
        <button class="btn-cerrar">Cancelar</button>
    `;
    document.body.appendChild(modal);
    document.querySelector('.overlay2').classList.add('active');
    const iconosGrupos = modal.querySelector('.iconos-grupos');
    const coloresList = modal.querySelector('.colores-list');
    const preview = modal.querySelector('.preview-icono');
    let iconoSeleccionado = null;
    let iconoSeleccionadoTipo = 'bx';
    let colorSeleccionado = '#fff'; // Color por defecto blanco
    // Preview inicial
    function updatePreview() {
        if (!iconoSeleccionado) {
            preview.innerHTML = `<i class="bx bxs-circle" style="font-size:3.5em;color:${colorSeleccionado}"></i>`;
            return;
        }
        if (iconoSeleccionadoTipo === 'bx') {
            preview.innerHTML = `<i class="bx ${iconoSeleccionado}" style="font-size:3.5em;color:${colorSeleccionado}"></i>`;
        } else {
            preview.innerHTML = `<i class="fa-solid ${iconoSeleccionado}" style="font-size:3.5em;color:${colorSeleccionado}"></i>`;
        }
    }
    updatePreview();
    // Renderizar iconos agrupados
    iconosGrupos.innerHTML = '';
    ICON_GROUPS.forEach(grupo => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'icono-group';
        const title = document.createElement('div');
        title.className = 'icono-group-title';
        title.textContent = grupo.nombre;
        groupDiv.appendChild(title);
        const grid = document.createElement('div');
        grid.className = 'iconos-list';
        grupo.iconos.forEach(icono => {
            const btn = document.createElement('button');
            btn.className = 'icono-btn';
            if (icono.type === 'bx') {
                btn.innerHTML = `<i class="bx ${icono.name}"></i>`;
            } else {
                btn.innerHTML = `<i class="fa-solid ${icono.name}"></i>`;
            }
            btn.title = icono.name;
            btn.addEventListener('click', () => {
                iconoSeleccionado = icono.name;
                iconoSeleccionadoTipo = icono.type;
                iconosGrupos.querySelectorAll('button').forEach(b => b.classList.remove('seleccionado'));
                btn.classList.add('seleccionado');
                modal.querySelector('.btn-siguiente').disabled = false;
                updatePreview();
            });
            grid.appendChild(btn);
        });
        groupDiv.appendChild(grid);
        iconosGrupos.appendChild(groupDiv);
    });


    // Siguiente -> mostrar colores
    modal.querySelector('.btn-siguiente').addEventListener('click', () => {
        iconosGrupos.style.display = 'none';
        modal.querySelector('.btn-siguiente').style.display = 'none';
        coloresList.style.display = 'flex';
        modal.querySelector('.btn-confirmar').style.display = 'block';
        updatePreview();
    });
    // Paleta de colores
    CATEGORIA_COLORES.forEach(color => {
        const btn = document.createElement('button');
        btn.style.background = color;
        btn.className = 'color-btn';
        if (color === colorSeleccionado) btn.classList.add('seleccionado');
        btn.addEventListener('click', () => {
            colorSeleccionado = color;
            coloresList.querySelectorAll('button').forEach(b => b.classList.remove('seleccionado'));
            btn.classList.add('seleccionado');
            modal.querySelector('.btn-confirmar').disabled = false;
            updatePreview();
        });
        coloresList.appendChild(btn);
    });
    // Confirmar
    modal.querySelector('.btn-confirmar').addEventListener('click', () => {
        if (iconoSeleccionado && colorSeleccionado) {
            onSelect(`${iconoSeleccionadoTipo}:${iconoSeleccionado}`, colorSeleccionado);
            modal.remove();
            document.querySelector('.overlay2').classList.remove('active');
            document.removeEventListener('click', cerrarModalHandler);
            document.removeEventListener('keydown', escapeModalHandler);
        }
    });
    // Cancelar
    modal.querySelector('.btn-cerrar').addEventListener('click', () => {
        modal.remove();
        document.querySelector('.overlay2').classList.remove('active');
        document.removeEventListener('click', cerrarModalHandler);
        document.removeEventListener('keydown', escapeModalHandler);
    });
    // Cerrar al hacer click fuera
    const cerrarModalHandler = function (e) {
        if (!modal.contains(e.target) && !e.target.closest('.icono-categoria')) {
            modal.remove();
            document.querySelector('.overlay2').classList.remove('active');
            document.removeEventListener('click', cerrarModalHandler);
            document.removeEventListener('keydown', escapeModalHandler);
        }
    };

    // Cerrar con Escape
    const escapeModalHandler = function (e) {
        if (e.key === 'Escape') {
            e.stopPropagation();
            modal.remove();
            document.querySelector('.overlay2').classList.remove('active');
            document.removeEventListener('click', cerrarModalHandler);
            document.removeEventListener('keydown', escapeModalHandler);
        }
    };

    document.addEventListener('click', cerrarModalHandler);
    document.addEventListener('keydown', escapeModalHandler);
}