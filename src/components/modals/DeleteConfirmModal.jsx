import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import styles from '../../styles/Modal.module.css';

export default function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDeleting = false
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        
        <div className={styles.modalIcon}>
          <div className={styles.warningIconWrapper}>
            <AlertTriangle size={48} className={styles.warningIcon} />
          </div>
        </div>

        <div className={styles.modalBody}>
          <h2 className={styles.modalTitle}>{title || 'Confirm Delete'}</h2>
          <p className={styles.modalMessage}>
            {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
          </p>
        </div>

        <div className={styles.modalActions}>
          <button 
            className={styles.secondaryButton} 
            onClick={onClose}
            disabled={isDeleting}
          >
            {cancelText}
          </button>
          <button 
            className={styles.dangerButton} 
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
