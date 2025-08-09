import React, { useState, useEffect, useRef } from 'react'
import './Total.css'
import { getTransaccionesConCategorias } from '../utils/database'

const Total = ({ mesSeleccionado }) => {
  const [total, setTotal] = useState(0)
  const [displayTotal, setDisplayTotal] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevTotalRef = useRef(0)

  useEffect(() => {
    const calcularTotal = async () => {
      try {
        const transacciones = await getTransaccionesConCategorias()
        let totalCalculado = 0

        // Filtrar transacciones por mes si hay uno seleccionado
        let transaccionesFiltradas = transacciones
        if (mesSeleccionado) {
          const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ]
          
          transaccionesFiltradas = transacciones.filter(transaccion => {
            const fecha = new Date(transaccion.fecha)
            const mesTransaccion = months[fecha.getMonth()]
            return mesTransaccion === mesSeleccionado
          })
        }

        transaccionesFiltradas.forEach(transaccion => {
          if (transaccion.tipo === 'Ingreso') {
            totalCalculado += transaccion.monto
          } else if (transaccion.tipo === 'Salida') {
            totalCalculado -= transaccion.monto
          }
        })

        setTotal(totalCalculado)
      } catch (error) {
        console.error('Error al calcular total:', error)
      }
    }

    calcularTotal()
  }, [mesSeleccionado])

  // Efecto para animar el cambio del total
  useEffect(() => {
    if (prevTotalRef.current !== total) {
      setIsAnimating(true)
      
      // Animar el contador
      const startValue = prevTotalRef.current
      const endValue = total
      const duration = 800 // 800ms para una animación más rápida
      const startTime = performance.now()
      
      const animateCounter = (currentTime) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Función de easing para una animación más suave
        const easeOutBack = 1 + 2.594909465 * Math.pow(progress - 1, 3) + 1.594909465 * Math.pow(progress - 1, 2)
        
        const currentValue = startValue + (endValue - startValue) * easeOutBack
        setDisplayTotal(Math.round(currentValue * 100) / 100) // Redondear a 2 decimales
        
        if (progress < 1) {
          requestAnimationFrame(animateCounter)
        } else {
          setDisplayTotal(endValue)
          setIsAnimating(false)
        }
      }
      
      requestAnimationFrame(animateCounter)
      prevTotalRef.current = total
    }
  }, [total])

  const formatearTotal = (monto) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(monto)
  }

  return (
    <div className="total">
      <p className="total-label">Total</p>
      <h1 className={`total-amount ${isAnimating ? 'animating' : ''}`}>
        {formatearTotal(displayTotal)}
      </h1>
    </div>
  )
}

export default Total
