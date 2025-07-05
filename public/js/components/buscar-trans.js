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

/* ===== FUNCIONES DE ORDENAMIENTO ===== */
function ordenarTransacciones(transacciones) {
    return transacciones.slice().sort((a, b) => {
        // Primero ordenar por fecha (más reciente primero)
        const parseFecha = f => {
            if (!f) return 0;
            const [d, m, y] = f.split(/[\\/]/).map(Number);
            return new Date(y, m - 1, d).getTime();
        };
        const fechaA = parseFecha(a.fecha);
        const fechaB = parseFecha(b.fecha);
        
        if (fechaB !== fechaA) {
            return fechaB - fechaA; // Más reciente primero
        }
        
        // Si las fechas son iguales, ordenar por ID (mayor primero)
        return (b.id || 0) - (a.id || 0);
    });
}

/* ===== FUNCIONES DE FECHA ===== */
function formatearFechaSubtitulo(fecha) {
    if (!fecha) return 'Sin fecha';
    
    const [dia, mes, año] = fecha.split(/[\\/]/).map(Number);
    const fechaObj = new Date(año, mes - 1, dia);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    const anteayer = new Date(hoy);
    anteayer.setDate(hoy.getDate() - 2);
    
    // Comparar solo fecha (sin hora)
    const fechaComparar = new Date(fechaObj.getFullYear(), fechaObj.getMonth(), fechaObj.getDate());
    const hoyComparar = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const ayerComparar = new Date(ayer.getFullYear(), ayer.getMonth(), ayer.getDate());
    const anteayerComparar = new Date(anteayer.getFullYear(), anteayer.getMonth(), anteayer.getDate());
    
    if (fechaComparar.getTime() === hoyComparar.getTime()) {
        return 'Hoy';
    } else if (fechaComparar.getTime() === ayerComparar.getTime()) {
        return 'Ayer';
    } else if (fechaComparar.getTime() === anteayerComparar.getTime()) {
        return 'Anteayer';
    } else {
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${diasSemana[fechaObj.getDay()]} ${dia} de ${meses[fechaObj.getMonth()]}`;
    }
}

function agruparPorFecha(transacciones) {
    const grupos = {};
    
    transacciones.forEach(tr => {
        const fechaSubtitulo = formatearFechaSubtitulo(tr.fecha);
        if (!grupos[fechaSubtitulo]) {
            grupos[fechaSubtitulo] = [];
        }
        grupos[fechaSubtitulo].push(tr);
    });
    
    return grupos;
}

function calcularTotalDia(transacciones) {
    let total = 0;
    transacciones.forEach(tr => {
        if (tr.tipo === 'positivo') {
            total += Number(tr.monto);
        } else if (tr.tipo === 'negativo') {
            total -= Number(tr.monto);
        }
    });
    return total;
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
    
    // Filtrar por categoría si se especifica
    let transaccionesFiltradas = trans;
    if (categoriaId) {
        transaccionesFiltradas = trans.filter(tr => tr.idCategoria === parseInt(categoriaId));
    }
    
    // Aplicar filtro activo si existe
    if (filtroActivo) {
        transaccionesFiltradas = transaccionesFiltradas.filter(tr => {
            const textoCompleto = [
                tr.descripcion || '',
                tr.fecha || '',
                tr.monto?.toString() || '',
                categorias.find(c => c.id === tr.idCategoria)?.nombre || '',
                etiquetas.find(e => e.id === tr.idEtiqueta)?.nombre || ''
            ].join(' ').toLowerCase();
            
            return textoCompleto.includes(filtroActivo.toLowerCase());
        });
    }
    
    // Ordenar transacciones
    transaccionesFiltradas = ordenarTransacciones(transaccionesFiltradas);
    
    // Agrupar por fecha
    const gruposPorFecha = agruparPorFecha(transaccionesFiltradas);
    
    // Renderizar grupos
    Object.keys(gruposPorFecha).forEach(fechaSubtitulo => {
        const transaccionesDelDia = gruposPorFecha[fechaSubtitulo];
        const totalDia = calcularTotalDia(transaccionesDelDia);
        
        // Crear subtítulo con total del día
        const subtituloDiv = document.createElement('div');
        subtituloDiv.className = 'fecha-subtitulo';
        subtituloDiv.innerHTML = `
            <h3>${fechaSubtitulo}</h3>
            <span class="total-dia">${totalDia > 0 ? '+' : ''}${totalDia.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})} Bs</span>
        `;
        cont.appendChild(subtituloDiv);
        
        // Renderizar transacciones del día
        transaccionesDelDia.forEach(tr => {
            const div = document.createElement('div');
            div.className = 'transaccion';
            
            // Buscar nombre de categoría y etiqueta
            let nombreCat = '';
            let nombreEt = '';
            let iconoCategoria = '';
            let colorCategoria = '#888';
            
            if (tr.idCategoria != null) {
                const cat = categorias.find(c => c.id === tr.idCategoria);
                if (cat) {
                    nombreCat = cat.nombre;
                    colorCategoria = cat.color || '#888';
                    
                    // Generar icono de categoría
                    if (cat.icono && cat.icono.startsWith('bx:')) {
                        iconoCategoria = `<i class="bx ${cat.icono.split(':')[1]}" style="color:${colorCategoria};font-size:1.2em;"></i>`;
                    } else if (cat.icono && cat.icono.startsWith('fa:')) {
                        iconoCategoria = `<i class="fa-solid ${cat.icono.split(':')[1]}" style="color:${colorCategoria};font-size:1.2em;"></i>`;
                    } else {
                        iconoCategoria = `<i class="fa-solid fa-tag" style="color:${colorCategoria};font-size:1.2em;"></i>`;
                    }
                }
            }
            
            if (tr.idEtiqueta != null) {
                const et = etiquetas.find(e => e.id === tr.idEtiqueta);
                if (et) nombreEt = et.nombre;
            }
            
            div.innerHTML = `
                <div class="descripcion">
                    <div class="icono-transaccion" style="background-color: ${colorCategoria}20;">
                        ${iconoCategoria}
                    </div>
                    <div class="detalle">
                        <p class="categoria">${nombreCat}</p>
                        <p class="descripcion">${tr.descripcion || ''}</p>
                        ${nombreEt ? `<p class="etiqueta">${nombreEt ? '#' + nombreEt : ''}</p>` : ''}
                    </div>
                    <div class="botones">
                        <button class="btn-editar">${tr.tipo === 'negativo' ? '-' : '+'} Bs ${Number(tr.monto).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}</button>
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
    });
    
    // Actualizar totales del dashboard si hay filtro activo
    if (filtroActivo || categoriaId) {
        actualizarTotalesFiltrados(transaccionesFiltradas);
    }
}

