// Buscar y renderizar transacciones combinando input, mes y tipo
import { obtenerCategoriasBuscar, obtenerEtiquetasBuscar } from '../../buscar-trans.js';
import { obtenerTransacciones } from '../../entrada-manual.js';
import { getMesSeleccionadoBuscar, getTipoSeleccionadoBuscar } from './filtros.js';

let terminoBusqueda = '';
let categoriaFiltroActiva = null;
let categoriaFiltroNombre = '';

function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export function setCategoriaFiltroActiva(id, nombre = '') {
    categoriaFiltroActiva = id;
    categoriaFiltroNombre = nombre;
}

export async function buscarYRenderizarTransacciones() {
    const cont = document.querySelector('.transacciones-container');
    if (!cont) return;
    cont.innerHTML = '';
    const [trans, categorias, etiquetas] = await Promise.all([
        obtenerTransacciones(),
        obtenerCategoriasBuscar(),
        obtenerEtiquetasBuscar()
    ]);

    // Filtro de mes
    const mesFiltro = getMesSeleccionadoBuscar();
    let transaccionesFiltradas = trans.filter(t => {
        if (!t.fecha) return false;
        const match = t.fecha.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (!match) return false;
        const mes = match[2].padStart(2, '0');
        const anio = match[3];
        return `${anio}-${mes}` === mesFiltro;
    });

    // Filtro de tipo
    const tipoFiltro = getTipoSeleccionadoBuscar();
    if (tipoFiltro !== 'ambos') {
        transaccionesFiltradas = transaccionesFiltradas.filter(t => t.tipo === tipoFiltro);
    }

    // Filtro de categoría
    if (categoriaFiltroActiva) {
        transaccionesFiltradas = transaccionesFiltradas.filter(tr => tr.idCategoria === parseInt(categoriaFiltroActiva));
    }

    // Filtro de input
    if (terminoBusqueda) {
        transaccionesFiltradas = transaccionesFiltradas.filter(tr => {
            const textoCompleto = [
                tr.descripcion || '',
                tr.fecha || '',
                tr.monto?.toString() || '',
                categorias.find(c => c.id === tr.idCategoria)?.nombre || '',
                etiquetas.find(e => e.id === tr.idEtiqueta)?.nombre || ''
            ].join(' ');
            return normalizarTexto(textoCompleto).includes(normalizarTexto(terminoBusqueda));
        });
    }

    // Ordenar por fecha descendente y por id
    transaccionesFiltradas = transaccionesFiltradas.slice().sort((a, b) => {
        const parseFecha = f => {
            if (!f) return 0;
            const [d, m, y] = f.split(/[\\/]/).map(Number);
            return new Date(y, m - 1, d).getTime();
        };
        const fechaA = parseFecha(a.fecha);
        const fechaB = parseFecha(b.fecha);
        if (fechaB !== fechaA) return fechaB - fechaA;
        return (b.id || 0) - (a.id || 0);
    });

    // Agrupar por fecha
    const grupos = {};
    transaccionesFiltradas.forEach(tr => {
        const fecha = tr.fecha || 'Sin fecha';
        if (!grupos[fecha]) grupos[fecha] = [];
        grupos[fecha].push(tr);
    });

    // Renderizar grupos
    Object.keys(grupos).forEach(fecha => {
        const transaccionesDelDia = grupos[fecha];
        // Subtítulo
        const subtituloDiv = document.createElement('div');
        subtituloDiv.className = 'fecha-subtitulo';
        subtituloDiv.innerHTML = `<h3>${fecha}</h3>`;
        cont.appendChild(subtituloDiv);
        // Transacciones
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
}

export function inicializarBuscarInputYFiltros() {
    const input = document.querySelector('.buscador-transacciones .search input');
    if (!input) return;
    input.addEventListener('input', (e) => {
        terminoBusqueda = e.target.value.trim();
        buscarYRenderizarTransacciones();
    });
}
