import React from 'react';
import styles from './Modal.module.css';

/**
 * Global reusable Modal component
 * Provides consistent modal styling across the entire app
 * - Centered white card with subtle shadow
 * - Rounded corners (8px)
 * - Smooth fade + scale animations
 * - Overlay backdrop
 * - Close on backdrop click (optional)
 */
export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  closeOnBackdrop = true,
  maxWidth = '500px'
}) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal} style={{ maxWidth }}>
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button 
              className={styles.closeButton} 
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        
        <div className={styles.content}>
          {children}
        </div>
        
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
