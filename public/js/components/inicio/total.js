export function animarTotal(finalTotal) {
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