import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      border: '#10b981',
      iconColor: '#10b981',
      textColor: '#065f46',
      titleColor: '#047857'
    },
    error: {
      icon: XCircle,
      gradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      border: '#ef4444',
      iconColor: '#ef4444',
      textColor: '#991b1b',
      titleColor: '#dc2626'
    },
    warning: {
      icon: AlertCircle,
      gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: '#f59e0b',
      iconColor: '#f59e0b',
      textColor: '#92400e',
      titleColor: '#d97706'
    },
    info: {
      icon: Info,
      gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      border: '#3b82f6',
      iconColor: '#3b82f6',
      textColor: '#1e40af',
      titleColor: '#2563eb'
    }
  };

  const currentConfig = config[type] || config.info;
  const IconComponent = currentConfig.icon;

  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information'
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 10001,
        minWidth: '320px',
        maxWidth: '480px',
        background: currentConfig.gradient,
        border: `2px solid ${currentConfig.border}`,
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        animation: 'slideInRight 0.3s ease-out',
        backdropFilter: 'blur(8px)'
      }}
    >
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOutRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}
      </style>

      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <IconComponent size={24} color={currentConfig.iconColor} strokeWidth={2.5} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h4
          style={{
            margin: '0 0 6px 0',
            fontSize: '1rem',
            fontWeight: 700,
            color: currentConfig.titleColor,
            letterSpacing: '0.01em'
          }}
        >
          {titles[type]}
        </h4>
        <p
          style={{
            margin: 0,
            fontSize: '0.9375rem',
            color: currentConfig.textColor,
            lineHeight: 1.5,
            fontWeight: 500
          }}
        >
          {message}
        </p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          style={{
            padding: '6px',
            background: 'rgba(255, 255, 255, 0.4)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <X size={18} color={currentConfig.iconColor} />
        </button>
      )}
    </div>
  );
};

export default Toast;
