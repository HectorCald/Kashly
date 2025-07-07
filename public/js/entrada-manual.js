/* ===== INDEXEDDB ===== */
const DB_NAME = 'KashlyDB';
const BASE_VERSION = 1;
const STORE_CATEGORIAS = 'categorias';
const STORE_ETIQUETAS = 'etiquetas';
const STORE_TRANSACCIONES = 'transacciones';


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
            resolve(e.target.result.version);
        };
    });
}
function openDB(requiredStores = []) {
    return getCurrentVersion().then(currentVersion => {
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

/* ===== ENTRADA MANUAL ===== */
export function mostrarEntradaManual() {
    const btnEntradaManual = document.querySelector('.entradas .entrada-manual-btn');
    const entradaManualContainer = document.querySelector('.entrada-manual');
    const overlay2 = document.querySelector('.overlay2');

    btnEntradaManual.addEventListener('click', () => {
        entradaManualContainer.style.transform = 'translateY(0)';
        renderCategoriasEntrada();
        renderEtiquetasEntrada();
        overlay2.classList.add('active');
    });

    eventosEntradaManual();
}
function eventosEntradaManual() {
    const btnEntradaManual = document.querySelector('.entradas button:nth-child(2)');
    const entradaManualContainer = document.querySelector('.entrada-manual');
    const descripcion = document.querySelector('.entrada-manual .content-entrada .monto .descripcion');
    const monto = document.querySelector('.entrada-manual .content-entrada .monto .monto-input');
    const tipoMonto = document.querySelector('.entrada-manual .content-entrada .monto .tipo-monto-container');
    const btnTipoMontoNegativo = document.querySelector('.entrada-manual .content-entrada .monto .tipo-monto-container .tipo-monto button.negativo');
    const btnTipoMontoPositivo = document.querySelector('.entrada-manual .content-entrada .monto .tipo-monto-container .tipo-monto button.positivo');
    const bsPrefix = document.querySelector('.entrada-manual .content-entrada .monto .tipo-monto-container .bs-prefix');
    const btnGuardar = document.querySelector('.entrada-manual .guardar');

    // Calendario con flatpickr para el botón Hoy
    const btnFecha = document.querySelector('.entrada-manual .fecha-recurrencia .fecha');
    const inputFecha = document.querySelector('.entrada-manual .fecha-recurrencia .input-fecha');
    let picker;

    btnEntradaManual.addEventListener('click', () => {
        entradaManualContainer.style.transform = 'translateY(0)';
        setTimeout(() => {
            descripcion.focus();
        }, 200);
    });
    monto.addEventListener('input', (e) => {
        let valor = monto.value;
        // Permitir solo números, puntos y comas
        valor = valor.replace(/[^\d.,]/g, '');
        // Detectar si hay coma (decimal)
        let [parteEntera, parteDecimal] = valor.split(',');
        parteEntera = parteEntera ? parteEntera.replace(/\D/g, '') : '';
        parteDecimal = parteDecimal !== undefined ? parteDecimal.replace(/\D/g, '').slice(0,2) : undefined;
        // Formatea la parte entera con puntos de miles
        let formateado = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        if (valor.includes(',')) {
            formateado += ',';
            if (parteDecimal !== undefined) {
                formateado += parteDecimal;
            }
        }
        monto.value = formateado;
        // Muestra/oculta el prefijo Bs
        if (formateado !== '') {
            if (bsPrefix) bsPrefix.style.display = 'block';
            tipoMonto.style.transform = 'translateX(0)';
        } else {
            if (bsPrefix) bsPrefix.style.display = 'none';
            tipoMonto.style.transform = 'translateX(-95px)';
        }
        // Valor real: parteEntera + '.' + parteDecimal
        let valorReal = parteEntera;
        if (valor.includes(',')) {
            valorReal += '.' + (parteDecimal !== undefined ? parteDecimal : '');
        }
        monto.dataset.raw = valorReal;
    });
    btnTipoMontoNegativo.addEventListener('click', () => {
        btnTipoMontoNegativo.classList.add('active');
        btnTipoMontoPositivo.classList.remove('active');
    });
    btnTipoMontoPositivo.addEventListener('click', () => {
        btnTipoMontoPositivo.classList.add('active');
        btnTipoMontoNegativo.classList.remove('active');
    });
    
    

    btnFecha.addEventListener('click', () => {
        if (picker) picker.open();
    });
    if (btnFecha && window.flatpickr) {
        picker = flatpickr(inputFecha, {
            dateFormat: "d/m/Y",
            defaultDate: new Date(),
            onChange: function(selectedDates, dateStr) {
                if (!selectedDates || !selectedDates[0]) {
                    btnFecha.textContent = "Hoy";
                    return;
                }
                const selected = selectedDates[0];
                const now = new Date();
                const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const ayer = new Date(hoy);
                ayer.setDate(hoy.getDate() - 1);
                const manana = new Date(hoy);
                manana.setDate(hoy.getDate() + 1);
                // Comparar solo año, mes y día
                function sameDay(a, b) {
                    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
                }
                if (sameDay(selected, hoy)) {
                    btnFecha.textContent = "Hoy";
                } else if (sameDay(selected, ayer)) {
                    btnFecha.textContent = "Ayer";
                } else if (sameDay(selected, manana)) {
                    btnFecha.textContent = "Mañana";
                } else {
                    btnFecha.textContent = dateStr;
                }
            },
            appendTo: btnFecha.parentElement,
            positionElement: btnFecha,
            theme: 'dark',
            onOpen: function(selectedDates, dateStr, instance) {
                setTimeout(() => {
                    if (instance.calendarContainer) {
                        instance.calendarContainer.classList.add('dark');
                    }
                }, 0);
            }
        });
    }


    btnGuardar.addEventListener('click', async () => {
        // Obtener datos
        const fecha = document.querySelector('.entrada-manual .input-fecha').value || new Date().toLocaleDateString('es-ES');
        const descripcionVal = descripcion.value.trim();
        const montoVal = parseFloat(monto.dataset.raw || '0');
        // Buscar categoría y etiqueta activas
        const catBtn = document.querySelector('.entrada-manual .categorias button.muestra-categoria');
        const etBtn = document.querySelector('.entrada-manual .etiquetas button.muestra-categoria');
        // Buscar idCategoria y idEtiqueta
        let idCategoria = null, idEtiqueta = null, nombreCategoria = '', nombreEtiqueta = '';
        if (catBtn) {
            const nombre = catBtn.textContent.replace(/^[^\wáéíóúüñ]+/i, '').trim();
            const cats = await obtenerCategoriasEntrada();
            const cat = cats.find(c => c.nombre === nombre);
            if (cat) { idCategoria = cat.id; nombreCategoria = cat.nombre; }
        }
        if (etBtn) {
            const nombre = etBtn.textContent.replace(/^#/, '').trim();
            const ets = await obtenerEtiquetasEntrada();
            const et = ets.find(e => e.nombre === nombre);
            if (et) { idEtiqueta = et.id; nombreEtiqueta = et.nombre; }
        }
        // Validaciones
        if (!idCategoria) {
            mostrarToast('Selecciona una categoría', 'error');
            return;
        }
        if (!descripcionVal || descripcionVal.length < 1) {
            mostrarToast('Agrega una descripción', 'error');
            return;
        }
        if (isNaN(montoVal) || montoVal < 1) {
            mostrarToast('El monto debe ser al menos 1', 'error');
            return;
        }
        // Determinar tipo
        let tipo = 'negativo';
        if (btnTipoMontoPositivo.classList.contains('active')) tipo = 'positivo';
        // Guardar transacción
        await guardarTransaccion({fecha, descripcion: descripcionVal, monto: montoVal, idCategoria, idEtiqueta, tipo});
        // Cerrar entrada manual
        document.querySelector('.entrada-manual').style.transform = 'translateY(100%)';
        // Notificación - Verde para ingresos, rojo para gastos
        if (nombreCategoria && montoVal) {
            const tipoNotificacion = tipo === 'positivo' ? 'success' : 'error';
            mostrarToast(`${nombreCategoria} ${tipo==='positivo'?'+':'-'}${montoVal}`, tipoNotificacion);
        } else if (montoVal) {
            const tipoNotificacion = tipo === 'positivo' ? 'success' : 'error';
            mostrarToast(`${tipo==='positivo'?'+':'-'}${montoVal}`, tipoNotificacion);
        } else {
            mostrarToast('Guardado', 'success');
        }
        // Limpiar campos
        descripcion.value = '';
        monto.value = '';
        monto.dataset.raw = '';
        tipoMonto.style.transform = 'translateX(-95px)';
        bsPrefix.style.display = 'none';
        // Quitar selección
        document.querySelectorAll('.entrada-manual .categorias button').forEach(b=>b.classList.remove('muestra-categoria','oculta-categoria'));
        document.querySelectorAll('.entrada-manual .etiquetas button').forEach(b=>b.classList.remove('muestra-categoria','oculta-categoria'));
        // Despacha evento para actualizar dashboard
        console.log('📤 Disparando evento transaccionGuardada');
        window.dispatchEvent(new Event('transaccionGuardada'));
        document.querySelector('.overlay2').classList.remove('active');
        resetearEntradaManual();
    });

    // Previene que el teclado se cierre o abra al presionar botones de tipo
    [btnTipoMontoNegativo, btnTipoMontoPositivo].forEach(btn => {
        btn.addEventListener('pointerdown', e => {
            e.preventDefault();
        });
    });
}

export function resetearEntradaManual() {
    // Limpiar campos
    const inputFecha = document.querySelector('.entrada-manual .input-fecha');
    const btnFecha = document.querySelector('.entrada-manual .fecha-recurrencia .fecha');
    const descripcion = document.querySelector('.entrada-manual .content-entrada .monto .descripcion');
    const monto = document.querySelector('.entrada-manual .content-entrada .monto .monto-input');
    const tipoMonto = document.querySelector('.entrada-manual .content-entrada .monto .tipo-monto-container');
    const bsPrefix = document.querySelector('.entrada-manual .content-entrada .monto .tipo-monto-container .bs-prefix');
    const btnTipoMontoNegativo = document.querySelector('.entrada-manual .content-entrada .monto .tipo-monto-container .tipo-monto button.negativo');
    const btnTipoMontoPositivo = document.querySelector('.entrada-manual .content-entrada .monto .tipo-monto-container .tipo-monto button.positivo');
    const btnGuardar = document.querySelector('.entrada-manual .guardar');
    // Limpiar valores
    if (inputFecha) inputFecha.value = '';
    if (btnFecha) btnFecha.textContent = 'Hoy';
    if (descripcion) descripcion.value = '';
    if (monto) { monto.value = ''; monto.dataset.raw = ''; }
    if (tipoMonto) tipoMonto.style.transform = 'translateX(-95px)';
    if (bsPrefix) bsPrefix.style.display = 'none';
    if (btnTipoMontoNegativo) btnTipoMontoNegativo.classList.add('active');
    if (btnTipoMontoPositivo) btnTipoMontoPositivo.classList.remove('active');
    // Quitar selección de categorías y etiquetas
    document.querySelectorAll('.entrada-manual .categorias button').forEach(b=>b.classList.remove('muestra-categoria','oculta-categoria'));
    document.querySelectorAll('.entrada-manual .etiquetas button').forEach(b=>b.classList.remove('muestra-categoria','oculta-categoria'));
    // Ocultar botones de edición y mostrar guardar
    ocultarBotonesEdicion();
    if (btnGuardar) btnGuardar.style.display = '';
    // Resetear variables de edición
    modoEdicion = false;
    transaccionEditando = null;
}

/* ===== ANIMACIONES ===== */
// Variables globales para animación de categorías/etiquetas y handlers
let categoriaActiva = null;
let etiquetaActiva = null;
let handlerCategorias = null;
let handlerEtiquetas = null;

async function renderCategoriasEntrada() {
    const categoriasDiv = document.querySelector('.entrada-manual .content-entrada .categorias');
    categoriasDiv.innerHTML = '';
    const categorias = await obtenerCategoriasEntrada();
    categorias.forEach(cat => {
        const btn = document.createElement('button');
        let iconHtml = '';
        if (cat.icono && cat.icono.startsWith('bx:')) {
            iconHtml = `<i class="bx ${cat.icono.split(':')[1]}" style="color:${cat.color || '#888'}"></i>`;
        } else if (cat.icono && cat.icono.startsWith('fa:')) {
            iconHtml = `<i class="fa-solid ${cat.icono.split(':')[1]}" style="color:${cat.color || '#888'}"></i>`;
        } else {
            iconHtml = `<i class="fa-solid fa-tag" style="color:${cat.color || '#888'}"></i>`;
        }
        btn.innerHTML = `${iconHtml} ${cat.nombre}`;
        categoriasDiv.appendChild(btn);
    });
    // Resetear variable y handler
    categoriaActiva = null;
    if (handlerCategorias) categoriasDiv.removeEventListener('click', handlerCategorias);
    handlerCategorias = function handler(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const categoriaBtns = Array.from(categoriasDiv.querySelectorAll('button'));
        
        // Si el botón ya está activo, deseleccionar todo
        if (btn === categoriaActiva) {
            categoriaBtns.forEach(b => {
                b.classList.remove('oculta-categoria');
                b.classList.add('muestra-categoria');
            });
            categoriaActiva = null;
            return;
        }
        
        // Si hay solo una categoría visible y es la que se está clickeando, deseleccionar
        const categoriasVisibles = categoriaBtns.filter(b => b.classList.contains('muestra-categoria'));
        if (categoriasVisibles.length === 1 && categoriasVisibles[0] === btn) {
            categoriaBtns.forEach(b => {
                b.classList.remove('oculta-categoria');
                b.classList.add('muestra-categoria');
            });
            categoriaActiva = null;
            return;
        }
        
        // Seleccionar la nueva categoría
        categoriaBtns.forEach(b => {
            if (b !== btn) {
                b.classList.remove('muestra-categoria');
                b.classList.add('oculta-categoria');
            } else {
                b.classList.remove('oculta-categoria');
                b.classList.add('muestra-categoria');
            }
        });
        
        // Mover al inicio y hacer scroll con delay
        categoriasDiv.insertBefore(btn, categoriasDiv.firstChild);
        setTimeout(() => {
            btn.scrollIntoView({behavior: 'smooth', inline: 'start', block: 'nearest'});
        }, 50);
        categoriaActiva = btn;
    };
    categoriasDiv.addEventListener('click', handlerCategorias);
    categoriasDiv.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) e.preventDefault();
    });
}

async function renderEtiquetasEntrada() {
    const etiquetasDiv = document.querySelector('.entrada-manual .content-entrada .etiquetas');
    etiquetasDiv.innerHTML = '';
    const etiquetas = await obtenerEtiquetasEntrada();
    etiquetas.forEach(et => {
        const btn = document.createElement('button');
        btn.textContent = '#' + et.nombre;
        etiquetasDiv.appendChild(btn);
    });
    // Resetear variable y handler
    etiquetaActiva = null;
    if (handlerEtiquetas) etiquetasDiv.removeEventListener('click', handlerEtiquetas);
    handlerEtiquetas = function handler(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const etiquetaBtns = Array.from(etiquetasDiv.querySelectorAll('button'));
        
        // Si el botón ya está activo, deseleccionar todo
        if (btn === etiquetaActiva) {
            etiquetaBtns.forEach(b => {
                b.classList.remove('oculta-categoria');
                b.classList.add('muestra-categoria');
            });
            etiquetaActiva = null;
            return;
        }
        
        // Si hay solo una etiqueta visible y es la que se está clickeando, deseleccionar
        const etiquetasVisibles = etiquetaBtns.filter(b => b.classList.contains('muestra-categoria'));
        if (etiquetasVisibles.length === 1 && etiquetasVisibles[0] === btn) {
            etiquetaBtns.forEach(b => {
                b.classList.remove('oculta-categoria');
                b.classList.add('muestra-categoria');
            });
            etiquetaActiva = null;
            return;
        }
        
        // Seleccionar la nueva etiqueta
        etiquetaBtns.forEach(b => {
            if (b !== btn) {
                b.classList.remove('muestra-categoria');
                b.classList.add('oculta-categoria');
            } else {
                b.classList.remove('oculta-categoria');
                b.classList.add('muestra-categoria');
            }
        });
        
        // Mover al inicio y hacer scroll con delay
        etiquetasDiv.insertBefore(btn, etiquetasDiv.firstChild);
        setTimeout(() => {
            btn.scrollIntoView({behavior: 'smooth', inline: 'start', block: 'nearest'});
        }, 50);
        etiquetaActiva = btn;
    };
    etiquetasDiv.addEventListener('click', handlerEtiquetas);
    etiquetasDiv.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) e.preventDefault();
    });
}

