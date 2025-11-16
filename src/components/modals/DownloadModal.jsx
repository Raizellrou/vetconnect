import React from 'react';
import { Download, X } from 'lucide-react';
import styles from '../../styles/Modal.module.css';

export default function DownloadModal({ isOpen, onClose, fileName }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        
        <div className={styles.modalIcon}>
          <div className={styles.downloadIconWrapper}>
            <Download size={48} className={styles.downloadIcon} />
          </div>
        </div>

        <div className={styles.modalBody}>
          <h2 className={styles.modalTitle}>Download Started</h2>
          <p className={styles.modalMessage}>
            {fileName ? `"${fileName}" is being downloaded to your device.` : 'Your file is being downloaded to your device.'}
          </p>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.primaryButton} onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
