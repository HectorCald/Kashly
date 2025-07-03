export function mostrarEntradaManual() {
    const btnEntradaManual = document.querySelector('.entradas button:nth-child(2)');
    const entradaManualContainer = document.querySelector('.entrada-manual');
    const overlay = document.querySelector('.overlay');

    btnEntradaManual.addEventListener('click', () => {
        entradaManualContainer.style.transform = 'translateY(0)';
        renderCategoriasEntrada();
        renderEtiquetasEntrada();
        overlay.classList.add('active');
    });
    ascensorAjustes(entradaManualContainer);
    eventosEntradaManual();
}

function aplicarAnimacionCategorias() {
    const categorias = document.querySelector('.entrada-manual .content-entrada .categorias');
    let categoriaActiva = null;
    categorias.addEventListener('click', function handler(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const categoriaBtns = Array.from(categorias.querySelectorAll('button'));
        if (btn === categoriaActiva) {
            categoriaBtns.forEach(b => {
                b.classList.remove('oculta-categoria');
                b.classList.add('muestra-categoria');
            });
            categoriaActiva = null;
        } else {
            categoriaBtns.forEach(b => {
                if (b !== btn) {
                    b.classList.remove('muestra-categoria');
                    b.classList.add('oculta-categoria');
                } else {
                    b.classList.remove('oculta-categoria');
                    b.classList.add('muestra-categoria');
                }
            });
            categorias.insertBefore(btn, categorias.firstChild);
            btn.scrollIntoView({behavior: 'smooth', inline: 'start', block: 'nearest'});
            categoriaActiva = btn;
        }
    });
    // Previene blur y teclado
    categorias.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) e.preventDefault();
    });
}

function aplicarAnimacionEtiquetas() {
    const etiquetas = document.querySelector('.entrada-manual .content-entrada .etiquetas');
    let etiquetaActiva = null;
    etiquetas.addEventListener('click', function handler(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const etiquetaBtns = Array.from(etiquetas.querySelectorAll('button'));
        if (btn === etiquetaActiva) {
            etiquetaBtns.forEach(b => {
                b.classList.remove('oculta-categoria');
                b.classList.add('muestra-categoria');
            });
            etiquetaActiva = null;
        } else {
            etiquetaBtns.forEach(b => {
                if (b !== btn) {
                    b.classList.remove('muestra-categoria');
                    b.classList.add('oculta-categoria');
                } else {
                    b.classList.remove('oculta-categoria');
                    b.classList.add('muestra-categoria');
                }
            });
            etiquetas.insertBefore(btn, etiquetas.firstChild);
            btn.scrollIntoView({behavior: 'smooth', inline: 'start', block: 'nearest'});
            etiquetaActiva = btn;
        }
    });
    // Previene blur y teclado
    etiquetas.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) e.preventDefault();
    });
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

    btnEntradaManual.addEventListener('click', () => {
        entradaManualContainer.style.transform = 'translateY(0)';
        setTimeout(() => {
            if (descripcion) {
            descripcion.focus();
            } else {
                console.log('No se encontró el input descripcion');
            }
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
    
    // Calendario con flatpickr para el botón Hoy
    const btnFecha = document.querySelector('.entrada-manual .fecha-recurrencia .fecha');
    const inputFecha = document.querySelector('.entrada-manual .fecha-recurrencia .input-fecha');
    if (btnFecha && inputFecha && window.flatpickr) {
        const picker = flatpickr(inputFecha, {
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
        btnFecha.addEventListener('click', () => {
            picker.open();
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
            mostrarToast('Selecciona una categoría');
            return;
        }
        if (!descripcionVal || descripcionVal.length < 1) {
            mostrarToast('Agrega una descripción');
            return;
        }
        if (isNaN(montoVal) || montoVal < 1) {
            mostrarToast('El monto debe ser al menos 1');
            return;
        }
        // Determinar tipo
        let tipo = 'negativo';
        if (btnTipoMontoPositivo.classList.contains('active')) tipo = 'positivo';
        // Guardar transacción
        await guardarTransaccion({fecha, descripcion: descripcionVal, monto: montoVal, idCategoria, idEtiqueta, tipo});
        // Cerrar entrada manual
        document.querySelector('.entrada-manual').style.transform = 'translateY(100%)';
        // Notificación
        if (nombreCategoria && montoVal) {
            mostrarToast(`${nombreCategoria} ${montoVal > 0 ? (tipo==='positivo'?'+':'-') : ''}${montoVal}`);
        } else if (montoVal) {
            mostrarToast(`${montoVal > 0 ? (tipo==='positivo'?'+':'-') : ''}${montoVal}`);
        } else {
            mostrarToast('Guardado');
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
        window.dispatchEvent(new Event('transaccionGuardada'));
    });

    // Previene que el teclado se cierre o abra al presionar botones de tipo
    [btnTipoMontoNegativo, btnTipoMontoPositivo].forEach(btn => {
        btn.addEventListener('pointerdown', e => {
            e.preventDefault();
        });
    });
}

// --- IndexedDB helpers robustos (copiados de ajustes.js) ---
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

function mostrarToast(mensaje) {
    const toast = document.querySelector('.notificacion-toast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add('mostrar');
    setTimeout(() => {
        toast.classList.remove('mostrar');
    }, 2500);
}

// --- Render dinámico ---
async function renderCategoriasEntrada() {
    const categoriasDiv = document.querySelector('.entrada-manual .content-entrada .categorias');
    categoriasDiv.innerHTML = '';
    const categorias = await obtenerCategoriasEntrada();
    categorias.forEach(cat => {
        const btn = document.createElement('button');
        btn.innerHTML = `<i class="fa-solid fa-tag"></i> ${cat.nombre}`;
        categoriasDiv.appendChild(btn);
    });
    aplicarAnimacionCategorias();
}

async function renderEtiquetasEntrada() {
    const etiquetasDiv = document.querySelector('.entrada-manual .content-entrada .etiquetas');
    etiquetasDiv.innerHTML = '';
    const etiquetas = await obtenerEtiquetasEntrada();
    etiquetas.forEach(et => {
        const btn = document.createElement('button');
        btn.textContent = '#'+et.nombre;
        etiquetasDiv.appendChild(btn);
    });
    aplicarAnimacionEtiquetas();
}

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