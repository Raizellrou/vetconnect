import React from 'react';
import styles from '../styles/UnsaveDialog.module.css';

export default function UnsaveDialog({ clinic, onConfirm, onCancel, isLoading, error }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h3 className={styles.title}>Unsave Clinic</h3>
        <p className={styles.message}>
          Are you sure you want to remove {clinic.name} from your saved clinics?
        </p>
        {error && <p className={styles.error}>{error}</p>}
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
            {isLoading ? 'Unsaving...' : 'Unsave'}
          </button>
        </div>
      </div>
    </div>
  );
}