/* ===== CATEGORIAS ===== */
export function obtenerCategoriasEntrada() {
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

/* ===== ETIQUETAS ===== */
function obtenerEtiquetasEntrada() {
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

/* ===== TRANSACCIONES ===== */
export function obtenerTransacciones() {
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
function guardarTransaccion({fecha, descripcion, monto, idCategoria, idEtiqueta, tipo}) {
    return openDB([STORE_TRANSACCIONES]).then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_TRANSACCIONES, 'readwrite');
            const store = tx.objectStore(STORE_TRANSACCIONES);
            const req = store.add({ fecha, descripcion, monto, idCategoria, idEtiqueta, tipo });
            req.onsuccess = () => { resolve(req.result); db.close(); };
            req.onerror = () => { reject(req.error); db.close(); };
        });
    });
}

/* ===== NOTIFICACIONES ===== */
function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.querySelector('.notificacion-toast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.className = `notificacion-toast ${tipo}`;
    toast.classList.add('mostrar');
    setTimeout(() => {
        toast.classList.remove('mostrar');
    }, 2500);
}

/* ===== EDITAR TRANSACCION ===== */
let modoEdicion = false;
let transaccionEditando = null;

window.addEventListener('editarTransaccion', async (event) => {
    const tipoMonto = document.querySelector('.entrada-manual .content-entrada .monto .tipo-monto-container');
    const tr = event.detail;
    const overlay2 = document.querySelector('.overlay2');
    const entradaManualContainer = document.querySelector('.entrada-manual');
    if (!entradaManualContainer) {
        alert('No se encontró el contenedor de entrada manual u overlay');
        return;
    }
    modoEdicion = true;
    transaccionEditando = tr;
    entradaManualContainer.style.transform = 'translateY(0)';
    overlay2.classList.add('active');
    await renderCategoriasEntrada();
    await renderEtiquetasEntrada();
    // Cargar datos en los campos
    const inputFecha = document.querySelector('.entrada-manual .input-fecha');
    const inputDescripcion = document.querySelector('.entrada-manual .content-entrada .monto .descripcion');
    const montoInput = document.querySelector('.entrada-manual .content-entrada .monto .monto-input');
    if (!inputFecha || !inputDescripcion || !montoInput) {
        alert('No se encontraron los campos de entrada manual');
        return;
    }
    inputFecha.value = tr.fecha || '';
    inputDescripcion.value = tr.descripcion || '';
    montoInput.value = tr.monto != null ? Number(tr.monto).toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2}) : '';
    montoInput.dataset.raw = tr.monto != null ? tr.monto : '';
    // Tipo
    const btnTipoMontoNegativo = document.querySelector('.entrada-manual .content-entrada .monto .tipo-monto-container .tipo-monto button.negativo');
    const btnTipoMontoPositivo = document.querySelector('.entrada-manual .content-entrada .monto .tipo-monto-container .tipo-monto button.positivo');
    if (btnTipoMontoNegativo && btnTipoMontoPositivo) {
        if (tr.tipo === 'positivo') {
            btnTipoMontoPositivo.classList.add('active');
            btnTipoMontoNegativo.classList.remove('active');
        } else {
            btnTipoMontoNegativo.classList.add('active');
            btnTipoMontoPositivo.classList.remove('active');
        }
    }
    if (tipoMonto) tipoMonto.style.transform = 'translateX(0)';

    // Marcar y mover la categoría activa
    if (tr.idCategoria != null) {
        const cats = await obtenerCategoriasEntrada();
        const cat = cats.find(c => c.id === tr.idCategoria);
        if (cat) {
            const btns = Array.from(document.querySelectorAll('.entrada-manual .categorias button'));
            btns.forEach(b => {
                if (b.textContent.trim().endsWith(cat.nombre)) {
                    b.classList.add('muestra-categoria');
                    b.classList.remove('oculta-categoria');
                } else {
                    b.classList.remove('muestra-categoria');
                    b.classList.add('oculta-categoria');
                }
            });
            // Mover el botón activo al inicio
            const categoriasDiv = document.querySelector('.entrada-manual .content-entrada .categorias');
            const btnSel = btns.find(b => b.textContent.trim().endsWith(cat.nombre));
            if (btnSel && categoriasDiv) {
                categoriasDiv.insertBefore(btnSel, categoriasDiv.firstChild);
            }
        }
    }
    // Marcar y mover la etiqueta activa
    if (tr.idEtiqueta != null) {
        const ets = await obtenerEtiquetasEntrada();
        const et = ets.find(e => e.id === tr.idEtiqueta);
        if (et) {
            const btns = Array.from(document.querySelectorAll('.entrada-manual .etiquetas button'));
            btns.forEach(b => {
                if (b.textContent.trim() === '#' + et.nombre) {
                    b.classList.add('muestra-categoria');
                    b.classList.remove('oculta-categoria');
                } else {
                    b.classList.remove('muestra-categoria');
                    b.classList.add('oculta-categoria');
                }
            });
            // Mover el botón activo al inicio
            const etiquetasDiv = document.querySelector('.entrada-manual .content-entrada .etiquetas');
            const btnSel = btns.find(b => b.textContent.trim() === '#' + et.nombre);
            if (btnSel && etiquetasDiv) {
                etiquetasDiv.insertBefore(btnSel, etiquetasDiv.firstChild);
            }
        }
    }
    mostrarBotonesEdicion();
    // Actualizar texto del botón de fecha
    const btnFecha = document.querySelector('.entrada-manual .fecha-recurrencia .fecha');
    if (btnFecha && inputFecha.value) {
        const [d, m, y] = inputFecha.value.split(/[\\/]/).map(Number);
        if (d && m && y) {
            const selected = new Date(y, m - 1, d);
            const now = new Date();
            const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const ayer = new Date(hoy);
            ayer.setDate(hoy.getDate() - 1);
            const manana = new Date(hoy);
            manana.setDate(hoy.getDate() + 1);
            function sameDay(a, b) {
                return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
            }
            if (sameDay(selected, hoy)) {
                btnFecha.textContent = 'Hoy';
            } else if (sameDay(selected, ayer)) {
                btnFecha.textContent = 'Ayer';
            } else if (sameDay(selected, manana)) {
                btnFecha.textContent = 'Mañana';
            } else {
                btnFecha.textContent = inputFecha.value;
            }
        } else {
            btnFecha.textContent = inputFecha.value;
        }
    }
    // Resetear variables de animación para UX consistente
    categoriaActiva = null;
    etiquetaActiva = null;
});

