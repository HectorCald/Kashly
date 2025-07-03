
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
            }
            window.dispatchEvent(new Event('transaccionGuardada'));
            overlay.classList.remove('active');
        });
    });
}
export function ascensorAjustes(container) {
    const titulo = container.querySelector('.titulo');
    let startY = 0;
    let currentY = 0;
    let dragging = false;
    let animationFrame;
    let containerHeight = container.offsetHeight;

    function onStart(e) {
        dragging = true;
        container.style.transition = 'none';
        startY = e.touches ? e.touches[0].clientY : e.clientY;
        currentY = 0;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onEnd);
    }

    function onMove(e) {
        if (!dragging) return;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        currentY = clientY - startY;
        if (currentY < 0) currentY = 0; // No subir
        if (currentY > containerHeight) currentY = containerHeight; // No bajar más de su altura
        container.style.transform = `translateY(${currentY}px)`;
    }

    function onEnd() {
        dragging = false;
        container.style.transition = 'transform 0.3s';
        if (currentY > containerHeight / 2) {
            // Ocultar
            container.style.transform = `translateY(100%)`;
            // Opcional: quitar overlay si existe
            const overlay = document.querySelector('.overlay');
            if (overlay) overlay.classList.remove('active');
        } else {
            // Volver a la posición original
            container.style.transform = 'translateY(0)';
        }
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
    }

    titulo.addEventListener('mousedown', onStart);
    titulo.addEventListener('touchstart', onStart);
}