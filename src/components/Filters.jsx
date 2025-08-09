import React, { useState, useEffect } from 'react'
import './Filters.css'
import { getTransaccionesConCategorias } from '../utils/database'

const Filters = ({ onFilterChange, mesSeleccionado }) => {
  const [totalIngresos, setTotalIngresos] = useState(0)
  const [totalSalidas, setTotalSalidas] = useState(0)
  const [filterActivo, setFilterActivo] = useState('salidas') // 'ingresos' o 'salidas' - por defecto 'salidas'

  useEffect(() => {
    const cargarTotales = async () => {
      try {
        const transacciones = await getTransaccionesConCategorias()
        
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

        const ingresos = transaccionesFiltradas.filter(t => t.tipo === 'Ingreso')
        const sumaIngresos = ingresos.reduce((total, t) => total + parseFloat(t.monto), 0)
        setTotalIngresos(sumaIngresos)

        const salidas = transaccionesFiltradas.filter(t => t.tipo === 'Salida')
        const sumaSalidas = salidas.reduce((total, t) => total + parseFloat(t.monto), 0)
        setTotalSalidas(sumaSalidas)
      } catch (error) {
        console.error('Error al cargar totales:', error)
      }
    }
    cargarTotales()
  }, [mesSeleccionado])

  const handleFilterClick = (tipo) => {
    setFilterActivo(tipo)
    if (onFilterChange) {
      onFilterChange(tipo)
    }
  }

  return (
    <div className="filters">
      <button
        className={`filter-button ${filterActivo === 'ingresos' ? 'active' : ''} ingresos`}
        onClick={() => handleFilterClick('ingresos')}
      >
        +Bs. {totalIngresos.toFixed(2)}
      </button>
      <button
        className={`filter-button ${filterActivo === 'salidas' ? 'active' : ''} gastos`}
        onClick={() => handleFilterClick('salidas')}
      >
        -Bs. {totalSalidas.toFixed(2)}
      </button>
    </div>
  )
}

export default Filters
