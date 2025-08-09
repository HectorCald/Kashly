// Ejemplos de datos para las tablas

// Ejemplo de categoría
export const ejemploCategoria = {
    nombre: "Comida",
    icon: "🍕",
    color: "#ff6600",
    background: "#fff3e0"
};

// Ejemplo de transacción
export const ejemploTransaccion = {
    fecha: new Date(),
    descripcion: "Pizza para el almuerzo",
    tipo: "gasto",
    monto: 25.50
};

// Ejemplo de relación transaction_category
export const ejemploTransactionCategory = {
    categoria_id: 1,
    transaccion_id: 1
};

// Función para crear datos de ejemplo
export function crearDatosEjemplo() {
    const categorias = [
        {
            nombre: "Comida",
            icon: "🍕",
            color: "#ff6600",
            background: "#fff3e0"
        },
        {
            nombre: "Transporte",
            icon: "🚗",
            color: "#2196f3",
            background: "#e3f2fd"
        },
        {
            nombre: "Entretenimiento",
            icon: "🎬",
            color: "#9c27b0",
            background: "#f3e5f5"
        },
        {
            nombre: "Salud",
            icon: "🏥",
            color: "#4caf50",
            background: "#e8f5e8"
        },
        {
            nombre: "Educación",
            icon: "📚",
            color: "#ff9800",
            background: "#fff3e0"
        }
    ];

    const transacciones = [
        {
            fecha: new Date('2024-01-15'),
            descripcion: "Pizza para el almuerzo",
            tipo: "gasto",
            monto: 25.50
        },
        {
            fecha: new Date('2024-01-16'),
            descripcion: "Gasolina",
            tipo: "gasto",
            monto: 45.00
        },
        {
            fecha: new Date('2024-01-17'),
            descripcion: "Salario",
            tipo: "ingreso",
            monto: 1500.00
        }
    ];

    return { categorias, transacciones };
}
