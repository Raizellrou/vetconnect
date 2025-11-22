import React, { useState } from 'react';
import { XCircle } from 'lucide-react';
import Modal from './Modal';

export default function CancelAppointmentDialog({ 
  appointment, 
  onConfirm, 
  onCancel, 
  isLoading, 
  title = "Cancel Appointment?", 
  message = `Are you sure you want to cancel your appointment at ${appointment.clinicName}?`, 
  confirmButtonText = "Cancel Appointment",
  children 
}) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm && onConfirm(reason);
  };

  return (
    <Modal isOpen={true} onClose={!isLoading ? onCancel : undefined}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
        }}>
          <XCircle size={28} color="#f59e0b" strokeWidth={2.5} />
        </div>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#1e293b',
          margin: '0 0 12px 0'
        }}>
          {title}
        </h2>
        <p style={{
          fontSize: '0.9375rem',
          color: '#64748b',
          margin: '0 0 24px 0',
          lineHeight: 1.6
        }}>
          {message}
        </p>
        
        {children}

        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            color: '#374151', 
            marginBottom: '8px' 
          }}>
            Reason for cancellation (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let the clinic know why you're cancelling..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid var(--vc-border)',
              borderRadius: 'var(--vc-radius-md)',
              fontSize: '0.9375rem',
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s'
            }}
            disabled={isLoading}
            onFocus={(e) => !isLoading && (e.target.style.borderColor = 'var(--vc-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--vc-border)')}
          />
        </div>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '12px 32px',
              background: 'white',
              color: '#64748b',
              border: '2px solid var(--vc-border)',
              borderRadius: 'var(--vc-radius-md)',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.borderColor = 'var(--vc-primary)')}
            onMouseLeave={(e) => !isLoading && (e.target.style.borderColor = 'var(--vc-border)')}
          >
            Keep Appointment
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              padding: '12px 32px',
              background: isLoading ? '#9ca3af' : '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--vc-radius-md)',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: isLoading ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.background = '#d97706')}
            onMouseLeave={(e) => !isLoading && (e.target.style.background = '#f59e0b')}
          >
            {isLoading ? 'Cancelling...' : confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
