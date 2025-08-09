const DB_NAME = 'Kashly_db';
const DB_VERSION = 3;

// Variable global para mantener la conexión a la base de datos
let dbConnection = null;

// Función para inicializar la base de datos
export async function initDB() {
    // Si ya tenemos una conexión, la devolvemos
    if (dbConnection) {
        return dbConnection;
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Error al abrir la base de datos:', request.error);
            reject(request.error);
        };

        request.onsuccess = (event) => {
            dbConnection = event.target.result;
            resolve(dbConnection);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Crear tabla de categorías
            if (!db.objectStoreNames.contains('categorias')) {
                const categoriasStore = db.createObjectStore('categorias', { keyPath: 'id', autoIncrement: true });
                // Estructura: id, nombre, icon, color, background
            }

            // Crear tabla de transacciones
            if (!db.objectStoreNames.contains('transacciones')) {
                const transaccionesStore = db.createObjectStore('transacciones', { keyPath: 'id', autoIncrement: true });
                // Estructura: id, fecha, descripcion, tipo, monto
            }

            // Crear tabla intermedia transaction_category
            if (!db.objectStoreNames.contains('transaction_category')) {
                const transactionCategoryStore = db.createObjectStore('transaction_category', { keyPath: 'id', autoIncrement: true });
                // Estructura: id, categoria_id, transaccion_id
                transactionCategoryStore.createIndex('transaccion_id', 'transaccion_id', { unique: false });
                transactionCategoryStore.createIndex('categoria_id', 'categoria_id', { unique: false });
            }
        };
    });
}

// Función para obtener la conexión a la base de datos
async function getDB() {
    if (!dbConnection) {
        dbConnection = await initDB();
    }
    return dbConnection;
}

// Funciones para categorías
export async function addCategoria(categoria) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categorias'], 'readwrite');
        const store = transaction.objectStore('categorias');
        const request = store.add(categoria);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getCategorias() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categorias'], 'readonly');
        const store = transaction.objectStore('categorias');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function deleteCategoria(categoriaId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['categorias'], 'readwrite');
        const store = transaction.objectStore('categorias');
        const request = store.delete(categoriaId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Funciones para transacciones
export async function addTransaccion(transaccion) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transacciones'], 'readwrite');
        const store = transaction.objectStore('transacciones');
        const request = store.add(transaccion);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getTransacciones() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transacciones'], 'readonly');
        const store = transaction.objectStore('transacciones');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Funciones para la relación transaction_category
export async function addTransactionCategory(transactionCategory) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transaction_category'], 'readwrite');
        const store = transaction.objectStore('transaction_category');
        const request = store.add(transactionCategory);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getTransactionCategories() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transaction_category'], 'readonly');
        const store = transaction.objectStore('transaction_category');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Función para obtener transacciones con sus categorías
export async function getTransaccionesConCategorias() {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transacciones', 'transaction_category', 'categorias'], 'readonly');
        const transaccionesStore = transaction.objectStore('transacciones');
        const categoriasStore = transaction.objectStore('categorias');
        const transactionCategoryStore = transaction.objectStore('transaction_category');

        const transaccionesRequest = transaccionesStore.getAll();
        const categoriasRequest = categoriasStore.getAll();
        const transactionCategoryRequest = transactionCategoryStore.getAll();

        Promise.all([
            new Promise((res, rej) => {
                transaccionesRequest.onsuccess = () => res(transaccionesRequest.result);
                transaccionesRequest.onerror = () => rej(transaccionesRequest.error);
            }),
            new Promise((res, rej) => {
                categoriasRequest.onsuccess = () => res(categoriasRequest.result);
                categoriasRequest.onerror = () => rej(categoriasRequest.error);
            }),
            new Promise((res, rej) => {
                transactionCategoryRequest.onsuccess = () => res(transactionCategoryRequest.result);
                transactionCategoryRequest.onerror = () => rej(transactionCategoryRequest.error);
            })
        ]).then(([transacciones, categorias, transactionCategories]) => {
            // Mapear las relaciones
            const transaccionesConCategorias = transacciones.map(transaccion => {
                const relacion = transactionCategories.find(tc => tc.transaccion_id === transaccion.id);
                const categoria = relacion ? categorias.find(cat => cat.id === relacion.categoria_id) : null;
                return {
                    ...transaccion,
                    categoria
                };
            });
            
            // Ordenar del más reciente al más antiguo
            transaccionesConCategorias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            
            resolve(transaccionesConCategorias);
        }).catch(reject);
    });
}