// Variable para controlar si ya se inicializaron los listeners
let listenersBuscarTransInicializados = false;

export function mostrarBuscarTrans() {
    // Evitar inicialización múltiple
    if (listenersBuscarTransInicializados) return;
    listenersBuscarTransInicializados = true;
    
    const btnBuscarTrans = document.querySelector('.buscar');
    const buscarTransContainer = document.querySelector('.buscador-transacciones');
    const overlay = document.querySelector('.overlay');
    const input = document.querySelector('.search input');
    const btnCerrar = document.querySelector('.buscador-transacciones .cerrar');

    btnBuscarTrans.addEventListener('click', () => {
        buscarTransContainer.style.transform = 'translateY(0)';
        overlay.classList.add('active');
        
        // Restaurar título por defecto
        const titulo = buscarTransContainer.querySelector('.titulo p');
        if (titulo) titulo.textContent = 'Todas las transacciones';
        
        // Limpiar filtros
        filtroActivo = '';
        categoriaFiltroActiva = null;
        input.value = '';
        
        renderTransacciones();
        
        // Agregar escape handler cuando se abre
        agregarEscapeHandler();
    });
    
    function normalizarTexto(texto) {
        return texto
          .toLowerCase()                                  
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
          .trim()                                         
          .replace(/\s+/g, "-")                           
          .replace(/-+/g, "-");                           
      }
      
    // Búsqueda en tiempo real
    input.addEventListener('input', (e) => {
        const busqueda = normalizarTexto(e.target.value.trim());
        filtroActivo = busqueda;
        
        if (busqueda) {
            buscarTransacciones(busqueda);
        } else {
            renderTransacciones(categoriaFiltroActiva);
        }
    });
    
    // Botón cerrar
    btnCerrar.addEventListener('click', () => {
        // Limpiar filtros y restaurar normalidad
        filtroActivo = '';
        categoriaFiltroActiva = null;
        input.value = '';
        
        // Restaurar totales originales
        if (typeof window.actualizarDashboard === 'function') {
            window.actualizarDashboard();
        }
        
        buscarTransContainer.style.transform = 'translateY(100%)';
        overlay.classList.remove('active');
    });
    
    // Cerrar con overlay
    overlay.addEventListener('click', () => {
        if (buscarTransContainer.style.transform === 'translateY(0px)') {
            // Limpiar filtros y restaurar normalidad
            filtroActivo = '';
            categoriaFiltroActiva = null;
            input.value = '';
            
            // Restaurar totales originales
            if (typeof window.actualizarDashboard === 'function') {
                window.actualizarDashboard();
            }
            
            buscarTransContainer.style.transform = 'translateY(100%)';
            overlay.classList.remove('active');
        }
    });
    
    // Cerrar con Escape key - Solo cuando el buscador está abierto
    const escapeHandler = (e) => {
        if (e.key === 'Escape' && buscarTransContainer.style.transform === 'translateY(0px)') {
            // Limpiar filtros y restaurar normalidad
            filtroActivo = '';
            categoriaFiltroActiva = null;
            input.value = '';
            
            // Restaurar totales originales
            if (typeof window.actualizarDashboard === 'function') {
                window.actualizarDashboard();
            }
            
            buscarTransContainer.style.transform = 'translateY(100%)';
            overlay.classList.remove('active');
            
            // Remover el escape handler cuando se cierra
            removerEscapeHandler();
        }
    };
    
    // Función para agregar el escape handler
    function agregarEscapeHandler() {
        document.addEventListener('keydown', escapeHandler);
    }
    
    // Función para remover el escape handler
    function removerEscapeHandler() {
        document.removeEventListener('keydown', escapeHandler);
    }
    

    
    // Remover el event listener cuando se cierra el buscador
    btnCerrar.addEventListener('click', () => {
        removerEscapeHandler();
    });
    
    overlay.addEventListener('click', () => {
        if (buscarTransContainer.style.transform === 'translateY(0px)') {
            removerEscapeHandler();
        }
    });
    
    // Escuchar evento para abrir con filtro de categoría
    window.addEventListener('abrirBuscadorConFiltro', (event) => {
        const { categoriaId, categoriaNombre } = event.detail;
        buscarTransContainer.style.transform = 'translateY(0)';
        overlay.classList.add('active');
        
        // Cambiar título al nombre de la categoría
        const titulo = buscarTransContainer.querySelector('.titulo p');
        if (titulo) titulo.textContent = categoriaNombre;
        
        // Establecer filtro de categoría persistente
        categoriaFiltroActiva = categoriaId;
        filtroActivo = '';
        input.value = '';
        
        renderTransacciones(categoriaId);
    });
}

