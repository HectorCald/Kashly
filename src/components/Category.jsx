import React from 'react'
import './Category.css'
import { FaTag } from 'react-icons/fa'
import { getIconComponent } from '../utils/icons'

function Category({ name, onClick, style, className, icon, color }) {
    // Renderizar el icono correcto
    const renderIcon = () => {
        if (icon && icon !== 'FaTag') {
            const IconComponent = getIconComponent(icon);
            return <IconComponent style={{ color: color || '#9e9e9e' }} />;
        }
        return <FaTag style={{ color: color || '#9e9e9e' }} />;
    };

    return (
        <div className={`category ${className || ''}`} onClick={onClick}>
            <h1 style={style}>
                {renderIcon()}
                <span>{name}</span>
            </h1>
        </div>
    )
}

export default Category
