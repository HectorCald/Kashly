// Filtros de mes y tipo para el buscador de transacciones
import { obtenerTransacciones } from '../../entrada-manual.js';

let mesSeleccionado = null;
let tipoSeleccionado = 'ambos'; // 'negativo', 'positivo', 'ambos'
let callbackCambioFiltros = null;
let mesesDisponibles = [];

export function onCambioFiltros(cb) {
    callbackCambioFiltros = cb;
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

// Función para sincronizar con el dashboard
export function sincronizarConDashboard() {
    // Importar dinámicamente para evitar dependencias circulares
    import('../../inicio.js').then(module => {
        const tipoDashboard = module.getTipoDashboard();
        const mesDashboard = module.getMesDashboard();
        
        // Sincronizar tipo
        if (tipoDashboard === 'negativo' || tipoDashboard === 'positivo') {
            tipoSeleccionado = tipoDashboard;
        }
        
        // Sincronizar mes
        if (mesDashboard && mesesDisponibles.includes(mesDashboard)) {
            mesSeleccionado = mesDashboard;
        }
        
        // Actualizar UI
        actualizarUI();
    }).catch(err => {
        console.log('Error al sincronizar con dashboard:', err);
    });
}

// Función para actualizar la UI de los filtros
function actualizarUI() {
    const divFiltros = document.querySelector('.buscador-transacciones .filtros');
    if (!divFiltros) return;
    
    const btnMes = divFiltros.querySelector('.btn-mes');
    const btnTipo = divFiltros.querySelector('.btn-tipo');
    if (!btnMes || !btnTipo) return;
    
    // Actualizar mes
    const mesActualKey = getMesActualKey();
    if (mesesDisponibles.length === 0) {
        btnMes.textContent = 'Sin meses';
        btnMes.disabled = true;
    } else {
        btnMes.disabled = false;
        btnMes.textContent = (mesSeleccionado === mesActualKey) ? 'Este mes' : getNombreMes(mesSeleccionado);
    }
    
    // Actualizar tipo
    const opcionesTipo = [
        { label: 'Ingresos/Salidas', value: 'ambos' },
        { label: 'Ingresos', value: 'positivo' },
        { label: 'Salidas', value: 'negativo' }
    ];
    btnTipo.textContent = opcionesTipo.find(o => o.value === tipoSeleccionado)?.label || 'Ingresos/Salidas';
}

export async function renderFiltrosBuscar() {
    // Meses
    const divFiltros = document.querySelector('.buscador-transacciones .filtros');
    const btnMes = divFiltros.querySelector('.btn-mes');
    const btnTipo = divFiltros.querySelector('.btn-tipo');
    if (!btnMes || !btnTipo) return;

    // Obtener meses únicos de las transacciones
    const transacciones = await obtenerTransacciones();
    const mesesSet = new Set();
    transacciones.forEach(tr => {
        if (tr.fecha) {
            const match = tr.fecha.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
            if (match) {
                const mes = match[2].padStart(2, '0');
                const anio = match[3];
                mesesSet.add(`${anio}-${mes}`);
            }
        }
    });
    mesesDisponibles = Array.from(mesesSet).sort((a, b) => b.localeCompare(a));
    
    // Sincronizar con dashboard antes de establecer valores por defecto
    sincronizarConDashboard();
    
    // MES - establecer valor por defecto solo si no hay sincronización
    const mesActualKey = getMesActualKey();
    if (!mesSeleccionado || !mesesDisponibles.includes(mesSeleccionado)) {
        mesSeleccionado = mesesDisponibles.includes(mesActualKey) ? mesActualKey : mesesDisponibles[0];
        if (callbackCambioFiltros) callbackCambioFiltros(mesSeleccionado, tipoSeleccionado);
    }
    
    // TIPO - establecer valor por defecto solo si no hay sincronización
    if (tipoSeleccionado === 'ambos') {
        // Intentar sincronizar con dashboard
        try {
            const module = await import('../../inicio.js');
            const tipoDashboard = module.getTipoDashboard();
            if (tipoDashboard === 'negativo' || tipoDashboard === 'positivo') {
                tipoSeleccionado = tipoDashboard;
            }
        } catch (err) {
            console.log('Error al sincronizar tipo:', err);
        }
    }
    
    // Actualizar UI
    actualizarUI();
    
    // Eliminar menú anterior
    let menuMes = divFiltros.querySelector('.mes-selector-menu');
    if (menuMes) menuMes.remove();
    btnMes.onclick = (e) => {
        e.stopPropagation();
        const oldMenu = divFiltros.querySelector('.mes-selector-menu');
        if (oldMenu) oldMenu.remove();
        menuMes = document.createElement('div');
        menuMes.className = 'mes-selector-menu';
        menuMes.style.left = btnMes.offsetLeft + 'px';
        menuMes.style.top = btnMes.offsetTop + btnMes.offsetHeight + 'px';
        mesesDisponibles.forEach(m => {
            const item = document.createElement('div');
            item.className = 'mes-selector-item';
            item.textContent = (m === mesActualKey) ? 'Este mes' : getNombreMes(m);
            if (m === mesSeleccionado) item.classList.add('selected');
            item.onclick = async () => {
                mesSeleccionado = m;
                // Actualizar variable global en dashboard
                try {
                    const module = await import('../../inicio.js');
                    if (typeof module.setMesDashboardFromBuscar === 'function') {
                        module.setMesDashboardFromBuscar(mesSeleccionado);
                    }
                } catch (err) { console.log('No se pudo actualizar mes global:', err); }
                if (callbackCambioFiltros) callbackCambioFiltros(mesSeleccionado, tipoSeleccionado);
                btnMes.textContent = (mesSeleccionado === mesActualKey) ? 'Este mes' : getNombreMes(mesSeleccionado);
                menuMes.remove();
            };
            menuMes.appendChild(item);
        });
        divFiltros.appendChild(menuMes);
        // Cerrar si se hace click fuera
        const close = (ev) => {
            if (ev.target !== menuMes && ev.target !== btnMes && !menuMes.contains(ev.target)) {
                menuMes.remove();
                document.removeEventListener('mousedown', close);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', close), 0);
    };
    
    // TIPO
    const opcionesTipo = [
        { label: 'Ingresos/Salidas', value: 'ambos' },
        { label: 'Ingresos', value: 'positivo' },
        { label: 'Salidas', value: 'negativo' }
    ];
    btnTipo.textContent = opcionesTipo.find(o => o.value === tipoSeleccionado)?.label || 'Ingresos/Salidas';
    let menuTipo = divFiltros.querySelector('.tipo-selector-menu');
    if (menuTipo) menuTipo.remove();
    btnTipo.onclick = (e) => {
        e.stopPropagation();
        const oldMenu = divFiltros.querySelector('.tipo-selector-menu');
        if (oldMenu) oldMenu.remove();
        menuTipo = document.createElement('div');
        menuTipo.className = 'mes-selector-menu tipo-selector-menu';
        menuTipo.style.left = btnTipo.offsetLeft + 'px';
        menuTipo.style.top = btnTipo.offsetTop + btnTipo.offsetHeight + 'px';
        opcionesTipo.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'mes-selector-item';
            item.textContent = opt.label;
            if (opt.value === tipoSeleccionado) item.classList.add('selected');
            item.onclick = async () => {
                tipoSeleccionado = opt.value;
                btnTipo.textContent = opt.label;
                // Actualizar variable global en dashboard
                try {
                    const module = await import('../../inicio.js');
                    if (typeof module.setTipoDashboardFromBuscar === 'function') {
                        module.setTipoDashboardFromBuscar(tipoSeleccionado);
                    }
                } catch (err) { console.log('No se pudo actualizar tipo global:', err); }
                if (callbackCambioFiltros) callbackCambioFiltros(mesSeleccionado, tipoSeleccionado);
                menuTipo.remove();
            };
            menuTipo.appendChild(item);
        });
        divFiltros.appendChild(menuTipo);
        // Cerrar si se hace click fuera
        const close = (ev) => {
            if (ev.target !== menuTipo && ev.target !== btnTipo && !menuTipo.contains(ev.target)) {
                menuTipo.remove();
                document.removeEventListener('mousedown', close);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', close), 0);
    };
}

export function getMesSeleccionadoBuscar() {
    return mesSeleccionado;
}
export function getTipoSeleccionadoBuscar() {
    return tipoSeleccionado;
}
