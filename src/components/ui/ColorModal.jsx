import React from 'react'
import './ColorModal.css'
import { FaTimes } from 'react-icons/fa'
import { getMainColors } from '../../utils/colors'

const ColorModal = ({ isOpen, onClose, onSelectColor }) => {
    const colors = getMainColors()

    const handleColorClick = (color) => {
        if (onSelectColor) {
            onSelectColor(color)
        }
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="color-modal-overlay" onClick={onClose}>
            <div className="color-modal" onClick={(e) => e.stopPropagation()}>
                <div className="color-modal-header">
                    <h2>Seleccionar Color</h2>
                    <button className="color-modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <div className="color-modal-content">
                    <div className="color-grid">
                        {colors.map((color) => (
                            <button
                                key={color.name}
                                className="color-item"
                                style={{ backgroundColor: color.color }}
                                onClick={() => handleColorClick(color.color)}
                                title={color.name}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ColorModal
