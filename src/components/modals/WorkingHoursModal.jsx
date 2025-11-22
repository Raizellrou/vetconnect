import React, { useState, useEffect } from 'react';
import { X, Clock, Save, AlertCircle, Check } from 'lucide-react';
import { fetchWorkingHours, updateWorkingHours } from '../../firebase/firestoreHelpers';
import LoadingSpinner from '../LoadingSpinner';
import Toast from '../Toast';
import styles from '../../styles/Modal.module.css';

export default function WorkingHoursModal({ isOpen, onClose, clinicId, clinicName }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  // Fetch current working hours
  useEffect(() => {
    const loadWorkingHours = async () => {
      if (!clinicId || !isOpen) return;
      
      setLoading(true);
      try {
        const hours = await fetchWorkingHours(clinicId);
        setStartTime(hours.start);
        setEndTime(hours.end);
      } catch (err) {
        console.error('Error fetching working hours:', err);
        setError('Failed to load current working hours');
      } finally {
        setLoading(false);
      }
    };

    loadWorkingHours();
  }, [clinicId, isOpen]);

  const handleSubmit = async () => {
    setError('');

    // Validate times
    if (!startTime || !endTime) {
      setError('Please select both start and end times');
      return;
    }

    // Parse times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    // Validate that end time is after start time
    if (endHour < startHour || (endHour === startHour && endMin <= startMin)) {
      setError('End time must be after start time');
      return;
    }

    // Validate reasonable working hours (at least 1 hour, max 16 hours)
    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (totalMinutes < 60) {
      setError('Working hours must be at least 1 hour');
      return;
    }
    if (totalMinutes > 960) {
      setError('Working hours cannot exceed 16 hours per day');
      return;
    }

    setSubmitting(true);

    try {
      await updateWorkingHours(clinicId, startTime, endTime);
      
      setToast({
        message: 'Working hours updated successfully!',
        type: 'success'
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating working hours:', err);
      setError(err.message || 'Failed to update working hours');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

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
              Set Working Hours
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              {clinicName}
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

        {/* Loading State */}
        {loading && (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <LoadingSpinner size="medium" message="Loading working hours..." />
          </div>
        )}

        {/* Form */}
        {!loading && (
          <>
            {/* Info Message */}
            <div style={{
              padding: '12px 16px',
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <AlertCircle size={20} color="#4338ca" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#4338ca', margin: '0 0 4px 0', fontWeight: 600 }}>
                  How it works:
                </p>
                <p style={{ fontSize: '0.875rem', color: '#4338ca', margin: 0, lineHeight: '1.5' }}>
                  Set your clinic's operating hours. This will determine the available time slots for appointments. 
                  Appointments are scheduled in 1-hour intervals.
                </p>
              </div>
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

            {/* Time Inputs */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Clock size={24} color="#818cf8" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                  Operating Hours
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Start Time */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Opening Time <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
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

                {/* End Time */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Closing Time <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
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
              </div>

              {/* Preview */}
              {startTime && endTime && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Check size={18} color="#16a34a" />
                  <p style={{ fontSize: '0.875rem', color: '#166534', margin: 0 }}>
                    <strong>Hours:</strong> {startTime} - {endTime}
                  </p>
                </div>
              )}
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
                disabled={submitting}
                style={{
                  padding: '12px 32px',
                  background: submitting ? '#9ca3af' : 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : '0 4px 12px rgba(129, 140, 248, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="small" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Hours
                  </>
                )}
              </button>
            </div>
          </>
        )}

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
