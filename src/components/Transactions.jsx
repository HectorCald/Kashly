import React, { useState, useEffect } from 'react'
import './Transactions.css'
import PilarCategory from './PilarCategory'
import { getTransaccionesConCategorias, getCategorias } from '../utils/database'

const Transactions = ({ filterActivo = 'salidas', mesSeleccionado }) => {
  const [categoriasConMontos, setCategoriasConMontos] = useState([])

  useEffect(() => {
    const cargarCategoriasConMontos = async () => {
      try {
        const [transacciones, categorias] = await Promise.all([
          getTransaccionesConCategorias(),
          getCategorias()
        ])
        
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
        
        // Crear un mapa con todas las categorías
        const categoriasMap = new Map()
        
        // Inicializar todas las categorías con monto 0
        categorias.forEach(categoria => {
          categoriasMap.set(categoria.id, {
            id: categoria.id,
            nombre: categoria.nombre,
            monto: 0,
            icon: categoria.icon,
            color: categoria.color
          })
        })
        
        // Sumar montos de transacciones según el filtro activo
        transaccionesFiltradas.forEach(transaccion => {
          if (transaccion.categoria) {
            const categoriaId = transaccion.categoria.id
            if (categoriasMap.has(categoriaId)) {
              const categoria = categoriasMap.get(categoriaId)
              
              // Aplicar filtro: solo sumar transacciones del tipo seleccionado
              if (filterActivo === 'ingresos' && transaccion.tipo === 'Ingreso') {
                categoria.monto += parseFloat(transaccion.monto)
              } else if (filterActivo === 'salidas' && transaccion.tipo === 'Salida') {
                categoria.monto += parseFloat(transaccion.monto)
              }
            }
          }
        })
        
        // Convertir a array y ordenar por monto descendente (mantener todas las categorías)
        const categoriasArray = Array.from(categoriasMap.values())
          .sort((a, b) => b.monto - a.monto)
        
        setCategoriasConMontos(categoriasArray)
      } catch (error) {
        console.error('Error al cargar categorías con montos:', error)
      }
    }

    cargarCategoriasConMontos()
  }, [filterActivo, mesSeleccionado]) // Re-ejecutar cuando cambie el filtro o el mes

  // Calcular el monto máximo para normalizar las alturas
  const maxMonto = categoriasConMontos.length > 0 
    ? Math.max(...categoriasConMontos.map(cat => cat.monto))
    : 1

  return (
    <div className="transactions">
      {categoriasConMontos.length > 0 ? (
        categoriasConMontos.map((categoria) => (
          <PilarCategory 
            key={categoria.id}
            name={categoria.nombre} 
            amount={categoria.monto}
            maxAmount={maxMonto}
            icon={categoria.icon}
            color={categoria.color}
          />
        ))
      ) : (
        <div className="no-transacciones">
            <p>No hay transacciones disponibles</p>
        </div>
      )}
    </div>
  )
}

export default Transactions
