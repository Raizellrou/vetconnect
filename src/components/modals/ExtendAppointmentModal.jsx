import React, { useState } from 'react';
import { X, Clock, Save, AlertCircle } from 'lucide-react';
import { extendAppointment } from '../../firebase/firestoreHelpers';
import LoadingSpinner from '../LoadingSpinner';
import Toast from '../Toast';
import styles from '../../styles/Modal.module.css';

export default function ExtendAppointmentModal({ isOpen, onClose, appointment }) {
  const [newEndTime, setNewEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const handleSubmit = async () => {
    setError('');

    if (!newEndTime) {
      setError('Please select a new end time');
      return;
    }

    // Validate that new end time is after original end time
    const [originalEndHour, originalEndMin] = appointment.endTime.split(':').map(Number);
    const [newEndHour, newEndMin] = newEndTime.split(':').map(Number);
    
    if (newEndHour < originalEndHour || (newEndHour === originalEndHour && newEndMin <= originalEndMin)) {
      setError('New end time must be after the original end time');
      return;
    }

    // Validate that new end time is after start time
    const [startHour, startMin] = appointment.startTime.split(':').map(Number);
    
    if (newEndHour < startHour || (newEndHour === startHour && newEndMin <= startMin)) {
      setError('End time must be after start time');
      return;
    }

    setSubmitting(true);

    try {
      await extendAppointment(appointment.id, newEndTime);
      
      setToast({
        message: 'Appointment extended successfully!',
        type: 'success'
      });

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error extending appointment:', err);
      setError(err.message || 'Failed to extend appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError('');
      setNewEndTime('');
      onClose();
    }
  };

  if (!isOpen || !appointment) return null;

  // Calculate suggested end times (in 30-minute intervals)
  const suggestedTimes = [];
  const [endHour, endMin] = appointment.endTime.split(':').map(Number);
  
  for (let i = 1; i <= 4; i++) {
    const totalMinutes = endHour * 60 + endMin + (i * 30);
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    
    if (hour < 24) {
      suggestedTimes.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }

  return (
    <div 
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          handleClose();
        }
      }}
    >
      <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>
              Extend Appointment
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              {appointment.petName}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            style={{
              padding: '8px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} color="#374151" />
          </button>
        </div>

        {/* Current Appointment Info */}
        <div style={{
          padding: '16px',
          background: '#eef2ff',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <p style={{ fontSize: '0.875rem', color: '#4338ca', margin: '0 0 8px 0' }}>
            <strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#4338ca', margin: '0 0 8px 0' }}>
            <strong>Current Time:</strong> {appointment.startTime} - {appointment.endTime}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#4338ca', margin: 0 }}>
            <strong>Duration:</strong> {(() => {
              const [startH, startM] = appointment.startTime.split(':').map(Number);
              const [endH, endM] = appointment.endTime.split(':').map(Number);
              const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
              const hours = Math.floor(totalMinutes / 60);
              const mins = totalMinutes % 60;
              return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            })()}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#fee2e2',
            border: '1px solid #f87171',
            borderRadius: '8px',
            color: '#991b1b',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* New End Time Selection */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Clock size={24} color="#818cf8" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
              Select New End Time
            </h3>
          </div>

          {/* Quick Select Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {suggestedTimes.map(time => (
              <button
                key={time}
                onClick={() => setNewEndTime(time)}
                disabled={submitting}
                style={{
                  padding: '12px',
                  border: newEndTime === time ? '2px solid #818cf8' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  background: newEndTime === time ? '#eef2ff' : 'white',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  transition: 'all 0.2s'
                }}
              >
                {time}
              </button>
            ))}
          </div>

          {/* Custom Time Input */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Or select custom time:
            </label>
            <input
              type="time"
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.5 : 1
              }}
            />
          </div>

          {/* Duration Preview */}
          {newEndTime && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#166534', margin: 0 }}>
                <strong>New Duration:</strong> {(() => {
                  const [startH, startM] = appointment.startTime.split(':').map(Number);
                  const [newEndH, newEndM] = newEndTime.split(':').map(Number);
                  const totalMinutes = (newEndH * 60 + newEndM) - (startH * 60 + startM);
                  const hours = Math.floor(totalMinutes / 60);
                  const mins = totalMinutes % 60;
                  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                })()}
                {' '}({appointment.startTime} - {newEndTime})
              </p>
            </div>
          )}
        </div>

        {/* Warning */}
        <div style={{
          padding: '12px 16px',
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.875rem', color: '#78350f', margin: 0, lineHeight: '1.5' }}>
            The system will check if the extended time conflicts with other appointments before saving.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          paddingTop: '20px',
          borderTop: '2px solid #e5e7eb'
        }}>
          <button
            onClick={handleClose}
            disabled={submitting}
            style={{
              padding: '12px 24px',
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#374151',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.5 : 1
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting || !newEndTime}
            style={{
              padding: '12px 32px',
              background: (submitting || !newEndTime) ? '#9ca3af' : 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontWeight: 700,
              cursor: (submitting || !newEndTime) ? 'not-allowed' : 'pointer',
              boxShadow: (submitting || !newEndTime) ? 'none' : '0 4px 12px rgba(129, 140, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {submitting ? (
              <>
                <LoadingSpinner size="small" />
                Extending...
              </>
            ) : (
              <>
                <Save size={18} />
                Extend Appointment
              </>
            )}
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
