import { logger } from './utils';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationService {
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private notifications: Notification[] = [];

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  add(notification: Omit<Notification, 'id'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000
    };

    this.notifications.push(newNotification);
    this.notify();

    // Auto remove after duration
    if (typeof newNotification.duration === 'number' && newNotification.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newNotification.duration);
    }

    return id;
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notify();
  }

  clear() {
    this.notifications = [];
    this.notify();
  }

  success(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ type: 'success', title, message, ...options });
  }

  error(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ type: 'error', title, message, ...options });
  }

  warning(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ type: 'warning', title, message, ...options });
  }

  info(title: string, message: string, options?: Partial<Notification>) {
    return this.add({ type: 'info', title, message, ...options });
  }

  // Helper methods for single message parameter
  showSuccess(message: string, options?: Partial<Notification>) {
    return this.success('نجح', message, options);
  }

  showError(message: string, options?: Partial<Notification>) {
    return this.error('خطأ', message, options);
  }

  showWarning(message: string, options?: Partial<Notification>) {
    return this.warning('تحذير', message, options);
  }

  showInfo(message: string, options?: Partial<Notification>) {
    return this.info('معلومات', message, options);
  }
}

export const notificationService = new NotificationService();

// Browser notification support
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    logger.warn('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, options);
  }
};