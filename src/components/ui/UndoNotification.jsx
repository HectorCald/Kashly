import React, { useEffect, useState } from 'react'
import { FaTrash, FaUndo } from 'react-icons/fa'
import './UndoNotification.css'

function UndoNotification({ message, onUndo, onClose, duration = 3000 }) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Mostrar la notificación
        setIsVisible(true)

        // Ocultar automáticamente después del tiempo especificado
        const timer = setTimeout(() => {
            setIsVisible(false)
            setTimeout(() => {
                onClose()
            }, 300) // Esperar a que termine la animación
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onClose])

    const handleUndo = () => {
        onUndo()
        setIsVisible(false)
        setTimeout(() => {
            onClose()
        }, 300)
    }



    return (
        <div className={`undo-notification ${isVisible ? 'visible' : ''}`}>
            <div className="undo-notification-content">
                <div className="undo-notification-icon">
                    <FaTrash />
                </div>
                <div className="undo-notification-message">
                    {message}
                </div>
                <div className="undo-notification-actions">
                    <button className="undo-button" onClick={handleUndo}>
                        Deshacer
                    </button>
                </div>
            </div>
        </div>
    )
}

export default UndoNotification