async function buscarTransacciones(termino) {
    function normalizarTexto(texto) {
        return texto
          .toLowerCase()                                 
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
          .trim()                                         
          .replace(/\s+/g, "-")                           
          .replace(/-+/g, "-");                           
      }
    const cont = document.querySelector('.transacciones-container');
    if (!cont) return;
    cont.innerHTML = '';
    
    const [trans, categorias, etiquetas] = await Promise.all([
        obtenerTransaccionesBuscar(),
        obtenerCategoriasBuscar(),
        obtenerEtiquetasBuscar()
    ]);
    
    // Filtrar transacciones
    let transaccionesFiltradas = trans;
    
    // Primero filtrar por categoría si está activa
    if (categoriaFiltroActiva) {
        transaccionesFiltradas = transaccionesFiltradas.filter(tr => tr.idCategoria === parseInt(categoriaFiltroActiva));
    }
    
    // Luego filtrar por término de búsqueda
    transaccionesFiltradas = transaccionesFiltradas.filter(tr => {
        const textoCompleto = [
            tr.descripcion || '',
            tr.fecha || '',
            tr.monto?.toString() || '',
            categorias.find(c => c.id === tr.idCategoria)?.nombre || '',
            etiquetas.find(e => e.id === tr.idEtiqueta)?.nombre || ''
        ].join(' ');
    
        // Normaliza ambos
        const textoNormalizado = normalizarTexto(textoCompleto);
        const terminoNormalizado = normalizarTexto(termino);
    
        return textoNormalizado.includes(terminoNormalizado);
    });
    
    
    // Ordenar transacciones
    const transaccionesOrdenadas = ordenarTransacciones(transaccionesFiltradas);
    
    // Agrupar por fecha
    const gruposPorFecha = agruparPorFecha(transaccionesOrdenadas);
    
    // Renderizar grupos
    Object.keys(gruposPorFecha).forEach(fechaSubtitulo => {
        const transaccionesDelDia = gruposPorFecha[fechaSubtitulo];
        const totalDia = calcularTotalDia(transaccionesDelDia);
        
        // Crear subtítulo con total del día
        const subtituloDiv = document.createElement('div');
        subtituloDiv.className = 'fecha-subtitulo';
        subtituloDiv.innerHTML = `
            <h3>${fechaSubtitulo}</h3>
            <span class="total-dia">${totalDia > 0 ? '+' : ''}${totalDia.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})} Bs</span>
        `;
        cont.appendChild(subtituloDiv);
        
        // Crear transacciones
        transaccionesDelDia.forEach(tr => {
            const div = document.createElement('div');
            div.className = 'transaccion';
            
            // Buscar nombre de categoría y etiqueta
            let nombreCat = '';
            let nombreEt = '';
            let iconoCategoria = '';
            let colorCategoria = '#888';
            
            if (tr.idCategoria != null) {
                const cat = categorias.find(c => c.id === tr.idCategoria);
                if (cat) {
                    nombreCat = cat.nombre;
                    colorCategoria = cat.color || '#888';
                    
                    // Generar icono de categoría
                    if (cat.icono && cat.icono.startsWith('bx:')) {
                        iconoCategoria = `<i class="bx ${cat.icono.split(':')[1]}" style="color:${colorCategoria};font-size:1.2em;"></i>`;
                    } else if (cat.icono && cat.icono.startsWith('fa:')) {
                        iconoCategoria = `<i class="fa-solid ${cat.icono.split(':')[1]}" style="color:${colorCategoria};font-size:1.2em;"></i>`;
                    } else {
                        iconoCategoria = `<i class="fa-solid fa-tag" style="color:${colorCategoria};font-size:1.2em;"></i>`;
                    }
                }
            }
            
            if (tr.idEtiqueta != null) {
                const et = etiquetas.find(e => e.id === tr.idEtiqueta);
                if (et) nombreEt = et.nombre;
            }
            
            div.innerHTML = `
                <div class="descripcion">
                    <div class="icono-transaccion" style="background-color: ${colorCategoria}20;">
                        ${iconoCategoria}
                    </div>
                    <div class="detalle">
                        <p class="categoria">${nombreCat}</p>
                        <p class="descripcion">${tr.descripcion || ''}</p>
                        ${nombreEt ? `<p class="etiqueta">${nombreEt ? '#' + nombreEt : ''}</p>` : ''}
                    </div>
                    <div class="botones">
                        <button class="btn-editar">${tr.tipo === 'negativo' ? '-' : '+'} Bs ${Number(tr.monto).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}</button>
                    </div>
                </div>
            `;
            
            div.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') e.stopPropagation();
                window.dispatchEvent(new CustomEvent('editarTransaccion', { detail: tr }));
            });
            
            cont.appendChild(div);
        });
    });
    
    // Actualizar totales del dashboard
    actualizarTotalesFiltrados(transaccionesOrdenadas);
}

