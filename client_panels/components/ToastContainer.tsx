import React, { useState, useCallback, useEffect } from 'react';
import { Toast } from './Toast';
import './toast.css';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'top-center';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemoveToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  // Group toasts by position to stack them properly
  const groupedToasts = toasts.reduce((acc, toast) => {
    const position = toast.position || 'top-left'; // Default to top-left
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(toast);
    return acc;
  }, {} as Record<string, ToastMessage[]>);

  return (
    <>
      {/* Render toasts for each position */}
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div key={position} className="toast-container">
          <div className={`relative ${position === 'top-center' ? 'flex justify-center' : ''}`}>
            {positionToasts.map((toast, index) => (
              <div
                key={toast.id}
                className="pointer-events-auto toast-stack"
                style={{
                  zIndex: 999999 + index, // Ensure proper layering
                }}
              >
                <Toast
                  message={toast.message}
                  type={toast.type}
                  isVisible={true}
                  onClose={() => onRemoveToast(toast.id)}
                  duration={toast.duration}
                  position={toast.position as any}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((
    message: string, 
    type: ToastMessage['type'] = 'info',
    options: { duration?: number; position?: ToastMessage['position'] } = {}
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration: options.duration,
      position: options.position || 'top-left', // Default to top-left
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    if (options.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, options.duration || 3000);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message: string, options?: { duration?: number; position?: ToastMessage['position'] }) => {
    return addToast(message, 'success', options);
  }, [addToast]);

  const error = useCallback((message: string, options?: { duration?: number; position?: ToastMessage['position'] }) => {
    return addToast(message, 'error', options);
  }, [addToast]);

  const warning = useCallback((message: string, options?: { duration?: number; position?: ToastMessage['position'] }) => {
    return addToast(message, 'warning', options);
  }, [addToast]);

  const info = useCallback((message: string, options?: { duration?: number; position?: ToastMessage['position'] }) => {
    return addToast(message, 'info', options);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };
};
