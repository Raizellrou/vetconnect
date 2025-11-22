import React from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../Modal';

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
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Delete Clinic?'}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--vc-space-4, 16px)',
        padding: 'var(--vc-space-2, 8px) 0'
      }}>
        {/* Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--vc-radius-lg, 12px)',
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Trash2 size={32} color="var(--vc-error, #ef4444)" />
        </div>

        {/* Message */}
        <p style={{
          fontSize: '0.9375rem',
          color: 'var(--vc-text-secondary, #64748b)',
          textAlign: 'center',
          lineHeight: 1.6,
          margin: 0,
          maxWidth: '400px'
        }}>
          {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
        </p>
      </div>

      {/* Footer with buttons */}
      <div slot="footer" style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 'var(--vc-space-3, 12px)',
        marginTop: 'var(--vc-space-6, 24px)'
      }}>
        <button 
          className="vc-btn-secondary"
          onClick={onClose}
          disabled={isDeleting}
        >
          {cancelText}
        </button>
        <button 
          className="vc-btn-danger"
          onClick={handleConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
