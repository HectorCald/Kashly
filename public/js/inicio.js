/* ===== IMPORTACIÓN ===== */
import { ocultarContenedores } from './components/components.js';
import { mostrarAjustes } from './components/ajustes.js';
import { mostrarBuscarTrans } from './components/buscar-trans.js';
import { mostrarEntradaManual, obtenerCategoriasEntrada, obtenerTransacciones } from './components/entrada-manual.js';

/* ===== EXPORTACIÓN ===== */
window.mostrarAjustes = mostrarAjustes;
window.ocultarContenedores = ocultarContenedores;
window.mostrarBuscarTrans = mostrarBuscarTrans;
window.mostrarEntradaManual = mostrarEntradaManual;

let tipoDashboard = 'negativo';
let listenersInicializados = false;

function animarTotal(finalTotal) {
    const totalNumber = document.querySelector('.total-number');
    let actual = parseFloat(totalNumber.dataset.raw || '0');
    const target = finalTotal;
    const step = (target - actual) / 30;
    let frame = 0;

    function animate() {
        if (frame < 30) {
            actual += step;
            totalNumber.innerHTML =
                `${actual > 0 ? '+' : ''}${actual.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    useGrouping: true
                })}<span>Bs</span>`;
            totalNumber.dataset.raw = actual;
            frame++;
            requestAnimationFrame(animate);
        } else {
            totalNumber.innerHTML =
                `${target > 0 ? '+' : ''}${target.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    useGrouping: true
                })}<span>Bs</span>`;
            totalNumber.dataset.raw = target;
        }
    }

    animate();
}

async function renderPilaresCategorias() {

    function abreviarNumero(numero) {
        const abs = Math.abs(numero);
    
        if (abs >= 1_000_000) {
            return (numero / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else if (abs >= 1_000) {
            return (numero / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
        } else {
            return numero.toLocaleString('es-ES', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
                useGrouping: true
            });
        }
    }
    
    const transDiv = document.querySelector('.transacciones');
    transDiv.innerHTML = '';
    const [categorias, transacciones] = await Promise.all([
        obtenerCategoriasEntrada(),
        obtenerTransacciones()
    ]);

    // Agrupar montos por categoría según tipoDashboard
    const montosPorCat = {};
    categorias.forEach(cat => { montosPorCat[cat.id] = 0; });
    transacciones.forEach(tr => {
        if (tr.idCategoria && montosPorCat.hasOwnProperty(tr.idCategoria)) {
            if (tipoDashboard === 'negativo' && tr.tipo === 'negativo') {
                montosPorCat[tr.idCategoria] += -Number(tr.monto);
            } else if (tipoDashboard === 'positivo' && tr.tipo === 'positivo') {
                montosPorCat[tr.idCategoria] += Number(tr.monto);
            }
        }
    });
    // Ordenar categorías de mayor a menor monto absoluto
    const categoriasOrdenadas = categorias.slice().sort((a, b) => Math.abs(montosPorCat[b.id]) - Math.abs(montosPorCat[a.id]));
    // Encontrar el máximo absoluto para escalar
    const maxAbs = Math.max(1, ...categoriasOrdenadas.map(cat => Math.abs(montosPorCat[cat.id])));
    categoriasOrdenadas.forEach(cat => {
        const monto = montosPorCat[cat.id];
        const montoElement = document.createElement('p');
        montoElement.className = 'monto-pilar';
        // Formatear monto: sin signo negativo, solo decimales si es necesario
        const montoAbsoluto = Math.abs(monto);
        const montoFormateado = abreviarNumero(montoAbsoluto);

        montoElement.textContent = montoFormateado;
        const pilar = document.createElement('div');
        pilar.className = 'tag-pilar';
        pilar.style.height = '0%';
        pilar.style.transition = 'height 0.7s cubic-bezier(0.4,0,0.2,1)';
        pilar.title = `${cat.nombre}: ${monto > 0 ? '+' : ''}${monto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}Bs`;
        // Agregar data-categoria para identificar el pilar
        pilar.dataset.categoriaId = cat.id;
        pilar.dataset.categoriaNombre = cat.nombre;
        // Etiqueta: solo icono con color
        const label = document.createElement('span');
        label.className = 'pilar-label';
        let iconHtml = '';
        if (cat.icono && cat.icono.startsWith('bx:')) {
            iconHtml = `<i class="bx ${cat.icono.split(':')[1]}" style="color:${cat.color || '#888'};font-size:2em;"></i>`;
        } else if (cat.icono && cat.icono.startsWith('fa:')) {
            iconHtml = `<i class="fa-solid ${cat.icono.split(':')[1]}" style="color:${cat.color || '#888'};font-size:2em;"></i>`;
        } else {
            iconHtml = `<i class="fa-solid fa-tag" style="color:${cat.color || '#888'};font-size:2em;"></i>`;
        }
        label.innerHTML = iconHtml;
        pilar.appendChild(label);
        pilar.appendChild(montoElement);
        transDiv.appendChild(pilar);
        // Animar altura
        setTimeout(() => {
            pilar.style.height = `${Math.abs(monto) / maxAbs * 100}%`;
            // No cambiar color
        }, 50);
    });
    // Agregar event listeners a los pilares
    const pilares = document.querySelectorAll('.tag-pilar');
    pilares.forEach(pilar => {
        pilar.addEventListener('click', () => {
            const categoriaId = pilar.dataset.categoriaId;
            const categoriaNombre = pilar.dataset.categoriaNombre;
            // Disparar evento personalizado para abrir buscador con filtro
            const evento = new CustomEvent('abrirBuscadorConFiltro', {
                detail: { categoriaId, categoriaNombre }
            });
            window.dispatchEvent(evento);
        });
    });
}
export async function actualizarDashboard() {
    console.log('🔄 actualizarDashboard() ejecutándose');
    const transacciones = await obtenerTransacciones();



    // Calcular totales para los botones (sin filtro)
    let totalPositivo = 0;
    let totalNegativo = 0;
    transacciones.forEach(t => {
        if (t.tipo === 'negativo') totalNegativo += Number(t.monto);
        if (t.tipo === 'positivo') totalPositivo += Number(t.monto);
    });
    // Actualizar texto de los botones
    const btnNegativo = document.querySelector('.tipo .negativo');
    const btnPositivo = document.querySelector('.tipo .positivo');
    if (btnNegativo) {
        btnNegativo.innerHTML =
            `- Bs ${totalNegativo.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                useGrouping: true
            })}`;
    }
    
    if (btnPositivo) {
        btnPositivo.innerHTML =
            `+ Bs ${totalPositivo.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                useGrouping: true
            })}`;
    }
    
    // Total general: ingresos - egresos
    const total = totalPositivo - totalNegativo;
    animarTotal(total);

    // Inicializar listeners solo una vez
    if (!listenersInicializados) {
        setTimeout(() => {
            const btnNegativo = document.querySelector('.tipo .negativo');
            const btnPositivo = document.querySelector('.tipo .positivo');
            console.log('btnNegativo:', btnNegativo, 'btnPositivo:', btnPositivo);
            if (btnNegativo && btnPositivo) {
                btnNegativo.addEventListener('click', () => {
                    btnNegativo.classList.add('active');
                    btnPositivo.classList.remove('active');
                    tipoDashboard = 'negativo';
                    actualizarDashboard();
                });
                btnPositivo.addEventListener('click', () => {
                    btnPositivo.classList.add('active');
                    btnNegativo.classList.remove('active');
                    tipoDashboard = 'positivo';
                    actualizarDashboard();
                });
                listenersInicializados = true;
            } else {
                console.log('No se encontraron los botones de tipo');
            }
        }, 0);
    }

    renderPilaresCategorias();
}


/* ===== INICIALIZACIÓN ===== */
document.addEventListener('DOMContentLoaded', () => {
    // Hook para actualizar después de guardar
    window.addEventListener('transaccionGuardada', actualizarDashboard);

    actualizarDashboard();
    mostrarAjustes();
    ocultarContenedores();
    mostrarBuscarTrans();
    mostrarEntradaManual();

    // Inicializar verificación de versiones
    initVersionCheck();

    // Listeners para botones de tipo
});

// Función para inicializar verificación de versiones
function initVersionCheck() {
    // Verificar versión después de 3 segundos para no interrumpir la carga inicial
    setTimeout(() => {
        checkForUpdates();
    }, 3000);

    // Configurar listeners del modal
    setupUpdateModal();
}

// Función para verificar actualizaciones
async function checkForUpdates() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                if (event.data.success && event.data.versionInfo) {
                    const versionInfo = event.data.versionInfo;
                    console.log('📋 Información de versión:', versionInfo);
                    
                    if (versionInfo.hasUpdate) {
                        console.log('🔄 Nueva versión disponible:', versionInfo.serverVersion);
                        showUpdateModal(versionInfo);
                    } else {
                        console.log('✅ Aplicación actualizada');
                    }
                } else {
                    console.log('❌ No se pudo verificar versión');
                }
            };
            
            navigator.serviceWorker.controller.postMessage(
                { type: 'CHECK_VERSION' },
                [messageChannel.port2]
            );
        } catch (error) {
            console.error('❌ Error verificando actualizaciones:', error);
        }
    }
}

