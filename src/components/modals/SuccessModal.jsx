import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import styles from '../../styles/Modal.module.css';

export default function SuccessModal({ isOpen, onClose, title, message }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        
        <div className={styles.modalIcon}>
          <div className={styles.successIconWrapper}>
            <CheckCircle size={48} className={styles.successIcon} />
          </div>
        </div>

        <div className={styles.modalBody}>
          <h2 className={styles.modalTitle}>{title || 'Success!'}</h2>
          <p className={styles.modalMessage}>
            {message || 'Your action was completed successfully.'}
          </p>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.primaryButton} onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
