/* ===== INDEXEDDB ===== */
const STORE_TRANSACCIONES = 'transacciones';
const DB_NAME = 'KashlyDB';

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
async function renderTransacciones(categoriaId = null) {
    const cont = document.querySelector('.transacciones-container');
    if (!cont) return;
    cont.innerHTML = '';
    const [trans, categorias, etiquetas] = await Promise.all([
        obtenerTransaccionesBuscar(),
        obtenerCategoriasBuscar(),
        obtenerEtiquetasBuscar()
    ]);
    // Ordenar por fecha descendente (más reciente primero)
    let transaccionesFiltradas = trans;
    if (categoriaId) {
        transaccionesFiltradas = trans.filter(tr => tr.idCategoria === parseInt(categoriaId));
    }
    transaccionesFiltradas = transaccionesFiltradas.slice().sort((a, b) => {
        // Asumimos formato fecha d/m/Y
        const parseFecha = f => {
            if (!f) return 0;
            const [d, m, y] = f.split(/[\\/]/).map(Number);
            return new Date(y, m - 1, d).getTime();
        };
        return parseFecha(b.fecha) - parseFecha(a.fecha);
    });
    transaccionesFiltradas.forEach(tr => {
        const div = document.createElement('div');
        div.className = 'transaccion';
        // Determinar tipo y signo
        let esNegativo = tr.tipo === 'negativo';
        const icon = esNegativo ? '<i class="fa-solid fa-arrow-up negativo"></i>' : '<i class="fa-solid fa-arrow-down positivo"></i>';
        // Buscar nombre de categoría y etiqueta
        let nombreCat = '';
        let nombreEt = '';
        if (tr.idCategoria != null) {
            const cat = categorias.find(c => c.id === tr.idCategoria);
            if (cat) nombreCat = cat.nombre;
        }
        if (tr.idEtiqueta != null) {
            const et = etiquetas.find(e => e.id === tr.idEtiqueta);
            if (et) nombreEt = et.nombre;
        }
        div.innerHTML = `
            <div class="fecha-monto">
                <p>${tr.fecha || ''}</p>
                <p>${esNegativo ? '-' : '+'} Bs ${Number(tr.monto).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
            </div>
            <div class="descripcion">
                ${icon}
                <div class="detalle">
                    <p class="categoria">${nombreCat}</p>
                    <p class="descripcion">${tr.descripcion || ''}</p>
                    <p class="etiqueta">${nombreEt ? '#' + nombreEt : ''}</p>
                </div>
                <div class="botones">
                    <button>editar</button>
                </div>
            </div>
        `;
        div.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') e.stopPropagation();
            console.log('[buscar-trans] Click en transacción:', tr); // LOG
            window.dispatchEvent(new CustomEvent('editarTransaccion', { detail: tr }));
        });
        cont.appendChild(div);
    });
}
export function mostrarBuscarTrans() {
    const btnBuscarTrans = document.querySelector('.buscar');
    const buscarTransContainer = document.querySelector('.buscador-transacciones');
    const overlay = document.querySelector('.overlay');

    btnBuscarTrans.addEventListener('click', () => {
        buscarTransContainer.style.transform = 'translateY(0)';
        overlay.classList.add('active');
        // Restaurar título por defecto
        const titulo = buscarTransContainer.querySelector('.titulo p');
        if (titulo) titulo.textContent = 'Todas las transacciones';
        renderTransacciones();
    });
    
    // Escuchar evento para abrir con filtro de categoría
    window.addEventListener('abrirBuscadorConFiltro', (event) => {
        const { categoriaId, categoriaNombre } = event.detail;
        buscarTransContainer.style.transform = 'translateY(0)';
        // Cambiar título al nombre de la categoría
        const titulo = buscarTransContainer.querySelector('.titulo p');
        if (titulo) titulo.textContent = categoriaNombre;
        renderTransacciones(categoriaId);
    });
    
    ascensorAjustes(buscarTransContainer);
}

window.addEventListener('transaccionEliminadaUI', (event) => {
    const tr = event.detail;
    const cont = document.querySelector('.transacciones-container');
    if (!cont) return;
    const items = Array.from(cont.querySelectorAll('.transaccion'));
    const item = items.find(div => {
        const desc = div.querySelector('.descripcion .detalle .descripcion');
        return desc && desc.textContent === (tr.descripcion || '');
    });
    if (item) {
        item.style.transition = 'height 0.3s, margin 0.3s, opacity 0.3s';
        item.style.overflow = 'hidden';
        item.style.height = item.offsetHeight + 'px';
        setTimeout(() => {
            item.style.height = '0px';
            item.style.margin = '0px';
            item.style.opacity = '0';
        }, 10);
        setTimeout(() => {
            if (item.parentNode) item.parentNode.removeChild(item);
        }, 350);
    }
});
window.addEventListener('transaccionRestauradaUI', (event) => {
    const tr = event.detail;
    const cont = document.querySelector('.transacciones-container');
    if (!cont) return;
    // Crear el div de la transacción restaurada igual que en renderTransacciones
    const div = document.createElement('div');
    div.className = 'transaccion';
    let esNegativo = tr.tipo === 'negativo';
    const icon = esNegativo ? '<i class="fa-solid fa-arrow-up negativo"></i>' : '<i class="fa-solid fa-arrow-down positivo"></i>';
    let nombreCat = tr.categoriaNombre || (tr.idCategoria ? 'Categoría ' + tr.idCategoria : '');
    let nombreEt = tr.etiquetaNombre || (tr.idEtiqueta ? 'Etiqueta ' + tr.idEtiqueta : '');
    div.innerHTML = `
        <div class="fecha-monto">
            <p>${tr.fecha || ''}</p>
            <p>${esNegativo ? '-' : '+'} Bs ${Number(tr.monto).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
        </div>
        <div class="descripcion">
            ${icon}
            <div class="detalle">
                <p class="categoria">${nombreCat}</p>
                <p class="descripcion">${tr.descripcion || ''}</p>
                <p class="etiqueta">${nombreEt ? '#' + nombreEt : ''}</p>
            </div>
            <div class="botones">
                <button>editar</button>
            </div>
        </div>
    `;
    div.style.height = '0px';
    div.style.margin = '0px';
    div.style.opacity = '0';
    // Insertar en la posición correcta según la fecha
    const parseFecha = f => {
        if (!f) return 0;
        const [d, m, y] = f.split(/[\\/]/).map(Number);
        return new Date(y, m - 1, d).getTime();
    };
    const nuevaFecha = parseFecha(tr.fecha);
    let insertado = false;
    const transDivs = Array.from(cont.querySelectorAll('.transaccion'));
    for (let i = 0; i < transDivs.length; i++) {
        const fechaDiv = transDivs[i].querySelector('.fecha-monto p');
        if (fechaDiv) {
            const fechaExistente = fechaDiv.textContent;
            if (parseFecha(fechaExistente) < nuevaFecha) {
                cont.insertBefore(div, transDivs[i]);
                insertado = true;
                break;
            }
        }
    }
    if (!insertado) cont.appendChild(div);
    setTimeout(() => {
        div.style.transition = 'height 0.3s, margin 0.3s, opacity 0.3s';
        div.style.height = '';
        div.style.margin = '';
        div.style.opacity = '1';
    }, 10);
    div.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') e.stopPropagation();
        window.dispatchEvent(new CustomEvent('editarTransaccion', { detail: tr }));
    });
});

window.addEventListener('transaccionEditadaUI', () => {
    renderTransacciones();
});

