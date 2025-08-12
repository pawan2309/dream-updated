import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '24px',
      right: '24px',
      padding: '16px 20px',
      borderRadius: '12px',
      color: '#fff',
      fontWeight: '600',
      zIndex: 3000,
      minWidth: '320px',
      maxWidth: '400px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      animation: 'slideIn 0.3s ease-out',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    };

    switch (type) {
      case 'success':
        return { 
          ...baseStyles, 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
        };
      case 'error':
        return { 
          ...baseStyles, 
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
        };
      case 'info':
        return { 
          ...baseStyles, 
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
        };
      case 'warning':
        return { 
          ...baseStyles, 
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)'
        };
      default:
        return { 
          ...baseStyles, 
          background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          boxShadow: '0 10px 25px rgba(107, 114, 128, 0.3)'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      default:
        return '💬';
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%) translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%) translateY(-10px);
            opacity: 0;
          }
        }
      `}</style>
      <div style={getToastStyles()}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '12px',
            flex: '1'
          }}>
            <span style={{ 
              fontSize: '18px',
              lineHeight: '1.2'
            }}>
              {getIcon()}
            </span>
            <div style={{ flex: '1' }}>
              <div style={{ 
                fontSize: '14px',
                fontWeight: '600',
                lineHeight: '1.4',
                marginBottom: '2px'
              }}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </div>
              <div style={{ 
                fontSize: '13px',
                fontWeight: '500',
                opacity: '0.95',
                lineHeight: '1.4'
              }}>
                {message}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              lineHeight: '1',
              transition: 'all 0.2s ease',
              minWidth: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>
      </div>
    </>
  );
}; 