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
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes scaleIn {
            from {
              transform: scale(0.9);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
      
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Toast Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            maxWidth: '420px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '6px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={18} color="#64748b" />
            </button>
          )}

          {/* Icon Container */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: currentConfig.gradient,
              border: `3px solid ${currentConfig.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: `0 8px 24px ${currentConfig.border}40`
            }}
          >
            <IconComponent size={36} color={currentConfig.iconColor} strokeWidth={2.5} />
          </div>

          {/* Title */}
          <h3
            style={{
              margin: '0 0 12px 0',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1e293b',
              letterSpacing: '-0.01em'
            }}
          >
            {titles[type]}
          </h3>

          {/* Message */}
          <p
            style={{
              margin: 0,
              fontSize: '0.9375rem',
              color: '#64748b',
              lineHeight: 1.6,
              fontWeight: 500
            }}
          >
            {message}
          </p>
        </div>
      </div>
    </>
  );
};

export default Toast;
