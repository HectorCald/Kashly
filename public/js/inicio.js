/* ===== IMPORTACIÓN ===== */
import { ocultarContenedores, ascensorAjustes } from './components/components.js';
import { mostrarAjustes} from './components/ajustes.js';
import { mostrarBuscarTrans } from './components/buscar-trans.js';
import { mostrarEntradaManual, obtenerCategoriasEntrada, obtenerTransacciones } from './components/entrada-manual.js';

/* ===== EXPORTACIÓN ===== */
window.mostrarAjustes = mostrarAjustes;
window.ocultarContenedores = ocultarContenedores;
window.mostrarBuscarTrans = mostrarBuscarTrans;
window.mostrarEntradaManual = mostrarEntradaManual;
window.ascensorAjustes = ascensorAjustes;

let tipoDashboard = 'negativo';
function animarTotal(finalTotal) {
    const totalNumber = document.querySelector('.total-number');
    let actual = parseFloat(totalNumber.dataset.raw || '0');
    const target = finalTotal;
    const step = (target - actual) / 30;
    let frame = 0;
    function animate() {
        if (frame < 30) {
            actual += step;
            totalNumber.innerHTML = `${actual > 0 ? '+' : ''}${actual.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})} <span>Bs</span>`;
            totalNumber.dataset.raw = actual;
            frame++;
            requestAnimationFrame(animate);
        } else {
            totalNumber.innerHTML = `${target > 0 ? '+' : ''}${target.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})} <span>Bs</span>`;
            totalNumber.dataset.raw = target;
        }
    }
    animate();
}
async function renderPilaresCategorias() {
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
        montoElement.textContent = `${monto.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
        const pilar = document.createElement('div');
        pilar.className = 'tag-pilar';
        pilar.style.height = '0%';
        pilar.style.transition = 'height 0.7s cubic-bezier(0.4,0,0.2,1)';
        pilar.title = `${cat.nombre}: ${monto > 0 ? '+' : ''}${monto.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})} Bs`;
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
    // Calcular totales para los botones
    let totalPositivo = 0;
    let totalNegativo = 0;
    transacciones.forEach(t => {
        if (t.tipo === 'negativo') totalNegativo += Number(t.monto);
        if (t.tipo === 'positivo') totalPositivo += Number(t.monto);
    });
    // Actualizar texto de los botones
    const btnNegativo = document.querySelector('.tipo .negativo');
    const btnPositivo = document.querySelector('.tipo .positivo');
    if (btnNegativo) btnNegativo.innerHTML = `- Bs ${totalNegativo.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    if (btnPositivo) btnPositivo.innerHTML = `+ Bs ${totalPositivo.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    // Total general: ingresos - egresos
    const total = totalPositivo - totalNegativo;
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
        } else {
            console.log('No se encontraron los botones de tipo');
        }
    }, 0);
    animarTotal(total);
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
    ascensorAjustes();
    // Listeners para botones de tipo
});