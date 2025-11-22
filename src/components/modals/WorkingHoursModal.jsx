import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle, Check, Info } from 'lucide-react';
import { fetchWorkingHours, updateWorkingHours } from '../../firebase/firestoreHelpers';
import LoadingSpinner from '../LoadingSpinner';
import Toast from '../Toast';
import Modal from '../Modal';
import '../../styles/designSystem.css';

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

  const modalFooter = !loading && (
    <div style={{ display: 'flex', gap: 'var(--vc-space-3)', justifyContent: 'flex-end' }}>
      <button
        onClick={handleClose}
        disabled={submitting}
        className="vc-btn-secondary"
        style={{ minWidth: '100px' }}
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="vc-btn-primary"
        style={{ minWidth: '140px' }}
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
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Set Working Hours"
      footer={modalFooter}
      closeOnBackdrop={!submitting}
      maxWidth="600px"
    >
      <div style={{ marginBottom: 'var(--vc-space-4)' }}>
        <p style={{ fontSize: 'var(--vc-text-sm)', color: 'var(--vc-text-muted)', margin: 0 }}>
          {clinicName}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ padding: 'var(--vc-space-10)', textAlign: 'center' }}>
          <LoadingSpinner size="medium" message="Loading working hours..." />
        </div>
      )}

      {/* Form */}
      {!loading && (
        <>
          {/* Info Message */}
          <div style={{
            padding: 'var(--vc-space-4)',
            background: 'var(--vc-primary-bg)',
            border: `1px solid var(--vc-primary-light)`,
            borderRadius: 'var(--vc-radius-md)',
            marginBottom: 'var(--vc-space-6)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--vc-space-3)'
          }}>
            <Info size={20} color="var(--vc-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: 'var(--vc-text-sm)', color: 'var(--vc-primary)', margin: '0 0 4px 0', fontWeight: 600 }}>
                How it works:
              </p>
              <p style={{ fontSize: 'var(--vc-text-sm)', color: 'var(--vc-primary)', margin: 0, lineHeight: 1.5 }}>
                Set your clinic's operating hours. This will determine the available time slots for appointments. 
                Appointments are scheduled in 1-hour intervals.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: 'var(--vc-space-3) var(--vc-space-4)',
              background: 'var(--vc-error-bg)',
              border: `1px solid var(--vc-error-light)`,
              borderRadius: 'var(--vc-radius-md)',
              color: 'var(--vc-error)',
              marginBottom: 'var(--vc-space-5)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--vc-space-2)',
              fontSize: 'var(--vc-text-sm)',
              fontWeight: 600
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Time Inputs */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--vc-space-3)', marginBottom: 'var(--vc-space-5)' }}>
              <Clock size={24} color="var(--vc-primary)" />
              <h3 style={{ fontSize: 'var(--vc-text-lg)', fontWeight: 600, margin: 0, color: 'var(--vc-text-primary)' }}>
                Operating Hours
              </h3>
            </div>

            <div className="vc-grid vc-grid-2" style={{ marginBottom: 'var(--vc-space-4)' }}>
              {/* Start Time */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--vc-text-sm)',
                  fontWeight: 600,
                  color: 'var(--vc-text-secondary)',
                  marginBottom: 'var(--vc-space-2)'
                }}>
                  Opening Time <span style={{ color: 'var(--vc-error)' }}>*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={submitting}
                  className="vc-input"
                  aria-label="Opening time"
                  style={{
                    fontSize: 'var(--vc-text-base)',
                    cursor: submitting ? 'not-allowed' : 'text'
                  }}
                />
              </div>

              {/* End Time */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 'var(--vc-text-sm)',
                  fontWeight: 600,
                  color: 'var(--vc-text-secondary)',
                  marginBottom: 'var(--vc-space-2)'
                }}>
                  Closing Time <span style={{ color: 'var(--vc-error)' }}>*</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={submitting}
                  className="vc-input"
                  aria-label="Closing time"
                  style={{
                    fontSize: 'var(--vc-text-base)',
                    cursor: submitting ? 'not-allowed' : 'text'
                  }}
                />
              </div>
            </div>

            {/* Preview */}
            {startTime && endTime && (
              <div className="vc-badge vc-badge-success" style={{
                padding: 'var(--vc-space-3) var(--vc-space-4)',
                fontSize: 'var(--vc-text-sm)',
                display: 'inline-flex',
                borderRadius: 'var(--vc-radius-md)',
                width: 'auto'
              }}>
                <Check size={18} />
                <span><strong>Hours:</strong> {startTime} - {endTime}</span>
              </div>
            )}
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
    </Modal>
  );
}
