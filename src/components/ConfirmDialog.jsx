import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger' // 'danger', 'warning', 'info'
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconColor: '#ef4444',
      confirmBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      confirmHoverBg: '#dc2626'
    },
    warning: {
      iconColor: '#f59e0b',
      confirmBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      confirmHoverBg: '#d97706'
    },
    info: {
      iconColor: '#3b82f6',
      confirmBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      confirmHoverBg: '#2563eb'
    }
  };

  const style = variantStyles[variant] || variantStyles.danger;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '400px',
          width: '100%',
          padding: '24px',
          position: 'relative',
          animation: 'slideUp 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '8px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
        >
          <X size={18} color="#6b7280" />
        </button>

        {/* Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: `${style.iconColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          <AlertCircle size={32} color={style.iconColor} />
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: '12px',
            textAlign: 'center'
          }}
        >
          {title}
        </h3>

        {/* Message */}
        <p
          style={{
            fontSize: '0.9375rem',
            color: '#6b7280',
            lineHeight: '1.6',
            marginBottom: '24px',
            textAlign: 'center'
          }}
        >
          {message}
        </p>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px'
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: style.confirmBg,
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: `0 4px 12px ${style.iconColor}40`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 16px ${style.iconColor}50`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${style.iconColor}40`;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