function actualizarTotalesFiltrados(transacciones) {
    let totalPositivo = 0;
    let totalNegativo = 0;
    
    transacciones.forEach(tr => {
        if (tr.tipo === 'negativo') totalNegativo += Number(tr.monto);
        if (tr.tipo === 'positivo') totalPositivo += Number(tr.monto);
    });
    
    const total = totalPositivo - totalNegativo;
    
    // Actualizar botones principales del dashboard
    const btnNegativo = document.querySelector('.main .tipo .negativo');
    const btnPositivo = document.querySelector('.main .tipo .positivo');
    const totalNumber = document.querySelector('.main .total-number');
    
    if (btnNegativo) btnNegativo.innerHTML = `- Bs ${totalNegativo.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    if (btnPositivo) btnPositivo.innerHTML = `+ Bs ${totalPositivo.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    if (totalNumber) {
        totalNumber.innerHTML = `${total > 0 ? '+' : ''}${total.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})} <span>Bs</span>`;
        totalNumber.dataset.raw = total;
    }
}

window.addEventListener('transaccionEliminadaUI', (event) => {
    const tr = event.detail;
    
    // Re-renderizar la lista completa para mantener el orden correcto
    if (filtroActivo) {
        buscarTransacciones(filtroActivo);
    } else {
        renderTransacciones(categoriaFiltroActiva);
    }
});

window.addEventListener('transaccionRestauradaUI', async (event) => {
    const tr = event.detail;
    
    // Simplemente re-renderizar la lista completa para mantener el orden correcto
    if (filtroActivo) {
        buscarTransacciones(filtroActivo);
    } else {
        renderTransacciones(categoriaFiltroActiva);
    }
});

window.addEventListener('transaccionEditadaUI', () => {
    // Re-renderizar la lista completa para mantener el orden correcto
    if (filtroActivo) {
        buscarTransacciones(filtroActivo);
    } else {
        renderTransacciones(categoriaFiltroActiva);
    }
});

// Función específica para actualizar pilares
export function actualizarPilares() {
    if (typeof window.actualizarDashboard === 'function') {
        window.actualizarDashboard();
    }
}

// Exportar funciones de IndexedDB
export { obtenerCategoriasBuscar, obtenerEtiquetasBuscar };