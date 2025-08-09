import React from 'react'
import './IconModal.css'
import { FaTimes } from 'react-icons/fa'
import { ICON_CATEGORIES } from '../../utils/icons'

const IconModal = ({ isOpen, onClose, onSelectIcon }) => {
    const handleIconClick = (icon) => {
        if (onSelectIcon) {
            onSelectIcon(icon)
        }
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="icon-modal-overlay" onClick={onClose}>
            <div className="icon-modal" onClick={(e) => e.stopPropagation()}>
                <div className="icon-modal-header">
                    <h2>Seleccionar Icono</h2>
                    <button className="icon-modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <div className="icon-modal-content">
                    {Object.entries(ICON_CATEGORIES).map(([category, icons]) => (
                        <div key={category} className="icon-category">
                            <h3 className="icon-category-title">{category}</h3>
                            <div className="icon-grid">
                                {icons.map((Icon, index) => (
                                    <button
                                        key={index}
                                        className="icon-item"
                                        onClick={() => handleIconClick(Icon)}
                                    >
                                        <Icon />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default IconModal
