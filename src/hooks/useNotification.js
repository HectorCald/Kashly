import { useState, useEffect } from 'react'

// Variables globales para las notificaciones
let globalNotifications = []
let globalListeners = []

// Función para notificar a todos los listeners
const notifyListeners = () => {
    globalListeners.forEach(listener => listener([...globalNotifications]))
}

export function useNotification() {
    const [notifications, setNotifications] = useState([...globalNotifications])

    useEffect(() => {
        // Agregar este componente como listener
        const listener = (newNotifications) => {
            setNotifications([...newNotifications])
        }
        
        globalListeners.push(listener)
        
        // Cleanup: remover el listener cuando el componente se desmonte
        return () => {
            globalListeners = globalListeners.filter(l => l !== listener)
        }
    }, [])

    const showNotification = (message, type = 'info', duration = 3000) => {
        const id = Date.now()
        const notification = {
            id,
            message,
            type,
            duration
        }

        globalNotifications = [...globalNotifications, notification]
        notifyListeners()

        // Remover automáticamente después de la duración
        setTimeout(() => {
            globalNotifications = globalNotifications.filter(notification => notification.id !== id)
            notifyListeners()
        }, duration)
    }

    const removeNotification = (id) => {
        globalNotifications = globalNotifications.filter(notification => notification.id !== id)
        notifyListeners()
    }

    return {
        notifications,
        showNotification,
        removeNotification
    }
}
