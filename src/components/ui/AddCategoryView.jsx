import React, { useState, useEffect } from 'react'
import './AddCategoryView.css'
import { FaTimes, FaTag } from 'react-icons/fa'
import Input from '../Input'
import Category from '../Category'
import IconModal from './IconModal'
import ColorModal from './ColorModal'
import { addCategoria, getCategorias, deleteCategoria } from '../../utils/database'
import { useNotification } from '../../hooks/useNotification'
import { getIconName, getIconComponent } from '../../utils/icons'

function AddCategoryView({ className, onClose }) {
    const [categorias, setCategorias] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
    const [estadoEliminacion, setEstadoEliminacion] = useState('normal')
    const [showIconModal, setShowIconModal] = useState(false)
    const [showColorModal, setShowColorModal] = useState(false)
    const [selectedIconName, setSelectedIconName] = useState('FaTag')
    const [selectedColor, setSelectedColor] = useState('#9e9e9e')
    const { showNotification } = useNotification()
    
    // Cargar categorías cuando se abre la vista
    useEffect(() => {
        if (className === 'active') {
            const cargarCategorias = async () => {
                try {
                    const categoriasData = await getCategorias();
                    setCategorias(categoriasData);
                } catch (error) {
                    console.error('Error al cargar categorías:', error);
                }
            };
            cargarCategorias();
        }
    }, [className]);
    
    const handleAddCategory = async () => {
        if (inputValue.trim() === '') return;
        
        const nombreCategoria = inputValue.trim();
        
        // Verificar si ya existe una categoría con el mismo nombre
        const categoriaExistente = categorias.find(cat => 
            cat.nombre.toLowerCase() === nombreCategoria.toLowerCase()
        );
        
        if (categoriaExistente) {
            showNotification('Ya existe una categoría con ese nombre', 'error', 3000);
            return;
        }
        
        console.log('Creando categoría con icono:', selectedIconName);
        
        const nuevaCategoria = {
            nombre: nombreCategoria,
            icon: selectedIconName,
            color: selectedColor,
            background: '#f5f5f5'
        };
        
        try {
            // Agregar a la base de datos y obtener el ID
            const categoriaId = await addCategoria(nuevaCategoria);
            
            // Crear la categoría con el ID asignado por la base de datos
            const categoriaConId = {
                ...nuevaCategoria,
                id: categoriaId
            };
            
            // Agregar al estado local al final de la lista
            setCategorias([...categorias, categoriaConId]);
            
            // Limpiar el input y restablecer icono y color
            setInputValue('');
            setSelectedIconName('FaTag');
            setSelectedColor('#9e9e9e');
            
        } catch (error) {
            console.error('Error al agregar categoría:', error);
        }
    }

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    }

    const handleCategoryClick = (categoria) => {
        if (categoriaSeleccionada === categoria.id) {
            if (estadoEliminacion === 'normal') {
                setEstadoEliminacion('eliminar');
            } else if (estadoEliminacion === 'eliminar') {
                setEstadoEliminacion('confirmar');
            } else if (estadoEliminacion === 'confirmar') {
                // Eliminar la categoría
                eliminarCategoria(categoria.id);
                setCategoriaSeleccionada(null);
                setEstadoEliminacion('normal');
            }
        } else {
            setCategoriaSeleccionada(categoria.id);
            setEstadoEliminacion('eliminar');
        }
    }

    const eliminarCategoria = async (categoriaId) => {
        try {
            // Eliminar de la base de datos
            await deleteCategoria(categoriaId);
            
            // Agregar clase de animación de salida
            const categoriaElement = document.querySelector(`[data-categoria-id="${categoriaId}"]`);
            if (categoriaElement) {
                categoriaElement.classList.add('eliminando');
                
                // Esperar a que termine la animación antes de eliminar
                setTimeout(() => {
                    const categoriasFiltradas = categorias.filter(cat => cat.id !== categoriaId);
                    setCategorias(categoriasFiltradas);
                }, 300);
            } else {
                // Si no encuentra el elemento, eliminar directamente
                const categoriasFiltradas = categorias.filter(cat => cat.id !== categoriaId);
                setCategorias(categoriasFiltradas);
            }
            
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
        }
    }

    const getCategoryStyle = (categoria) => {
        if (categoriaSeleccionada === categoria.id) {
            if (estadoEliminacion === 'eliminar') {
                return { backgroundColor: '#ff4444', color: 'white' };
            } else if (estadoEliminacion === 'confirmar') {
                return { backgroundColor: '#ff0000', color: 'white' };
            }
        }
        return {};
    }

    const getCategoryText = (categoria) => {
        if (categoriaSeleccionada === categoria.id) {
            if (estadoEliminacion === 'eliminar') {
                return 'Eliminar?';
            } else if (estadoEliminacion === 'confirmar') {
                return 'Confirmar?';
            }
        }
        return categoria.nombre;
    }

    const handleContainerClick = (e) => {
        // Si el click no fue en una categoría, resetear el estado
        if (!e.target.closest('.category')) {
            setCategoriaSeleccionada(null);
            setEstadoEliminacion('normal');
        }
    }

    const handleIconClick = () => {
        setShowIconModal(true);
    }

    const handleCloseIconModal = () => {
        setShowIconModal(false);
    }

    const handleSelectIcon = (icon) => {
        console.log('Icono seleccionado:', icon);
        console.log('Tipo de icono:', typeof icon);
        console.log('Nombre del icono:', icon?.name);
        
        // Guardar solo el nombre del icono
        setSelectedIconName(icon.name);
        setShowIconModal(false);
        setShowColorModal(true);
    }

    const handleCloseColorModal = () => {
        setShowColorModal(false);
    }

    const handleSelectColor = (color) => {
        // Guardar en estado local
        setSelectedColor(color);
        setShowColorModal(false);
    }

    return (
        <div className={`add-category-view ${className}`} onClick={handleContainerClick}>
            <div className="add-category-view-header">
                <h1>Agregar Categoría</h1>
                <button className="add-category-view-close" onClick={onClose}>
                    <FaTimes />
                </button>
            </div>
            <div className="add-category-view-body">
                <Input 
                    placeholder="Categoria" 
                    type="text" 
                    value={inputValue}
                    onChange={handleInputChange}
                    onAdd={handleAddCategory} 
                    onIconClick={handleIconClick}
                    selectedIcon={getIconComponent(selectedIconName)}
                    selectedColor={selectedColor}
                />
            </div>
            <div className="content-container">
                {categorias && categorias.length > 0 ? (
                    categorias.map((categoria) => (
                        <Category 
                            key={categoria.id} 
                            name={getCategoryText(categoria)}
                            onClick={() => handleCategoryClick(categoria)}
                            style={getCategoryStyle(categoria)}
                            icon={categoria.icon}
                            color={categoria.color}
                        />
                    ))
                ) : (
                    <div className="no-categories">
                        <p>No hay categorías disponibles</p>
                    </div>
                )}
            </div>
            
            <IconModal 
                isOpen={showIconModal}
                onClose={handleCloseIconModal}
                onSelectIcon={handleSelectIcon}
            />

            <ColorModal 
                isOpen={showColorModal}
                onClose={handleCloseColorModal}
                onSelectColor={handleSelectColor}
            />
        </div>
    )
}

export default AddCategoryView