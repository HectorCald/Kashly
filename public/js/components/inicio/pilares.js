import { obtenerCategoriasEntrada, obtenerTransacciones } from '../../entrada-manual.js';
import { tipoDashboard } from '../../inicio.js';


export async function renderPilaresCategorias(transaccionesFiltradas = null) {

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
    const categorias = await obtenerCategoriasEntrada();
    let transacciones;
    if (Array.isArray(transaccionesFiltradas)) {
        transacciones = transaccionesFiltradas;
    } else {
        transacciones = await obtenerTransacciones();
    }

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