function mostrarBotonesEdicion() {
    // Ocultar botón guardar y mostrar check+basurero
    const btnGuardar = document.querySelector('.entrada-manual .guardar');
    if (!document.querySelector('.entrada-manual .botones-edicion')) {
        const cont = document.createElement('div');
        cont.className = 'botones-edicion';
        cont.style.position = 'absolute';
        cont.style.right = '20px';
        cont.style.bottom = '20px';
        cont.style.display = 'flex';
        cont.style.gap = '5px';
        cont.innerHTML = `
            <button class="btn-check" title="Guardar cambios"><i class="bx bx-check"></i></button>
            <button class="btn-borrar" title="Eliminar"><i class="bx bx-trash"></i></button>
        `;
        document.querySelector('.entrada-manual').appendChild(cont);
        cont.querySelector('.btn-check').addEventListener('click', guardarEdicionTransaccion);
        cont.querySelector('.btn-borrar').addEventListener('click', eliminarTransaccion);
    }
    if (btnGuardar) btnGuardar.style.display = 'none';
}
function ocultarBotonesEdicion() {
    const btnGuardar = document.querySelector('.entrada-manual .guardar');
    const cont = document.querySelector('.entrada-manual .botones-edicion');
    if (cont) cont.remove();
    if (btnGuardar) btnGuardar.style.display = '';
    modoEdicion = false;
    transaccionEditando = null;
}


