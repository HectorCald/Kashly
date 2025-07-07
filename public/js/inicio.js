/* ===== IMPORTACIÓN ===== */
import { ocultarContenedores } from './components/components.js';
import { mostrarAjustes } from './ajustes.js';
import { mostrarBuscarTrans } from './buscar-trans.js';
import { mostrarEntradaManual, obtenerTransacciones } from './entrada-manual.js';


/* ===== COMPONENTES INICIO ===== */
import { renderPilaresCategorias } from './components/inicio/pilares.js';
import { animarTotal } from './components/inicio/total.js';
import { renderMesSelector, onCambioMes, getMesSeleccionado } from './components/inicio/mes-selector.js';
import { inicializarEntradaVoz } from './entrada-voz.js';


/* ===== EXPORTACIÓN ===== */
window.mostrarAjustes = mostrarAjustes;
window.ocultarContenedores = ocultarContenedores;
window.mostrarBuscarTrans = mostrarBuscarTrans;
window.mostrarEntradaManual = mostrarEntradaManual;

/* ===== EXPORTACIÓN INICIO ===== */
window.renderPilaresCategorias = renderPilaresCategorias;
window.animarTotal = animarTotal;

export let tipoDashboard = 'negativo';
let listenersInicializados = false;
let mesFiltro = null;

export async function actualizarDashboard() {
    // Obtener el mes seleccionado SIEMPRE desde el selector
    mesFiltro = getMesSeleccionado();
    const transacciones = await obtenerTransacciones();
    // Filtrar por mes seleccionado (siempre hay uno)
    let transaccionesFiltradas = transacciones.filter(t => {
        if (!t.fecha) return false;
        const match = t.fecha.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (!match) return false;
        const mes = match[2].padStart(2, '0');
        const anio = match[3];
        return `${anio}-${mes}` === mesFiltro;
    });
    // Calcular totales para los botones
    let totalPositivo = 0;
    let totalNegativo = 0;
    transaccionesFiltradas.forEach(t => {
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
    // Renderizar pilares con filtro
    renderPilaresCategorias(transaccionesFiltradas);
    // Renderizar selector de mes
    renderMesSelector();
}

// Hook de cambio de mes
onCambioMes((nuevoMes) => {
    actualizarDashboard();
});

/* ===== INICIALIZACIÓN ===== */
document.addEventListener('DOMContentLoaded', () => {
    // Hook para actualizar después de guardar
    window.addEventListener('transaccionGuardada', actualizarDashboard);

    actualizarDashboard();
    mostrarAjustes();
    ocultarContenedores();
    mostrarBuscarTrans();
    mostrarEntradaManual();
    inicializarEntradaVoz();
});

