export const COLORS = {
    'Rojo': '#f44336',
    'Naranja': '#ff9800',
    'Amarillo': '#ffeb3b',
    'Verde': '#4caf50',
    'Azul': '#2196f3',
    'Púrpura': '#9c27b0',
    'Rosa': '#e91e63',
    'Marrón': '#795548',
    'Gris': '#9e9e9e',
    'Negro': '#212121',
    'Verde Azulado': '#009688',
    'Azul Oscuro': '#3f51b5'
}

export const getMainColors = () => {
    return Object.entries(COLORS).map(([name, color]) => ({
        name,
        color
    }))
}
