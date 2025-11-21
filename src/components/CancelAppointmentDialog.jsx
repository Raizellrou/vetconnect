import React, { useState } from 'react';
import { AlertCircle, XCircle } from 'lucide-react';
import styles from '../styles/UnsaveDialog.module.css';

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
    <div className={styles.overlay} onClick={!isLoading ? onCancel : undefined}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <XCircle size={28} color="#f59e0b" strokeWidth={2.5} />
        </div>

        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>
          {message}
        </p>
        
        {children}

        <div style={{ marginTop: '16px', marginBottom: '20px' }}>
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
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem',
              resize: 'vertical'
            }}
            disabled={isLoading}
          />
        </div>
        
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.cancel}`}
            onClick={onCancel}
            disabled={isLoading}
          >
            Keep Appointment
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.confirm}`}
            onClick={handleConfirm}
            disabled={isLoading}
            style={{ background: '#f59e0b' }}
          >
            {isLoading ? 'Cancelling...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
