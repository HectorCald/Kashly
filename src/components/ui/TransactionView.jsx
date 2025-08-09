import React, { useEffect, useState } from 'react'
import { FaArrowUp, FaTimes } from 'react-icons/fa'
import './TransactionView.css'
import InputNormal from '../InputNormal'
import CustomSelect from '../CustomSelect'
import { useGlobalState } from '../../utils/globalState'
import { getIconComponent } from '../../utils/icons'
import { getTransaccionesConCategorias, addTransaccion, addTransactionCategory } from '../../utils/database'
import AddTransactionView from './AddTransactionView'
import UndoNotification from './UndoNotification'

function TransactionView({ className, onClose }) {
    const [transaccionesConCategorias, setTransaccionesConCategorias] = useState([])
    const [transaccionesFiltradas, setTransaccionesFiltradas] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [mesSeleccionado, setMesSeleccionado] = useState('')
    const [tipoSeleccionado, setTipoSeleccionado] = useState('Salidas')
    const [mesesDisponibles, setMesesDisponibles] = useState([])
    const [addTransactionView, setAddTransactionView] = useState(false)
    const [transaccionSeleccionada, setTransaccionSeleccionada] = useState(null)
    const [showUndoNotification, setShowUndoNotification] = useState(false)
    const [transaccionEliminada, setTransaccionEliminada] = useState(null)
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [isFiltering, setIsFiltering] = useState(false)
    const [deletingTransactions, setDeletingTransactions] = useState(new Set())
    const [restoringTransactions, setRestoringTransactions] = useState(new Set())
    
    const handleContainerClick = (e) => {
        e.stopPropagation();
    }
    
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    
    const type = [
        'Salidas', 'Ingresos'
    ]

    // Cargar transacciones con categorías cuando se abre el componente
    useEffect(() => {
        if (className === 'active') {
            // Resetear el estado de animación cada vez que se abre
            setIsInitialLoad(true);
            
            const cargarTransacciones = async () => {
                try {
                    const transacciones = await getTransaccionesConCategorias();
                    setTransaccionesConCategorias(transacciones);
                    
                    // Extraer meses únicos de las transacciones
                    const mesesUnicos = [...new Set(transacciones.map(t => {
                        const fecha = new Date(t.fecha);
                        return fecha.getMonth();
                    }))].sort();
                    
                    const nombresMeses = mesesUnicos.map(mesIndex => months[mesIndex]);
                    setMesesDisponibles(nombresMeses);
                    
                    // Establecer mes actual por defecto
                    const mesActual = months[new Date().getMonth()];
                    if (nombresMeses.includes(mesActual)) {
                        setMesSeleccionado(mesActual);
                    } else if (nombresMeses.length > 0) {
                        // Si no hay transacciones del mes actual, usar el primer mes disponible
                        setMesSeleccionado(nombresMeses[0]);
                    }
                    
                    // Activar animación en cascada después de cargar
                    setTimeout(() => {
                        setIsInitialLoad(false);
                    }, 100); // Reducido de 500ms a 100ms para que sea más rápido
                    
                } catch (error) {
                    console.error('Error al cargar transacciones:', error);
                }
            };
            
            cargarTransacciones();
        } else {
            // Cuando se cierra, resetear el estado para la próxima apertura
            setIsInitialLoad(true);
        }
    }, [className]);

    // Filtrar transacciones cuando cambien los filtros
    useEffect(() => {
        let filtradas = transaccionesConCategorias;

        // Filtro por búsqueda de texto
        if (busqueda.trim() !== '') {
            filtradas = filtradas.filter(transaccion => {
                const descripcionMatch = transaccion.descripcion.toLowerCase().includes(busqueda.toLowerCase());
                const categoriaMatch = transaccion.categoria?.nombre.toLowerCase().includes(busqueda.toLowerCase());
                return descripcionMatch || categoriaMatch;
            });
        }

        // Filtro por mes
        if (mesSeleccionado !== '') {
            filtradas = filtradas.filter(transaccion => {
                const fecha = new Date(transaccion.fecha);
                const mesTransaccion = months[fecha.getMonth()];
                return mesTransaccion === mesSeleccionado;
            });
        }

        // Filtro por tipo
        if (tipoSeleccionado !== '') {
            filtradas = filtradas.filter(transaccion => {
                if (tipoSeleccionado === 'Salidas') {
                    return transaccion.tipo === 'Salida';
                } else if (tipoSeleccionado === 'Ingresos') {
                    return transaccion.tipo === 'Ingreso';
                }
                return true;
            });
        }

        setTransaccionesFiltradas(filtradas);
        
        // Activar animación en cascada para filtros
        if (transaccionesConCategorias.length > 0) {
            setIsFiltering(true);
            setTimeout(() => {
                setIsFiltering(false);
            }, 100);
        }
    }, [busqueda, mesSeleccionado, tipoSeleccionado, transaccionesConCategorias]);

    // Efecto para activar la animación en cascada después de la carga inicial
    useEffect(() => {
        if (!isInitialLoad && !isFiltering && transaccionesFiltradas.length > 0) {
            // La animación se activa automáticamente por CSS
            // Solo necesitamos asegurarnos de que isInitialLoad e isFiltering sean false
        }
    }, [transaccionesFiltradas, isInitialLoad, isFiltering]);

    // Efecto para limpiar transacciones eliminadas después de la animación
    useEffect(() => {
        if (deletingTransactions.size > 0) {
            const timer = setTimeout(() => {
                setDeletingTransactions(new Set());
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [deletingTransactions]);

    // Efecto para resetear el estado de animación cuando se monte el componente
    useEffect(() => {
        // Siempre empezar con isInitialLoad en true
        setIsInitialLoad(true);
    }, []);

    const handleTransactionClick = (transaccion) => {
        setTransaccionSeleccionada(transaccion);
        setAddTransactionView(true);
    }

    const handleCloseAddTransaction = () => {
        setAddTransactionView(false);
        setTransaccionSeleccionada(null);
        // Recargar transacciones para mostrar cambios
        const cargarTransacciones = async () => {
            try {
                const transacciones = await getTransaccionesConCategorias();
                setTransaccionesConCategorias(transacciones);
            } catch (error) {
                console.error('Error al recargar transacciones:', error);
            }
        };
        cargarTransacciones();
    }

    const handleTransactionDeleted = (transaccion) => {
        // Agregar la transacción a la lista de eliminación para animación
        setDeletingTransactions(prev => new Set(prev).add(transaccion.id));
        
        // Esperar a que termine la animación de eliminación antes de mostrar la notificación
        setTimeout(() => {
            setTransaccionEliminada(transaccion);
            setShowUndoNotification(true);
            
            // Recargar transacciones para mostrar cambios
            const cargarTransacciones = async () => {
                try {
                    const transacciones = await getTransaccionesConCategorias();
                    setTransaccionesConCategorias(transacciones);
                } catch (error) {
                    console.error('Error al recargar transacciones:', error);
                }
            };
            cargarTransacciones();
        }, 300); // Tiempo para la animación de eliminación
    }

    return (
        <div className={`transaction-view ${className}`} onClick={handleContainerClick}>
            <div className="transaction-view-header">
                <h1>Transacciones</h1>
                <button className="transaction-view-close" onClick={onClose}>
                    <FaTimes />
                </button>
            </div>
            <div className="transaction-view-body">
                <InputNormal 
                    placeholder="Buscar transacción" 
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                <div className="filter-container" >
                    <CustomSelect
                        options={mesesDisponibles}
                        value={mesSeleccionado}
                        placeholder="Seleccionar mes"
                        style={{backgroundColor: 'var(--bg-card'}}
                        onChange={(value) => setMesSeleccionado(value)}
                    />
                    <CustomSelect
                        options={type}
                        value={tipoSeleccionado}
                        placeholder="Seleccionar tipo"
                        style={{backgroundColor: 'var(--bg-card'}}
                        onChange={(value) => setTipoSeleccionado(value)}
                    />

                </div>
                <div className="transaction-container">
                    {transaccionesFiltradas.map((transaccion, index) => {
                        const shouldAnimate = isInitialLoad || isFiltering;
                        const isDeleting = deletingTransactions.has(transaccion.id);
                        const isRestoring = restoringTransactions.has(transaccion.id);
                        
                        return (
                            <div 
                                key={transaccion.id} 
                                className={`transaction-item ${shouldAnimate ? 'cascade-enter' : ''} ${isDeleting ? 'deleting' : ''} ${isRestoring ? 'restoring' : ''}`}
                                onClick={() => handleTransactionClick(transaccion)}
                                style={{ cursor: 'pointer' }}
                                data-index={index}
                            >
                                <div 
                                    className="transaction-item-icon"
                                    style={{
                                        backgroundColor: transaccion.categoria ? `${transaccion.categoria.color}20` : 'var(--bg-card)',
                                        color: transaccion.categoria ? transaccion.categoria.color : 'var(--text-primary)'
                                    }}
                                >
                                    {transaccion.categoria?.icon ? (
                                        React.createElement(getIconComponent(transaccion.categoria.icon))
                                    ) : (
                                        <FaArrowUp />
                                    )}
                                </div>
                                <div className="transaction-item-text">
                                    <p className="transaction-item-date">{new Date(transaccion.fecha).toLocaleDateString('es-ES')}</p>
                                    <h2 className="transaction-item-description">{transaccion.descripcion}</h2>
                                    <p className="transaction-item-category">{transaccion.categoria ? transaccion.categoria.nombre : 'Sin categoría'}</p>
                                </div>
                                <div className="transaction-item-amount">
                                    <p className="transaction-item-amount-value">
                                        {transaccion.tipo === 'Salida' ? '-' : '+'}Bs. {parseFloat(transaccion.monto).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <AddTransactionView 
                className={addTransactionView ? 'active' : 'noActive'}
                onClose={handleCloseAddTransaction}
                transaccionParaEditar={transaccionSeleccionada}
                modoEdicion={true}
                onTransactionDeleted={handleTransactionDeleted}
            />
            
            {showUndoNotification && transaccionEliminada && (
                <UndoNotification
                    message={`Eliminación de ${transaccionEliminada.descripcion}`}
                    onClose={() => {
                        setShowUndoNotification(false);
                        setTransaccionEliminada(null);
                    }}
                    onUndo={async () => {
                        try {
                            // Agregar la transacción a la lista de restauración para animación
                            setRestoringTransactions(prev => new Set(prev).add(transaccionEliminada.id));
                            
                            // Restaurar la transacción eliminada
                            const fechaBolivia = new Date().toLocaleString("en-US", {timeZone: "America/La_Paz"});
                            const transaccionData = {
                                fecha: transaccionEliminada.fecha, // Mantener la fecha original
                                descripcion: transaccionEliminada.descripcion,
                                tipo: transaccionEliminada.tipo,
                                monto: transaccionEliminada.monto
                            };
                            const transaccionId = await addTransaccion(transaccionData);

                            // Restaurar la relación de categoría si existía
                            if (transaccionEliminada.categoria) {
                                const transactionCategoryData = {
                                    transaccion_id: transaccionId,
                                    categoria_id: transaccionEliminada.categoria.id
                                };
                                await addTransactionCategory(transactionCategoryData);
                            }

                            // Recargar transacciones para mostrar la restaurada
                            const cargarTransacciones = async () => {
                                try {
                                    const transacciones = await getTransaccionesConCategorias();
                                    setTransaccionesConCategorias(transacciones);
                                } catch (error) {
                                    console.error('Error al recargar transacciones:', error);
                                }
                            };
                            cargarTransacciones();

                            // Remover de la lista de restauración después de un tiempo
                            setTimeout(() => {
                                setRestoringTransactions(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(transaccionEliminada.id);
                                    return newSet;
                                });
                            }, 600); // Tiempo para la animación de restauración

                            setShowUndoNotification(false);
                            setTransaccionEliminada(null);
                        } catch (error) {
                            console.error('Error al restaurar transacción:', error);
                        }
                    }}
                />
            )}
        </div>
    )
}

export default TransactionView