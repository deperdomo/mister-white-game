import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const toastStyles = {
  success: 'bg-green-950 border-green-800 text-green-200',
  error: 'bg-red-950 border-red-800 text-red-200',
  warning: 'bg-yellow-950 border-yellow-800 text-yellow-200',
  info: 'bg-blue-950 border-blue-800 text-blue-200',
};

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

export function Toast({ 
  type, 
  title, 
  message, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}: ToastProps) {
  const Icon = toastIcons[type];

  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose, duration]);

  return (
    <div className={cn(
      'flex items-start space-x-3 p-4 border rounded-lg shadow-sm animate-fade-in',
      toastStyles[type]
    )}>
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        {message && (
          <p className="text-sm opacity-90 mt-1">{message}</p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
          aria-label="Cerrar notificación"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Container para múltiples toasts
interface ToastContainerProps {
  toasts: Array<ToastProps & { id: string }>;
  onRemoveToast: (id: string) => void;
}

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Hook para manejar toasts
export function useToast() {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { id: string }>>([]);

  const addToast = React.useCallback((toast: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
  };
}
