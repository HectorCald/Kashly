import React, { useState, useEffect } from 'react'
import './AddTransactionView.css'
import { FaTimes, FaPlus, FaMinus, FaSave, FaTag, FaTrash } from 'react-icons/fa'
import InputOne from '../InputOne'
import Category from '../Category'
import Button from '../Button'
import ButtonIcon from '../ButtonIcon'
import AddCategoryView from './AddCategoryView'

import { getCategorias, addTransaccion, addTransactionCategory, deleteTransaccion, updateTransaccion, updateTransactionCategory } from '../../utils/database'
import { useNotification } from '../../hooks/useNotification'

function AddTransactionView({ className, onClose, transaccionParaEditar = null, modoEdicion = false, onTransactionDeleted = null }) {
    const [addCategoryView, setAddCategoryView] = useState(false);
    const [categorias, setCategorias] = useState([]);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
    const [tipoTransaccion, setTipoTransaccion] = useState('plus'); // 'plus' o 'minus'
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');

    const { showNotification } = useNotification();
    
    // Cargar categorías cuando se abre la vista
    useEffect(() => {
        if (className === 'active') {
            cargarCategorias();
        }
    }, [className]);

    // Cargar categorías cuando se cierra AddCategoryView
    useEffect(() => {
        if (!addCategoryView) {
            cargarCategorias();
        }
    }, [addCategoryView]);

    // Pre-llenar campos si estamos en modo edición
    useEffect(() => {
        if (modoEdicion && transaccionParaEditar && className === 'active') {
            setDescripcion(transaccionParaEditar.descripcion);
            setMonto(transaccionParaEditar.monto.toString());
            setTipoTransaccion(transaccionParaEditar.tipo === 'Ingreso' ? 'plus' : 'minus');
            if (transaccionParaEditar.categoria) {
                setCategoriaSeleccionada(transaccionParaEditar.categoria.id);
            }
        }
    }, [modoEdicion, transaccionParaEditar, className]);

    const cargarCategorias = async () => {
        try {
            const categoriasData = await getCategorias();
            setCategorias(categoriasData);
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    };

    const handleCategoryClick = (categoria) => {
        if (categoriaSeleccionada === categoria.id) {
            // Si es la misma categoría, deseleccionar
            setCategoriaSeleccionada(null);
        } else {
            // Si es una categoría diferente, seleccionar
            setCategoriaSeleccionada(categoria.id);
            
            // Hacer scroll al inicio del contenedor
            const container = document.querySelector('.add-transaction-view-categories');
            if (container) {
                container.scrollTo({
                    left: 0,
                    behavior: 'smooth'
                });
            }
        }
    };
    
    const handleAddCategory = () => {
        setAddCategoryView(true);
    }

    const handleCloseCategory = () => {
        setAddCategoryView(false);
    }

    const handleTipoChange = (tipo) => {
        setTipoTransaccion(tipo);
    }

    const limpiarFormulario = () => {
        setDescripcion('');
        setMonto('');
        setTipoTransaccion('plus');
        setCategoriaSeleccionada(null);
    }

    const handleGuardarTransaccion = async () => {
        // Validaciones
        if (!descripcion.trim()) {
            showNotification('Debes ingresar una descripción', 'error');
            return;
        }

        if (!monto || parseFloat(monto) <= 0) {
            showNotification('Debes ingresar un monto válido', 'error');
            return;
        }

        if (!categoriaSeleccionada) {
            showNotification('Debes seleccionar una categoría', 'error');
            return;
        }

        try {
            // Crear objeto de transacción con hora de Bolivia
            const fechaBolivia = new Date().toLocaleString("en-US", {timeZone: "America/La_Paz"});
            const transaccionData = {
                fecha: fechaBolivia,
                descripcion: descripcion.trim(),
                tipo: tipoTransaccion === 'plus' ? 'Ingreso' : 'Salida',
                monto: parseFloat(monto)
            };

            // Guardar la transacción
            const transaccionId = await addTransaccion(transaccionData);
            
            // Crear la relación en la tabla intermedia
            const transactionCategoryData = {
                transaccion_id: transaccionId,
                categoria_id: categoriaSeleccionada
            };
            
            await addTransactionCategory(transactionCategoryData);
            
            // Mostrar mensaje de éxito
            showNotification('Transacción guardada exitosamente', 'success');
            
            // Limpiar formulario
            limpiarFormulario();
            
            // Cerrar la vista
            onClose();
            
        } catch (error) {
            console.error('Error al guardar transacción:', error);
            showNotification('Error al guardar la transacción', 'error');
        }
    }

    const handleGuardarCambios = async () => {
        // Validaciones
        if (!descripcion.trim()) {
            showNotification('Debes ingresar una descripción', 'error');
            return;
        }

        if (!monto || parseFloat(monto) <= 0) {
            showNotification('Debes ingresar un monto válido', 'error');
            return;
        }

        if (!categoriaSeleccionada) {
            showNotification('Debes seleccionar una categoría', 'error');
            return;
        }

        try {
            // Actualizar la transacción
            const transaccionData = {
                descripcion: descripcion.trim(),
                tipo: tipoTransaccion === 'plus' ? 'Ingreso' : 'Salida',
                monto: parseFloat(monto)
            };

            await updateTransaccion(transaccionParaEditar.id, transaccionData);
            
            // Actualizar la relación de categoría si cambió
            if (transaccionParaEditar.categoria && transaccionParaEditar.categoria.id !== categoriaSeleccionada) {
                await updateTransactionCategory(transaccionParaEditar.id, categoriaSeleccionada);
            } else if (!transaccionParaEditar.categoria && categoriaSeleccionada) {
                // Si no tenía categoría, crear la relación
                await updateTransactionCategory(transaccionParaEditar.id, categoriaSeleccionada);
            }
            
            showNotification('Cambios guardados exitosamente', 'success');
            onClose();
            
        } catch (error) {
            console.error('Error al guardar cambios:', error);
            showNotification('Error al guardar los cambios', 'error');
        }
    }

    const handleEliminarTransaccion = async () => {
        try {
            // Eliminar la transacción y sus relaciones
            await deleteTransaccion(transaccionParaEditar.id);
            
            // Notificar al componente padre sobre la transacción eliminada
            if (onTransactionDeleted) {
                onTransactionDeleted(transaccionParaEditar);
            }
            
            // Cerrar la vista inmediatamente después de eliminar
            onClose();
            
        } catch (error) {
            console.error('Error al eliminar transacción:', error);
            showNotification('Error al eliminar la transacción', 'error');

        }
    }

    // Limpiar formulario cuando se cierra la vista
    useEffect(() => {
        if (className !== 'active') {
            limpiarFormulario();
        }
    }, [className]);

    return (
        <div className={`add-transaction-view ${className}`}>
            <div className="add-transaction-view-header">
                <h1>{modoEdicion ? 'Editar Transacción' : 'Agregar Transacción'}</h1>
                <button className="add-transaction-view-close" onClick={onClose}>
                    <FaTimes />
                </button>
            </div>
            <div className="add-transaction-view-body">
                <InputOne 
                    placeholder="Descripción" 
                    type="text" 
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                />
                <div className="monto">
                    <div className="monto-tipo">
                        <button 
                            className={`monto-tipo-button plus ${tipoTransaccion === 'plus' ? 'activo' : ''}`}
                            onClick={() => handleTipoChange('plus')}
                        >
                            <FaPlus />
                        </button>
                        <button 
                            className={`monto-tipo-button minus ${tipoTransaccion === 'minus' ? 'activo' : ''}`}
                            onClick={() => handleTipoChange('minus')}
                        >
                            <FaMinus />
                        </button>
                    </div>
                    <InputOne 
                        placeholder="Monto" 
                        type="number" 
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                    />
                </div>

                <div className={`add-transaction-view-categories ${categoriaSeleccionada ? 'has-selected' : ''}`}>
                    <button className="add-transaction-view-button" onClick={handleAddCategory}>
                        <FaPlus />
                    </button>
                    {categorias && categorias.length > 0 ? (
                        categorias.map((categoria) => (
                            <Category 
                                key={categoria.id} 
                                name={categoria.nombre}
                                onClick={() => handleCategoryClick(categoria)}
                                className={categoriaSeleccionada === categoria.id ? 'selected' : ''}
                                data-categoria-id={categoria.id}
                                icon={categoria.icon}
                                color={categoria.color}
                            />
                        ))
                    ) : (
                        <div className="no-categories-add-transaction">
                            <p>No hay categorías disponibles</p>
                        </div>
                    )}
                </div>

                {!modoEdicion ? (
                    <Button icon={<FaSave />} tipo="gray" onClick={handleGuardarTransaccion}>
                        Guardar transacción
                    </Button>
                ) : (
                    <div className="edit-buttons">
                        <ButtonIcon icon={<FaTrash />} tipo="red" onClick={handleEliminarTransaccion}>
                        </ButtonIcon>
                        <ButtonIcon icon={<FaSave />} tipo="gray" onClick={handleGuardarCambios}>
                        </ButtonIcon>
                    </div>
                )}
            </div>
            
            <AddCategoryView 
                className={addCategoryView ? 'active' : 'noActive'}
                onClose={handleCloseCategory}
            />
        </div>
    )
}

export default AddTransactionView;