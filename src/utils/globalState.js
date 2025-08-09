import { useState, useEffect } from 'react';

// Variables globales para el estado de la aplicación
export let categorias = [];
export let transacciones = [];
export let transactionCategories = [];

// Hook para usar el estado global en componentes React
export function useGlobalState(key) {
    const [state, setState] = useState(() => {
        switch (key) {
            case 'categorias':
                return [...categorias];
            case 'transacciones':
                return [...transacciones];
            case 'transactionCategories':
                return [...transactionCategories];
            default:
                return [];
        }
    });

    useEffect(() => {
        // Función para actualizar el estado cuando cambien las variables globales
        const updateState = () => {
            let newState;
            switch (key) {
                case 'categorias':
                    newState = [...categorias];
                    break;
                case 'transacciones':
                    newState = [...transacciones];
                    break;
                case 'transactionCategories':
                    newState = [...transactionCategories];
                    break;
                default:
                    newState = [];
            }
            
            // Solo actualizar si el estado realmente cambió
            if (JSON.stringify(newState) !== JSON.stringify(state)) {
                setState(newState);
            }
        };

        // Escuchar cambios en las variables globales cada 1 segundo
        const interval = setInterval(updateState, 1000);
        
        return () => clearInterval(interval);
    }, [key, state]);

    return [state, setState];
}

// Función para actualizar categorías
export function setCategorias(newCategorias) {
    categorias = [...newCategorias];
}

// Función para actualizar transacciones
export function setTransacciones(newTransacciones) {
    transacciones = newTransacciones;
}

// Función para actualizar relaciones
export function setTransactionCategories(newTransactionCategories) {
    transactionCategories = newTransactionCategories;
}

// Función para agregar una nueva categoría
export function addCategoriaToState(categoria) {
    categorias.push(categoria);
}

// Función para agregar una nueva transacción
export function addTransaccionToState(transaccion) {
    transacciones.push(transaccion);
}

// Función para agregar una nueva relación
export function addTransactionCategoryToState(transactionCategory) {
    transactionCategories.push(transactionCategory);    
}

// Función para obtener transacciones con sus categorías
export function getTransaccionesConCategorias() {
    return transacciones.map(transaccion => {
        const relacion = transactionCategories.find(tc => tc.transaccion_id === transaccion.id);
        const categoria = relacion ? categorias.find(cat => cat.id === relacion.categoria_id) : null;
        return {
            ...transaccion,
            categoria
        };
    });
}

// Función para obtener categorías por tipo (ingreso/gasto)
export function getCategoriasByTipo(tipo) {
    return categorias.filter(categoria => categoria.tipo === tipo);
}

// Función para obtener transacciones por tipo
export function getTransaccionesByTipo(tipo) {
    return transacciones.filter(transaccion => transaccion.tipo === tipo);
}

// Función para calcular el total por tipo
export function getTotalByTipo(tipo) {
    const transaccionesTipo = getTransaccionesByTipo(tipo);
    return transaccionesTipo.reduce((total, transaccion) => {
        return total + parseFloat(transaccion.monto);
    }, 0);
}

// Función para obtener el total general
export function getTotalGeneral() {
    const ingresos = getTotalByTipo('ingreso');
    const gastos = getTotalByTipo('gasto');
    return ingresos - gastos;
}