async function guardarEdicionTransaccion() {
    if (!transaccionEditando) return;
    // Obtener datos igual que en btnGuardar
    const fecha = document.querySelector('.entrada-manual .input-fecha').value || new Date().toLocaleDateString('es-ES');
    const descripcionVal = document.querySelector('.entrada-manual .content-entrada .monto .descripcion').value.trim();
    const montoInput = document.querySelector('.entrada-manual .content-entrada .monto .monto-input');
    const montoVal = parseFloat(montoInput.dataset.raw || '0');
    const overlay2 = document.querySelector('.overlay2');
    // Buscar categoría y etiqueta activas
    const catBtn = document.querySelector('.entrada-manual .categorias button.muestra-categoria');
    const etBtn = document.querySelector('.entrada-manual .etiquetas button.muestra-categoria');
    let idCategoria = null, idEtiqueta = null;
    if (catBtn) {
        const nombre = catBtn.textContent.replace(/^[^\wáéíóúüñ]+/i, '').trim();
        const cats = await obtenerCategoriasEntrada();
        const cat = cats.find(c => c.nombre === nombre);
        if (cat) idCategoria = cat.id;
    }
    if (etBtn) {
        const nombre = etBtn.textContent.replace(/^#/, '').trim();
        const ets = await obtenerEtiquetasEntrada();
        const et = ets.find(e => e.nombre === nombre);
        if (et) idEtiqueta = et.id;
    }
    // Validaciones
    if (!idCategoria) {
        mostrarToast('Selecciona una categoría', 'error');
        return;
    }
    if (!descripcionVal || descripcionVal.length < 1) {
        mostrarToast('Agrega una descripción', 'error');
        return;
    }
    if (isNaN(montoVal) || montoVal < 1) {
        mostrarToast('El monto debe ser al menos 1', 'error');
        return;
    }
    let tipo = 'negativo';
    const btnTipoMontoPositivo = document.querySelector('.entrada-manual .content-entrada .monto .tipo-monto-container .tipo-monto button.positivo');
    if (btnTipoMontoPositivo.classList.contains('active')) tipo = 'positivo';
    // Actualizar transacción en IndexedDB
    const transEditada = {
        ...transaccionEditando,
        fecha,
        descripcion: descripcionVal,
        monto: montoVal,
        idCategoria,
        idEtiqueta,
        tipo
    };
    await actualizarTransaccion(transEditada);
    // Notificación - Verde para edición exitosa
    mostrarToast('Transacción actualizada', 'success');
    overlay2.classList.remove('active');
    document.querySelector('.entrada-manual').style.transform = 'translateY(100%)';
    ocultarBotonesEdicion();
    window.dispatchEvent(new Event('transaccionGuardada'));
    window.dispatchEvent(new CustomEvent('transaccionEditadaUI', { detail: transEditada }));
    resetearEntradaManual();
}
async function eliminarTransaccion() {
    if (!transaccionEditando) return;
    const transEliminada = { ...transaccionEditando };
    const overlay2 = document.querySelector('.overlay2');
    await borrarTransaccion(transaccionEditando.id);
    document.querySelector('.entrada-manual').style.transform = 'translateY(100%)';
    ocultarBotonesEdicion();
    overlay2.classList.remove('active');
    // Emitir evento para animar eliminación en el buscador
    window.dispatchEvent(new CustomEvent('transaccionEliminadaUI', { detail: transEliminada }));
    // Mostrar snackbar visual
    mostrarSnackbarEliminada(transEliminada);
    resetearEntradaManual();
}

function mostrarSnackbarEliminada(trans) {
    let snackbar = document.querySelector('.snackbar-eliminada');
    if (snackbar) snackbar.remove();
    snackbar = document.createElement('div');
    snackbar.className = 'snackbar-eliminada';
    snackbar.innerHTML = `
        <div class="icono"><i class="bx bx-trash"></i></div>
        <div class="contenido">
            <div class="titulo">Transacción eliminada</div>
            <div class="nombre">${trans.descripcion || ''}</div>
        </div>
        <button class="btn-deshacer">Deshacer</button>
    `;
    document.body.appendChild(snackbar);
    // Animación de entrada
    setTimeout(() => snackbar.classList.add('visible'), 10);
    // Deshacer
    snackbar.querySelector('.btn-deshacer').addEventListener('click', async () => {
        await restaurarTransaccion(trans);
        snackbar.classList.remove('visible');
        setTimeout(() => snackbar.remove(), 300);
    });
    // Auto ocultar tras 2s
    setTimeout(() => {
        if (document.body.contains(snackbar)) {
            snackbar.classList.remove('visible');
            setTimeout(() => snackbar.remove(), 300);
        }
    }, 2000);
}
async function restaurarTransaccion(trans) {
    // Restaurar en IndexedDB
    await actualizarTransaccion(trans);
    // Emitir evento para restaurar en UI
    window.dispatchEvent(new CustomEvent('transaccionRestauradaUI', { detail: trans }));
}

// Función para actualizar transacción en IndexedDB
function actualizarTransaccion(tr) {
    return openDB([STORE_TRANSACCIONES]).then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_TRANSACCIONES, 'readwrite');
            const store = tx.objectStore(STORE_TRANSACCIONES);
            const req = store.put(tr);
            req.onsuccess = () => { resolve(req.result); db.close(); };
            req.onerror = () => { reject(req.error); db.close(); };
        });
    });
}
// Función para borrar transacción en IndexedDB
function borrarTransaccion(id) {
    return openDB([STORE_TRANSACCIONES]).then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_TRANSACCIONES, 'readwrite');
            const store = tx.objectStore(STORE_TRANSACCIONES);
            const req = store.delete(id);
            req.onsuccess = () => { resolve(req.result); db.close(); };
            req.onerror = () => { reject(req.error); db.close(); };
        });
    });
}