let recognition = null;
let listening = false;
let recognitionActive = false;
let textoReconocido = '';

export function inicializarEntradaVoz() {
    const btnMicrofono = document.querySelector('.entradas .entrada-voz-btn');
    const btnManual = document.querySelector('.entradas .entrada-manual-btn');
    const divVoz = document.querySelector('.entradas .entrada-voz-flotante');
    const btnTrash = document.querySelector('.entradas .entrada-voz-trash');
    if (!btnMicrofono || !btnManual || !divVoz || !btnTrash) return;
    btnMicrofono.onclick = () => mostrarDivVoz(btnMicrofono, btnManual, divVoz, btnTrash);
}

function mostrarDivVoz(btnMicrofono, btnManual, divVoz, btnTrash) {
    if (listening) return;
    // Cambiar icono micrófono a check (Boxicons)
    const iconMic = btnMicrofono.querySelector('i');
    if (iconMic) { iconMic.classList.remove('bx-microphone'); iconMic.classList.add('bx-check'); }
    // Ocultar botón entrada manual
    btnManual.style.display = 'none';
    // Mostrar diva y trash
    divVoz.classList.add('active');
    btnTrash.classList.add('active');
    // Limpiar input
    const inputVoz = divVoz.querySelector('.voz-texto');
    if (inputVoz) inputVoz.value = '';
    // Cerrar (trash)
    btnTrash.onclick = () => {
        detenerReconocimiento();
        restaurarBotonesVoz(btnMicrofono, btnManual, divVoz, btnTrash);
    };
    // Confirmar (check)
    btnMicrofono.onclick = () => {
        detenerReconocimiento();
        restaurarBotonesVoz(btnMicrofono, btnManual, divVoz, btnTrash);
        const inputVoz = divVoz.querySelector('.voz-texto');
        let texto = '';
        if (inputVoz && inputVoz.value && inputVoz.value.trim()) {
            texto = inputVoz.value.trim();
            console.log('[VOZ] Texto tomado del input:', texto);
        } else if (textoReconocido && textoReconocido.trim()) {
            texto = textoReconocido.trim();
            console.log('[VOZ] Texto tomado de textoReconocido:', texto);
        }
        if (texto) {
            console.log('[VOZ] Abriendo entrada manual con texto:', texto);
            // Analizar texto antes
            const { tipo, monto, descripcion } = analizarTextoVoz(texto);
            // Disparar evento de edición para abrir en modo edición y permitir etiquetas/categorías
            window.dispatchEvent(new CustomEvent('editarTransaccion', {
                detail: {
                    descripcion,
                    monto: monto || '',
                    tipo: tipo || 'negativo',
                    idCategoria: null,
                    idEtiqueta: null,
                    fecha: null
                }
            }));
            // Quitar botones de edición y trash, restaurar guardar
            setTimeout(() => {
                const contEdicion = document.querySelector('.entrada-manual .botones-edicion');
                const btnGuardar = document.querySelector('.entrada-manual .guardar');
                if (contEdicion) contEdicion.remove();
                if (btnGuardar) btnGuardar.style.display = '';
            }, 100);
        } else {
            console.log('[VOZ] No hay texto para procesar');
        }
    };
    // Iniciar reconocimiento
    iniciarReconocimiento(inputVoz);
}

function restaurarBotonesVoz(btnMicrofono, btnManual, divVoz, btnTrash) {
    const iconMic = btnMicrofono.querySelector('i');
    if (iconMic) { iconMic.classList.remove('bx-check'); iconMic.classList.add('bx-microphone'); }
    btnManual.style.display = '';
    divVoz.classList.remove('active');
    btnTrash.classList.remove('active');
    inicializarEntradaVoz();
}

function analizarTextoVoz(texto) {
    // Palabras clave
    const palabrasGasto = ['comprando','compre','compré','egreso','gasto','gaste','gasté','menos','pague','pagué','pagando','pagado','resta','retire','retiré','retirado','salida','salio','salió'];
    const palabrasIngreso = ['cobre','cobré','cobrado','depositado','deposite','deposité','entrada','entro','entró','gané','gane','ingresado','ingrese','ingresé','ingreso','más','mas','recibi','recibí','recibido','suma'];

    let tipo = 'negativo';
    let descripcion = texto;
    let palabraClave = '';
    // Detectar tipo y palabra clave
    for (const palabra of palabrasIngreso) {
        if (texto.toLowerCase().includes(palabra)) {
            tipo = 'positivo';
            palabraClave = palabra;
            break;
        }
    }
    for (const palabra of palabrasGasto) {
        if (texto.toLowerCase().includes(palabra)) {
            tipo = 'negativo';
            palabraClave = palabra;
            break;
        }
    }
    // Detectar monto (primer número con decimales o sin)
    const match = texto.match(/([0-9]+([.,][0-9]{1,2})?)/);
    let monto = '';
    if (match) {
        monto = match[1].replace(',', '.');
        // Quitar el monto del texto para la descripción
        descripcion = texto.replace(match[0], '').trim();
    }
    // Quitar palabra clave de la descripción
    if (palabraClave) {
        const regex = new RegExp(palabraClave, 'i');
        descripcion = descripcion.replace(regex, '').trim();
    }
    return { tipo, monto, descripcion };
}

function iniciarReconocimiento(inputVoz) {
    textoReconocido = '';
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        inputVoz.value = 'Reconocimiento de voz no soportado';
        return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.continuous = true;
    listening = true;
    recognitionActive = false;
    recognition.onstart = () => { recognitionActive = true; };
    recognition.onend = () => {
        recognitionActive = false;
        if (listening) {
            if (!recognitionActive) {
                try { recognition.start(); } catch (e) { /* ignore */ }
            }
        } else {
            listening = false;
        }
    };
    recognition.onerror = (e) => {
        if (e.error === 'no-speech') {
            if (listening && !recognitionActive) {
                try { recognition.start(); } catch (err) { /* ignore */ }
            }
            return;
        }
        inputVoz.value = 'Error: ' + e.error;
        listening = false;
    };
    recognition.onresult = (event) => {
        let interim = '';
        for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                textoReconocido += event.results[i][0].transcript;
            } else {
                interim += event.results[i][0].transcript;
            }
        }
        inputVoz.value = textoReconocido + interim;
    };
    recognition.start();
}

function detenerReconocimiento() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    listening = false;
} 