import { resetearEntradaManual } from '../entrada-manual.js';

export function ocultarContenedores() {
    const btnCerrar = document.querySelectorAll('.cerrar');
    const ajustesContainer = document.querySelector('.ajustes-container');
    const entradasContainer = document.querySelector('.entrada-manual');
    const categoriasContainer = document.querySelector('.categorias-container');
    const etiquetasContainer = document.querySelector('.etiquetas-container');
    const buscarTransContainer = document.querySelector('.buscador-transacciones');
    const overlay = document.querySelector('.overlay');
    const overlay2 = document.querySelector('.overlay2');

    overlay.addEventListener('click', () => {
        ajustesContainer.style.transform = 'translateY(100%)';
        buscarTransContainer.style.transform = 'translateY(100%)';
        overlay.classList.remove('active');
    });
    overlay2.addEventListener('click', () => {
        entradasContainer.style.transform = 'translateY(100%)';
        categoriasContainer.style.transform = 'translateY(100%)';
        etiquetasContainer.style.transform = 'translateY(100%)';
        overlay2.classList.remove('active');
        resetearEntradaManual();
    });
    

    btnCerrar.forEach(btn => {
        btn.addEventListener('click', () => {
            // Encuentra el contenedor padre correspondiente
            const contenedor = btn.closest('.ajustes-container, .entrada-manual, .buscador-transacciones');
            if (contenedor) {
                contenedor.style.transform = 'translateY(100%)';
                if (contenedor.classList.contains('ajustes-container') || contenedor.classList.contains('buscador-transacciones')) {
                    overlay.classList.remove('active');
                }
                if (contenedor.classList.contains('entrada-manual')) {
                    overlay2.classList.remove('active');
                }
                if (contenedor.classList.contains('entrada-manual')) {
                    resetearEntradaManual();
                }

            }
            window.dispatchEvent(new Event('transaccionGuardada'));
        });
    });
}
