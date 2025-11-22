import React from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';

export default function DeleteAppointmentModal({ appointment, petName, clinicName, onConfirm, onCancel, isLoading, error }) {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
      <div 
        style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '480px',
          width: '100%',
          padding: '32px',
          animation: 'slideUp 0.3s ease',
          position: 'relative',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: isLoading ? 0.5 : 0.6
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.opacity = '1';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.opacity = '0.6';
            }
          }}
        >
          <X size={20} color="#6b7280" />
        </button>

        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <style>
            {`
              @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
            `}
          </style>
          <Trash2 size={40} color="#dc2626" strokeWidth={2} />
        </div>

        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#1f2937',
          margin: '0 0 12px 0'
        }}>
          Delete Rejected Appointment
        </h3>
        
        <p style={{
          color: '#6b7280',
          lineHeight: '1.6',
          fontSize: '0.9375rem',
          margin: '0 0 28px 0',
          maxWidth: '380px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Are you sure you want to permanently delete this rejected appointment for <span style={{ fontWeight: '700', color: '#1f2937' }}>{petName}</span> at <span style={{ fontWeight: '700', color: '#1f2937' }}>{clinicName}</span>? This action cannot be undone.
        </p>
        
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '2px solid #f87171',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#dc2626',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '12px 32px',
              background: 'white',
              color: '#374151',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.8 : 1,
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }
            }}
          >
            {isLoading ? 'Deleting...' : 'Delete Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}
