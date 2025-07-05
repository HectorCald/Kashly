import { resetearEntradaManual } from './entrada-manual.js';

export function ocultarContenedores() {
    const btnCerrar = document.querySelectorAll('.cerrar');
    const ajustesContainer = document.querySelector('.ajustes-container');
    const entradasContainer = document.querySelector('.entrada-manual');
    const buscarTransContainer = document.querySelector('.buscador-transacciones');
    const overlay = document.querySelector('.overlay');

    overlay.addEventListener('click', () => {
        ajustesContainer.style.transform = 'translateY(100%)';
        buscarTransContainer.style.transform = 'translateY(100%)';
        entradasContainer.style.transform = 'translateY(100%)';
        overlay.classList.remove('active');
        resetearEntradaManual();
    });

    btnCerrar.forEach(btn => {
        btn.addEventListener('click', () => {
            // Encuentra el contenedor padre correspondiente
            const contenedor = btn.closest('.ajustes-container, .entrada-manual, .buscador-transacciones');
            if (contenedor) {
                contenedor.style.transform = 'translateY(100%)';
                // Solo quita el overlay si es el de ajustes o buscar trans
                if (contenedor.classList.contains('ajustes-container') || contenedor.classList.contains('buscador-transacciones')) {
                    overlay.classList.remove('active');
                }
                if (contenedor.classList.contains('entrada-manual')) {
                    resetearEntradaManual();
                }
            }
            window.dispatchEvent(new Event('transaccionGuardada'));
            overlay.classList.remove('active');
        });
    });
}
