import React, { useEffect, useCallback } from 'react';
import './toast.css';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number; // Duration in milliseconds
  position?: 'top-right' | 'top-left' | 'top-center';
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 3000,
  position = 'top-left' // Default to top-left
}) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, handleClose, duration]);

  if (!isVisible) return null;

  // Get background color and icon based on type
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return { bgColor: 'bg-green-500', icon: '✅', borderColor: 'border-green-600' };
      case 'error':
        return { bgColor: 'bg-red-500', icon: '❌', borderColor: 'border-red-600' };
      case 'warning':
        return { bgColor: 'bg-yellow-500', icon: '⚠️', borderColor: 'border-yellow-600' };
      case 'info':
        return { bgColor: 'bg-blue-500', icon: 'ℹ️', borderColor: 'border-blue-600' };
      default:
        return { bgColor: 'bg-gray-500', icon: '💬', borderColor: 'border-gray-600' };
    }
  };

  const { bgColor, icon, borderColor } = getToastStyles();

  // Get position-specific CSS class
  const getPositionClass = () => {
    switch (position) {
      case 'top-left':
        return 'toast-top-left';
      case 'top-center':
        return 'toast-top-center';
      case 'top-right':
        return 'toast-top-right';
      default:
        return 'toast-top-left';
    }
  };

  return (
    <div 
      className={`
        toast-fixed ${getPositionClass()}
        ${bgColor} ${borderColor}
        text-white px-6 py-4 rounded-lg 
        shadow-2xl 
        flex items-center gap-3 
        min-w-[320px] max-w-[480px]
        border-2
        animate-slideInFromTop
      `}
      style={{
        // CRITICAL: Ensure it's positioned relative to viewport, not page
        position: 'fixed',
        // Maximum z-index to stay above everything
        zIndex: 999999,
        // Position at the very top of the screen (viewport)
        top: '0',
        // Add backdrop blur for better visibility
        backdropFilter: 'blur(8px)',
        // Ensure it's always on top of everything
        isolation: 'isolate',
      }}
    >
      <span className="text-xl flex-shrink-0">{icon}</span>
      <span className="font-medium flex-1 text-sm leading-relaxed">{message}</span>
      <button 
        onClick={handleClose}
        className="ml-2 text-white hover:text-gray-200 text-xl font-bold flex-shrink-0
                   hover:bg-white/20 rounded-full w-6 h-6 flex items-center justify-center
                   transition-colors duration-200"
        aria-label="Close toast"
      >
        ×
      </button>
    </div>
  );
};
