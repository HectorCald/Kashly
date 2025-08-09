import React from 'react'
import './Input.css'
import { FaPlus, FaTag } from 'react-icons/fa'
import ButtonIcon from './ButtonIcon'

function Input({ placeholder, type, value, onChange, onAdd, onIconClick, selectedIcon, selectedColor }) {
    const handleInputChange = (e) => {
        const inputValue = e.target.value;
        
        // Capitalizar primera letra, resto minúscula
        const capitalizedValue = inputValue.charAt(0).toUpperCase() + inputValue.slice(1).toLowerCase();
        
        onChange({ ...e, target: { ...e.target, value: capitalizedValue } });
    };

    const handleKeyPress = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (onAdd) {
                onAdd();
            }
        }
    };

    // Manejar el icono seleccionado correctamente
    const renderIcon = () => {
        if (selectedIcon) {
            // Si selectedIcon es un elemento JSX
            if (React.isValidElement(selectedIcon)) {
                return React.cloneElement(selectedIcon, { 
                    style: { color: selectedColor || '#9e9e9e' } 
                });
            }
            // Si selectedIcon es una función (componente React)
            if (typeof selectedIcon === 'function') {
                const IconComponent = selectedIcon;
                return <IconComponent style={{ color: selectedColor || '#9e9e9e' }} />;
            }
        }
        return <FaTag style={{ color: selectedColor || '#9e9e9e' }} />;
    };

    return (
        <div className="input-container">
            <ButtonIcon icon={renderIcon()} onClick={onIconClick} />
            <input 
                className="input" 
                placeholder={placeholder} 
                type={type} 
                value={value} 
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
            />
            <ButtonIcon icon={<FaPlus />} onClick={onAdd} />
        </div>
    )
}

export default Input