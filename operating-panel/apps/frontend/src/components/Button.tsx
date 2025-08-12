import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
  isMobile?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  type = 'button',
  style = {},
  isMobile = false
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        };
      case 'secondary':
        return {
          background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
        };
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        };
      case 'info':
        return {
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'small':
        return {
          padding: isMobile ? '8px 12px' : '10px 16px',
          fontSize: isMobile ? '12px' : '14px',
          fontWeight: 500,
          borderRadius: '8px'
        };
      case 'medium':
        return {
          padding: isMobile ? '10px 16px' : '12px 20px',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 600,
          borderRadius: '10px'
        };
      case 'large':
        return {
          padding: isMobile ? '12px 20px' : '16px 24px',
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: 600,
          borderRadius: '12px'
        };
      default:
        return {
          padding: isMobile ? '10px 16px' : '12px 20px',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 600,
          borderRadius: '10px'
        };
    }
  };

  const baseStyles: React.CSSProperties = {
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    letterSpacing: '0.025em',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style
  };

  if (disabled) {
    baseStyles.opacity = 0.5;
    baseStyles.boxShadow = 'none';
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = getVariantStyles().boxShadow as string;
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {children}
    </button>
  );
}; 