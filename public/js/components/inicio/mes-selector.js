// Selector de mes dinámico para el dashboard
import { obtenerTransacciones } from '../../entrada-manual.js';

let mesSeleccionado = null;
let callbackCambioMes = null;
let mesesDisponibles = [];

export function onCambioMes(cb) {
    callbackCambioMes = cb;
}

function getMesActualKey() {
    const now = new Date();
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const anio = String(now.getFullYear());
    return `${anio}-${mes}`;
}

function getNombreMes(key) {
    if (!key) return '';
    const [anio, mes] = key.split('-');
    const nombreMes = new Date(anio, mes - 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    return nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
}

export async function renderMesSelector() {
    const divPrincipal = document.querySelector('.filtros-main');
    const btnMes = document.querySelector('.filtros-main button'); // Primer botón: "Este mes"
    if (!btnMes) return;

    // Obtener meses únicos de las transacciones
    const transacciones = await obtenerTransacciones();
    const mesesSet = new Set();
    transacciones.forEach(tr => {
        if (tr.fecha) {
            // Soporta formatos dd/mm/yyyy o dd-mm-yyyy
            const match = tr.fecha.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (match) {
                const mes = match[2].padStart(2, '0');
                const anio = match[3];
                mesesSet.add(`${anio}-${mes}`);
            }
        }
    });
    // Ordenar meses descendente
    mesesDisponibles = Array.from(mesesSet).sort((a, b) => b.localeCompare(a));
    if (mesesDisponibles.length === 0) {
        btnMes.textContent = 'Sin meses';
        btnMes.disabled = true;
        return;
    }
    btnMes.disabled = false;

    // Si no hay mes seleccionado, seleccionar el mes actual si está disponible
    const mesActualKey = getMesActualKey();
    if (!mesSeleccionado || !mesesDisponibles.includes(mesSeleccionado)) {
        mesSeleccionado = mesesDisponibles.includes(mesActualKey) ? mesActualKey : mesesDisponibles[0];
        if (callbackCambioMes) callbackCambioMes(mesSeleccionado);
    }

    // Actualizar texto del botón
    if (mesSeleccionado === mesActualKey) {
        btnMes.textContent = 'Este mes';
    } else {
        btnMes.textContent = getNombreMes(mesSeleccionado);
    }

    // Si ya existe el menú, eliminarlo
    let menu = document.querySelector('.mes-selector-menu');
    if (menu) menu.remove();

    // Evento para mostrar el menú personalizado
    btnMes.onclick = (e) => {
        e.stopPropagation();
        // Eliminar cualquier menú anterior dentro de .filtros-main
        const oldMenu = divPrincipal.querySelector('.mes-selector-menu');
        if (oldMenu) oldMenu.remove();
        menu = document.createElement('div');
        menu.className = 'mes-selector-menu';
        menu.style.left = '0';
        menu.style.top = '100%';

        mesesDisponibles.forEach(m => {
            const item = document.createElement('div');
            item.className = 'mes-selector-item';
            item.textContent = (m === mesActualKey) ? 'Este mes' : getNombreMes(m);
            if (m === mesSeleccionado) {
                item.classList.add('selected');
            }
            item.onclick = () => {
                mesSeleccionado = m;
                if (callbackCambioMes) callbackCambioMes(mesSeleccionado);
                btnMes.textContent = (mesSeleccionado === mesActualKey) ? 'Este mes' : getNombreMes(mesSeleccionado);
                menu.remove();
            };
            menu.appendChild(item);
        });
        divPrincipal.appendChild(menu);
        // Cerrar si se hace click fuera
        const close = (ev) => {
            if (ev.target !== menu && ev.target !== btnMes && !menu.contains(ev.target)) {
                menu.remove();
                document.removeEventListener('mousedown', close);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', close), 0);
    };
}

export function getMesSeleccionado() {
    return mesSeleccionado;
} 