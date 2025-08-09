// Registro del Service Worker para PWA
class ServiceWorkerManager {
  constructor() {
    this.swRegistration = null;
    this.isOnline = navigator.onLine;
    this.init();
  }

  async init() {
    try {
      // Verificar si el navegador soporta Service Workers
      if ('serviceWorker' in navigator) {
        console.log('Service Worker soportado');
        
        // Registrar el Service Worker
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registrado:', this.swRegistration);
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Verificar actualizaciones
        this.checkForUpdates();
        
      } else {
        console.log('Service Worker no soportado');
      }
    } catch (error) {
      console.error('Error al registrar Service Worker:', error);
    }
  }

  setupEventListeners() {
    // Evento de instalación
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Mensaje del Service Worker:', event.data);
    });

    // Evento de actualización disponible
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Nuevo Service Worker activo');
      this.reloadApp();
    });

    // Evento de instalación del Service Worker
    this.swRegistration.addEventListener('updatefound', () => {
      console.log('Nueva versión del Service Worker disponible');
      
      const newWorker = this.swRegistration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('Nueva versión instalada, esperando activación...');
          this.showUpdateNotification();
        }
      });
    });

    // Evento de cambio de estado de conexión
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Conexión restaurada');
      this.hideOfflineNotification();
      this.syncData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Conexión perdida');
      this.showOfflineNotification();
    });
  }

  async checkForUpdates() {
    if (this.swRegistration) {
      try {
        await this.swRegistration.update();
      } catch (error) {
        console.log('No hay actualizaciones disponibles');
      }
    }
  }

  showUpdateNotification() {
    // Crear notificación de actualización
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Kashly Actualizado', {
        body: 'Hay una nueva versión disponible. La app se actualizará automáticamente.',
        icon: '/icons/icon-192x192.png',
        tag: 'update-notification'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Mostrar banner en la app
    this.showUpdateBanner();
  }

  showUpdateBanner() {
    // Crear banner de actualización en la UI
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: var(--primary);
        color: white;
        padding: 12px;
        text-align: center;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">
        <span>🔄 Nueva versión disponible</span>
        <button onclick="this.parentElement.remove()" style="
          margin-left: 16px;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
        ">Cerrar</button>
      </div>
    `;
    
    document.body.appendChild(banner);
  }

  showOfflineNotification() {
    // Mostrar indicador offline
    const offlineIndicator = document.createElement('div');
    offlineIndicator.id = 'offline-indicator';
    offlineIndicator.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f44336;
        color: white;
        padding: 8px;
        text-align: center;
        z-index: 9999;
        font-size: 12px;
      ">
        📶 Modo offline - Los datos se sincronizarán cuando vuelva la conexión
      </div>
    `;
    
    if (!document.getElementById('offline-indicator')) {
      document.body.appendChild(offlineIndicator);
    }
  }

  hideOfflineNotification() {
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) {
      offlineIndicator.remove();
    }
  }

  async syncData() {
    // Sincronizar datos cuando vuelva la conexión
    if (this.swRegistration && this.swRegistration.sync) {
      try {
        await this.swRegistration.sync.register('background-sync');
        console.log('Sincronización en segundo plano registrada');
      } catch (error) {
        console.log('Sincronización en segundo plano no soportada');
      }
    }
  }

  reloadApp() {
    // Recargar la app para aplicar la nueva versión
    window.location.reload();
  }

  // Método para forzar la actualización
  forceUpdate() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Método para obtener el estado del Service Worker
  getStatus() {
    return {
      registered: !!this.swRegistration,
      online: this.isOnline,
      controller: !!navigator.serviceWorker.controller,
      waiting: !!this.swRegistration?.waiting,
      installing: !!this.swRegistration?.installing
    };
  }
}

// Inicializar el gestor del Service Worker
const swManager = new ServiceWorkerManager();

// Exponer globalmente para debugging
window.swManager = swManager;

// Solicitar permisos de notificación
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

console.log('Service Worker Manager inicializado');
