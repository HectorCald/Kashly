import './App.css'
import Total from './components/Total'
import Filters from './components/Filters'
import CustomSelect from './components/CustomSelect'
import Transactions from './components/Transactions'
import SearchBar from './components/SearchBar'
import AddTransaction from './components/AddTransaction'
import AddTransactionView from './components/ui/AddTransactionView'
import AddCategoryView from './components/ui/AddCategoryView'
import TransactionView from './components/ui/TransactionView'
import Notification from './components/Notification'
import { useState, useEffect } from 'react'
import { initDB, getCategorias, getTransacciones, getTransactionCategories, getTransaccionesConCategorias } from './utils/database'
import { setCategorias, setTransacciones, setTransactionCategories } from './utils/globalState'
import { useNotification } from './hooks/useNotification'

function App() {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  
  const [addTransactionView, setAddTransactionView] = useState(false)
  const [addCategoryView, setAddCategoryView] = useState(false)
  const [transactionView, setTransactionView] = useState(false)
  const [updateTrigger, setUpdateTrigger] = useState(0)
  const [filterActivo, setFilterActivo] = useState('salidas') // 'ingresos' o 'salidas' - por defecto 'salidas'
  const [mesSeleccionado, setMesSeleccionado] = useState('')
  const [mesesDisponibles, setMesesDisponibles] = useState([])
  const { notifications, removeNotification } = useNotification()

  // Inicializar base de datos y cargar datos
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Inicializar la base de datos
        await initDB();

        // Cargar transacciones
        const transaccionesData = await getTransacciones();
        setTransacciones(transaccionesData);

        // Cargar relaciones
        const transactionCategoriesData = await getTransactionCategories();
        setTransactionCategories(transactionCategoriesData);

        // Cargar transacciones con categorías para obtener meses disponibles
        const transaccionesConCategorias = await getTransaccionesConCategorias();
        
        // Extraer meses únicos de las transacciones
        const mesesUnicos = [...new Set(transaccionesConCategorias.map(t => {
          const fecha = new Date(t.fecha);
          return fecha.getMonth();
        }))].sort();
        
        const nombresMeses = mesesUnicos.map(mesIndex => months[mesIndex]);
        setMesesDisponibles(nombresMeses);
        
        // Establecer mes actual por defecto
        const mesActual = months[new Date().getMonth()];
        if (nombresMeses.includes(mesActual)) {
          setMesSeleccionado(mesActual);
        } else if (nombresMeses.length > 0) {
          // Si no hay transacciones del mes actual, usar el primer mes disponible
          setMesSeleccionado(nombresMeses[0]);
        }

      } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
      }
    };

    initializeApp();
  }, []);

  const handleAddTransaction = () => {
    setAddTransactionView(true)
  }
  const handleCloseTransaction = () => {
    setAddTransactionView(false)
    // Forzar actualización de componentes
    setUpdateTrigger(prev => prev + 1)
  }


  const handleCloseTransactionView = () => {
    setTransactionView(false)
    setUpdateTrigger(prev => prev + 1)
  }
  const handleTransactionView = () => {
    setTransactionView(true)
  }

  const handleCloseCategory = () => {
    setAddCategoryView(false)
    // Forzar actualización de componentes
    setUpdateTrigger(prev => prev + 1)
  }
  const handleAddCategory = () => {
    setAddCategoryView(true)
  }

  const handleFilterChange = (tipo) => {
    setFilterActivo(tipo)
  }

  const handleMesChange = (mes) => {
    setMesSeleccionado(mes)
    // Forzar actualización de componentes para que recalculen con el nuevo mes
    setUpdateTrigger(prev => prev + 1)
  }

  return (
    <div className="app-container">
      <div className="home-screen">
        <Total key={`total-${updateTrigger}`} mesSeleccionado={mesSeleccionado} />
        <Filters key={`filters-${updateTrigger}`} onFilterChange={handleFilterChange} mesSeleccionado={mesSeleccionado} />
        <CustomSelect 
          options={mesesDisponibles}
          value={mesSeleccionado}
          placeholder="Mes"
          onChange={handleMesChange}
        />
        <Transactions key={`transactions-${updateTrigger}`} filterActivo={filterActivo} mesSeleccionado={mesSeleccionado} />
        <SearchBar onClick={handleTransactionView}/>
        <AddTransaction onClick={handleAddTransaction} onClickCategory={handleAddCategory}/>

        <TransactionView 
          className={transactionView ? 'active' : 'noActive'}
          onClose={handleCloseTransactionView}
        />

        <AddTransactionView 
          className={addTransactionView ? 'active' : 'noActive'}
          onClose={handleCloseTransaction}
        />

        <AddCategoryView 
          className={addCategoryView ? 'active' : 'noActive'}
          onClose={handleCloseCategory}
        />
      </div>
      
      {/* Sistema de notificaciones */}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

export default App