import React from 'react';
import { AlertCircle, BookmarkX } from 'lucide-react';
import styles from '../styles/UnsaveDialog.module.css';

export default function UnsaveDialog({ clinic, onConfirm, onCancel, isLoading, error }) {
  return (
    <div className={styles.overlay} onClick={!isLoading ? onCancel : undefined}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {/* Icon Header */}
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <BookmarkX size={32} color="#f59e0b" />
        </div>

        <h2 className={styles.title}>Remove from Saved?</h2>
        <p className={styles.message}>
          Are you sure you want to remove <strong>{clinic.clinicName || clinic.name}</strong> from your saved clinics?
        </p>
        
        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        
        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.cancel}`}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={`${styles.button} ${styles.confirm}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}