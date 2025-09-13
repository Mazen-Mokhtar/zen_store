/**
 * Service Worker Registration Module
 * Handles registration, updates, and lifecycle management of the service worker
 */

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

export interface ServiceWorkerCallbacks {
  onRegistered?: (registration: ServiceWorkerRegistration) => void;
  onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void;
  onUpdateInstalled?: () => void;
  onError?: (error: Error) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

class ServiceWorkerManager {
  private state: ServiceWorkerState = {
    isSupported: false,
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null,
    error: null
  };

  private callbacks: ServiceWorkerCallbacks = {};
  private updateCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.state.isSupported = this.checkSupport();
    this.setupNetworkListeners();
  }

  /**
   * Check if service workers are supported
   */
  private checkSupport(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'caches' in window &&
      'PushManager' in window
    );
  }

  /**
   * Register the service worker
   */
  async register(swPath: string = '/sw.js', callbacks: ServiceWorkerCallbacks = {}): Promise<ServiceWorkerRegistration | null> {
    this.callbacks = { ...this.callbacks, ...callbacks };

    if (!this.state.isSupported) {
      const error = new Error('Service Workers are not supported in this browser');
      this.handleError(error);
      return null;
    }

    try {
      console.log('[SW Registration] Registering service worker...');
      
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      this.state.registration = registration;
      this.state.isRegistered = true;
      this.state.error = null;

      console.log('[SW Registration] Service worker registered successfully');
      
      // Set up event listeners
      this.setupRegistrationListeners(registration);
      
      // Check for updates periodically
      this.startUpdateCheck();
      
      // Notify callback
      if (this.callbacks.onRegistered) {
        this.callbacks.onRegistered(registration);
      }

      return registration;
    } catch (error) {
      console.error('[SW Registration] Registration failed:', error);
      this.handleError(error as Error);
      return null;
    }
  }

  /**
   * Set up registration event listeners
   */
  private setupRegistrationListeners(registration: ServiceWorkerRegistration): void {
    // Listen for service worker updates
    registration.addEventListener('updatefound', () => {
      console.log('[SW Registration] Update found');
      const newWorker = registration.installing;
      
      if (newWorker) {
        this.handleNewWorker(newWorker);
      }
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Registration] Controller changed - reloading page');
      if (this.callbacks.onUpdateInstalled) {
        this.callbacks.onUpdateInstalled();
      } else {
        // Auto-reload if no custom handler
        window.location.reload();
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });
  }

  /**
   * Handle new service worker installation
   */
  private handleNewWorker(worker: ServiceWorker): void {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // Update available
          console.log('[SW Registration] Update available');
          this.state.isUpdateAvailable = true;
          
          if (this.callbacks.onUpdateAvailable && this.state.registration) {
            this.callbacks.onUpdateAvailable(this.state.registration);
          }
        } else {
          // First install
          console.log('[SW Registration] Service worker installed for the first time');
        }
      }
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event;
    
    switch (data?.type) {
      case 'CACHE_UPDATED':
        console.log('[SW Registration] Cache updated:', data.cacheName);
        break;
      case 'OFFLINE_READY':
        console.log('[SW Registration] App ready for offline use');
        break;
      default:
        console.log('[SW Registration] Message from SW:', data);
    }
  }

  /**
   * Set up network status listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[SW Registration] Back online');
      if (this.callbacks.onOnline) {
        this.callbacks.onOnline();
      }
    });

    window.addEventListener('offline', () => {
      console.log('[SW Registration] Gone offline');
      if (this.callbacks.onOffline) {
        this.callbacks.onOffline();
      }
    });
  }

  /**
   * Start periodic update checks
   */
  private startUpdateCheck(): void {
    // Check for updates every 30 minutes
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, 30 * 60 * 1000);
  }

  /**
   * Manually check for service worker updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.state.registration) return;

    try {
      console.log('[SW Registration] Checking for updates...');
      await this.state.registration.update();
    } catch (error) {
      console.error('[SW Registration] Update check failed:', error);
    }
  }

  /**
   * Skip waiting and activate new service worker immediately
   */
  async skipWaiting(): Promise<void> {
    if (!this.state.registration?.waiting) return;

    try {
      // Send message to service worker to skip waiting
      this.state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      console.log('[SW Registration] Skipping waiting period');
    } catch (error) {
      console.error('[SW Registration] Skip waiting failed:', error);
    }
  }

  /**
   * Get cache statistics from service worker
   */
  async getCacheStats(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('No active service worker'));
        return;
      }

      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_STATS' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Cache stats request timeout'));
      }, 5000);
    });
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.state.registration) return false;

    try {
      const result = await this.state.registration.unregister();
      
      if (result) {
        console.log('[SW Registration] Service worker unregistered');
        this.state.isRegistered = false;
        this.state.registration = null;
        
        if (this.updateCheckInterval) {
          clearInterval(this.updateCheckInterval);
          this.updateCheckInterval = null;
        }
      }
      
      return result;
    } catch (error) {
      console.error('[SW Registration] Unregistration failed:', error);
      this.handleError(error as Error);
      return false;
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    this.state.error = error.message;
    console.error('[SW Registration] Error:', error);
    
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }

  /**
   * Get current state
   */
  getState(): ServiceWorkerState {
    return { ...this.state };
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

// Export convenience functions
export const registerServiceWorker = (swPath?: string, callbacks?: ServiceWorkerCallbacks) => {
  return serviceWorkerManager.register(swPath, callbacks);
};

export const checkForUpdates = () => {
  return serviceWorkerManager.checkForUpdates();
};

export const skipWaiting = () => {
  return serviceWorkerManager.skipWaiting();
};

export const getCacheStats = () => {
  return serviceWorkerManager.getCacheStats();
};

export const unregisterServiceWorker = () => {
  return serviceWorkerManager.unregister();
};

export const getServiceWorkerState = () => {
  return serviceWorkerManager.getState();
};

export const isOnline = () => {
  return serviceWorkerManager.isOnline();
};

// Export manager instance for advanced usage
export { serviceWorkerManager };

// Auto-register in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Register after page load to avoid blocking initial render
  window.addEventListener('load', () => {
    registerServiceWorker('/sw.js', {
      onRegistered: (registration) => {
        console.log('SW registered successfully');
      },
      onUpdateAvailable: (registration) => {
        console.log('SW update available');
        // You can show a notification to user here
      },
      onError: (error) => {
        console.error('SW registration failed:', error);
      }
    });
  });
}

export default serviceWorkerManager;