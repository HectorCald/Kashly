import React, { useState, useEffect } from 'react'
import './Notification.css'
import { FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa'

function Notification({ message, type = 'info', duration = 3000, onClose }) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Mostrar la notificación después de un pequeño delay para que se vea la animación
        const showTimer = setTimeout(() => {
            setIsVisible(true)
        }, 10)

        // Ocultar la notificación después de la duración
        const hideTimer = setTimeout(() => {
            setIsVisible(false)
            // Esperar a que termine la animación antes de llamar onClose
            setTimeout(() => {
                onClose && onClose()
            }, 400) // Tiempo de la animación CSS
        }, duration)

        return () => {
            clearTimeout(showTimer)
            clearTimeout(hideTimer)
        }
    }, [duration, onClose])

    const handleClose = () => {
        setIsVisible(false)
        // Esperar a que termine la animación antes de llamar onClose
        setTimeout(() => {
            onClose && onClose()
        }, 400) // Tiempo de la animación CSS
    }

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <FaCheck />
            case 'error':
                return <FaExclamationTriangle />
            default:
                return <FaCheck />
        }
    }

    const getTypeClass = () => {
        switch (type) {
            case 'success':
                return 'notification-success'
            case 'error':
                return 'notification-error'
            default:
                return 'notification-info'
        }
    }

    return (
        <div className={`notification ${getTypeClass()} ${isVisible ? 'show' : 'hide'}`}>
            <div className="notification-icon">
                {getIcon()}
            </div>
            <div className="notification-message">
                {message}
            </div>
            <button className="notification-close" onClick={handleClose}>
                <FaTimes />
            </button>
        </div>
    )
}

export default Notification
