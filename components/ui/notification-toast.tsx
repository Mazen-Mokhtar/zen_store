import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { notificationService, Notification } from '@/lib/notifications';

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-400" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-400" />;
    default:
      return <Info className="h-5 w-5 text-blue-400" />;
  }
};

const getBackgroundColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-500/10 border-green-500/20';
    case 'error':
      return 'bg-red-500/10 border-red-500/20';
    case 'warning':
      return 'bg-yellow-500/10 border-yellow-500/20';
    case 'info':
      return 'bg-blue-500/10 border-blue-500/20';
    default:
      return 'bg-gray-500/10 border-gray-500/20';
  }
};

const getTextColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    case 'warning':
      return 'text-yellow-400';
    case 'info':
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
};

export const NotificationToast: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const handleRemove = (id: string) => {
    notificationService.remove(id);
  };

  const handleAction = (notification: Notification) => {
    if (notification.action) {
      notification.action.onClick();
      handleRemove(notification.id);
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm transition-all duration-300 ${getBackgroundColor(notification.type)}`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${getTextColor(notification.type)}`}>
              {notification.title}
            </h4>
            <p className="text-sm text-gray-300 mt-1">
              {notification.message}
            </p>
            {notification.action && (
              <button
                onClick={() => handleAction(notification)}
                className="text-sm text-green-400 hover:text-green-300 mt-2 underline"
              >
                {notification.action.label}
              </button>
            )}
          </div>
          
          <button
            onClick={() => handleRemove(notification.id)}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}; 