// Función para mostrar modal de actualización
function showUpdateModal(versionInfo) {
    const modal = document.getElementById('updateModal');
    const currentVersionSpan = document.getElementById('currentVersion');
    const newVersionSpan = document.getElementById('newVersion');
    
    // Actualizar información de versiones
    currentVersionSpan.textContent = versionInfo.currentVersion;
    newVersionSpan.textContent = versionInfo.serverVersion || 'Nueva versión';
    
    // Mostrar modal
    modal.classList.add('show');
}

// Función para configurar listeners del modal
function setupUpdateModal() {
    const modal = document.getElementById('updateModal');
    const updateBtn = document.getElementById('updateBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    // Botón actualizar
    updateBtn.addEventListener('click', async () => {
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';
        
        try {
            await performUpdate();
            modal.classList.remove('show');
            // Recargar página después de actualizar
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('❌ Error en actualización:', error);
            updateBtn.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Error';
            setTimeout(() => {
                updateBtn.disabled = false;
                updateBtn.innerHTML = '<i class="fa-solid fa-download"></i> Actualizar';
            }, 2000);
        }
    });
    
    // Botón cancelar
    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// Función para realizar la actualización
async function performUpdate() {
    return new Promise((resolve, reject) => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                if (event.data.success) {
                    console.log('✅ Actualización completada:', event.data.result);
                    resolve(event.data.result);
                } else {
                    console.error('❌ Error en actualización:', event.data.error);
                    reject(new Error(event.data.error));
                }
            };
            
            navigator.serviceWorker.controller.postMessage(
                { type: 'UPDATE_FROM_VERCEL' },
                [messageChannel.port2]
            );
        } else {
            reject(new Error('Service Worker no disponible'));
        }
    });
}

// Función global para verificar actualizaciones manualmente
window.checkForUpdates = checkForUpdates;