// Función para cargar datos de ejemplo si la base de datos está vacía
export async function cargarDatosEjemplo() {
    try {
        const categoriasExistentes = await getCategorias();
        
        if (categoriasExistentes.length === 0) {
            
            const datosEjemplo = [
                {
                    nombre: "Comida",
                    icon: "🍕",
                    color: "#ff6600",
                    background: "#fff3e0"
                },
                {
                    nombre: "Transporte",
                    icon: "🚗",
                    color: "#2196f3",
                    background: "#e3f2fd"
                },
                {
                    nombre: "Entretenimiento",
                    icon: "🎬",
                    color: "#9c27b0",
                    background: "#f3e5f5"
                },
                {
                    nombre: "Salud",
                    icon: "🏥",
                    color: "#4caf50",
                    background: "#e8f5e8"
                },
                {
                    nombre: "Educación",
                    icon: "📚",
                    color: "#ff9800",
                    background: "#fff3e0"
                }
            ];

            for (const categoria of datosEjemplo) {
                await addCategoria(categoria);
            }
        }
    } catch (error) {
        console.error('Error al cargar datos de ejemplo:', error);
    }
}

// Función para eliminar una transacción y sus relaciones
export async function deleteTransaccion(transaccionId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transacciones', 'transaction_category'], 'readwrite');
        const transaccionesStore = transaction.objectStore('transacciones');
        const transactionCategoryStore = transaction.objectStore('transaction_category');

        // Obtener todas las relaciones para encontrar las que coinciden con la transacción
        const getAllRequest = transactionCategoryStore.getAll();
        
        getAllRequest.onsuccess = () => {
            const relaciones = getAllRequest.result;
            const relacionesAEliminar = relaciones.filter(rel => rel.transaccion_id === transaccionId);
            
            // Eliminar todas las relaciones encontradas
            let eliminadas = 0;
            if (relacionesAEliminar.length === 0) {
                // No hay relaciones, eliminar directamente la transacción
                eliminarTransaccion();
            } else {
                relacionesAEliminar.forEach(relacion => {
                    const deleteRelacionRequest = transactionCategoryStore.delete(relacion.id);
                    deleteRelacionRequest.onsuccess = () => {
                        eliminadas++;
                        if (eliminadas === relacionesAEliminar.length) {
                            // Todas las relaciones eliminadas, ahora eliminar la transacción
                            eliminarTransaccion();
                        }
                    };
                    deleteRelacionRequest.onerror = () => reject(deleteRelacionRequest.error);
                });
            }
        };
        
        getAllRequest.onerror = () => reject(getAllRequest.error);
        
        function eliminarTransaccion() {
            const deleteTransaccionRequest = transaccionesStore.delete(transaccionId);
            deleteTransaccionRequest.onsuccess = () => resolve();
            deleteTransaccionRequest.onerror = () => reject(deleteTransaccionRequest.error);
        }
    });
}

// Función para actualizar una transacción
export async function updateTransaccion(transaccionId, transaccionData) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transacciones'], 'readwrite');
        const store = transaction.objectStore('transacciones');
        
        // Obtener la transacción existente
        const getRequest = store.get(transaccionId);
        
        getRequest.onsuccess = () => {
            const transaccionExistente = getRequest.result;
            if (!transaccionExistente) {
                reject(new Error('Transacción no encontrada'));
                return;
            }
            
            // Actualizar solo los campos permitidos
            const transaccionActualizada = {
                ...transaccionExistente,
                descripcion: transaccionData.descripcion,
                tipo: transaccionData.tipo,
                monto: transaccionData.monto,
                // Mantener la fecha original
            };
            
            const updateRequest = store.put(transaccionActualizada);
            updateRequest.onsuccess = () => resolve(updateRequest.result);
            updateRequest.onerror = () => reject(updateRequest.error);
        };
        
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// Función para actualizar la relación de categoría de una transacción
export async function updateTransactionCategory(transaccionId, nuevaCategoriaId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['transaction_category'], 'readwrite');
        const store = transaction.objectStore('transaction_category');
        
        // Obtener todas las relaciones para encontrar la que coincide
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
            const relaciones = getAllRequest.result;
            const relacionExistente = relaciones.find(rel => rel.transaccion_id === transaccionId);
            
            if (relacionExistente) {
                // Actualizar la categoría existente
                const relacionActualizada = {
                    ...relacionExistente,
                    categoria_id: nuevaCategoriaId
                };
                
                const updateRequest = store.put(relacionActualizada);
                updateRequest.onsuccess = () => resolve(updateRequest.result);
                updateRequest.onerror = () => reject(updateRequest.error);
            } else {
                // Si no existe relación, crear una nueva
                const nuevaRelacion = {
                    transaccion_id: transaccionId,
                    categoria_id: nuevaCategoriaId
                };
                
                const addRequest = store.add(nuevaRelacion);
                addRequest.onsuccess = () => resolve(addRequest.result);
                addRequest.onerror = () => reject(addRequest.error);
            }
        };
        
        getAllRequest.onerror = () => reject(getAllRequest.error);
    });
}
