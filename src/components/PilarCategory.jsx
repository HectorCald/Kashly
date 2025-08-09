import React, { useState, useEffect, useRef } from 'react'
import './PilarCategory.css'
import { FaTag } from 'react-icons/fa'
import { getIconComponent } from '../utils/icons'

const PilarCategory = ({ name, amount, maxAmount = 1, icon, color }) => {
    const [displayHeight, setDisplayHeight] = useState(60)
    const [isAnimating, setIsAnimating] = useState(false)
    const prevAmountRef = useRef(0)
    
    // Calcular la altura basada en el monto (mínimo 60px, máximo 280px)
    const alturaMinima = 60
    const alturaMaxima = 280
    const alturaObjetivo = amount > 0
        ? Math.max(alturaMinima, (amount / maxAmount) * alturaMaxima)
        : alturaMinima

    // Efecto para animar la altura cuando cambie el monto
    useEffect(() => {
        if (prevAmountRef.current !== amount) {
            setIsAnimating(true)
            
            // Animar la altura
            const startHeight = prevAmountRef.current > 0
                ? Math.max(alturaMinima, (prevAmountRef.current / maxAmount) * alturaMaxima)
                : alturaMinima
            const endHeight = alturaObjetivo
            const duration = 600 // 600ms para una animación rápida
            const startTime = performance.now()
            
            const animateHeight = (currentTime) => {
                const elapsed = currentTime - startTime
                const progress = Math.min(elapsed / duration, 1)
                
                // Función de easing para una animación suave
                const easeOutQuart = 1 - Math.pow(1 - progress, 4)
                
                const currentHeight = startHeight + (endHeight - startHeight) * easeOutQuart
                setDisplayHeight(Math.round(currentHeight))
                
                if (progress < 1) {
                    requestAnimationFrame(animateHeight)
                } else {
                    setDisplayHeight(endHeight)
                    setIsAnimating(false)
                }
            }
            
            requestAnimationFrame(animateHeight)
            prevAmountRef.current = amount
        }
    }, [amount, maxAmount])

    // Formatear el monto para mostrar
    let displayAmount = amount
    if (displayAmount >= 1000) {
        displayAmount = (displayAmount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }


    // Renderizar el icono correcto
    const renderIcon = () => {
        if (icon && icon !== 'FaTag') {
            const IconComponent = getIconComponent(icon);
            return <IconComponent style={{ color: color || '#9e9e9e' }} />;
        }
        return <FaTag style={{ color: color || '#9e9e9e' }} />;
    };

    return (
        <div
            className={`pilar-category ${isAnimating ? 'animating' : ''}`}
            style={{ height: `${displayHeight}px` }}
        >
            <div className="pilar-category-name">
                {renderIcon()}
                <span className="pilar-amount">{displayAmount}</span>
            </div>
        </div>
    )
}

export default PilarCategory