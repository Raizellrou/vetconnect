import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle, Check, Info, X } from 'lucide-react';
import { fetchWorkingHours, updateWorkingHours } from '../../firebase/firestoreHelpers';
import LoadingSpinner from '../LoadingSpinner';
import Toast from '../Toast';

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
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .working-hours-content::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease'
        }}
        onClick={!submitting ? handleClose : undefined}
      >
        <div 
          style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px 28px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}>
                <Clock size={22} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: 0,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  Manage Working Hours
                </h2>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '0.875rem', 
                  opacity: 0.9 
                }}>
                  {clinicName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={submitting}
              style={{
                width: '36px',
                height: '36px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                color: 'white',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: submitting ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }
              }}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div 
            className="working-hours-content"
            style={{
              padding: '28px',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              flex: 1
            }}
          >

            {/* Loading State */}
            {loading && (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <LoadingSpinner size="medium" message="Loading working hours..." />
              </div>
            )}

            {/* Form */}
            {!loading && (
              <>
                {/* Info Message */}
                <div style={{
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  border: '2px solid #bfdbfe',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Info size={20} color="white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p style={{ 
                      fontSize: '0.9375rem', 
                      color: '#1e40af', 
                      margin: '0 0 6px 0', 
                      fontWeight: 600 
                    }}>
                      How it works:
                    </p>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#1e40af', 
                      margin: 0, 
                      lineHeight: 1.6 
                    }}>
                      Set your clinic's operating hours. This will determine the available time slots for appointments. 
                      Appointments are scheduled in 1-hour intervals.
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div style={{
                    padding: '16px 20px',
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    border: '2px solid #fca5a5',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <AlertCircle size={20} color="white" strokeWidth={2.5} />
                    </div>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: '#991b1b', 
                      margin: '10px 0 0 0',
                      fontWeight: 500,
                      lineHeight: 1.6
                    }}>
                      {error}
                    </p>
                  </div>
                )}

                {/* Time Inputs */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '20px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Clock size={18} color="white" strokeWidth={2.5} />
                    </div>
                    <h3 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 700, 
                      margin: 0, 
                      color: '#1f2937' 
                    }}>
                      Operating Hours
                    </h3>
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '20px', 
                    marginBottom: '20px' 
                  }}>
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
                          aria-label="Opening time"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '0.9375rem',
                            fontWeight: 500,
                            color: '#1f2937',
                            background: 'white',
                            border: '2px solid #d1d5db',
                            borderRadius: '10px',
                            transition: 'all 0.2s ease',
                            cursor: submitting ? 'not-allowed' : 'text',
                            opacity: submitting ? 0.6 : 1
                          }}
                          onFocus={(e) => {
                            if (!submitting) {
                              e.currentTarget.style.borderColor = '#667eea';
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                            }
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.boxShadow = 'none';
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
                          aria-label="Closing time"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '0.9375rem',
                            fontWeight: 500,
                            color: '#1f2937',
                            background: 'white',
                            border: '2px solid #d1d5db',
                            borderRadius: '10px',
                            transition: 'all 0.2s ease',
                            cursor: submitting ? 'not-allowed' : 'text',
                            opacity: submitting ? 0.6 : 1
                          }}
                          onFocus={(e) => {
                            if (!submitting) {
                              e.currentTarget.style.borderColor = '#667eea';
                              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                            }
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    {startTime && endTime && (
                      <div style={{
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                        border: '2px solid #6ee7b7',
                        borderRadius: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#065f46'
                      }}>
                        <Check size={18} strokeWidth={2.5} />
                        <span><strong>Hours:</strong> {startTime} - {endTime}</span>
                      </div>
                    )}
                  </div>
              </>
            )}
          </div>

          {/* Footer with Buttons */}
          {!loading && (
            <div style={{
              padding: '20px 28px',
              background: '#f9fafb',
              borderTop: '2px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleClose}
                disabled={submitting}
                style={{
                  padding: '12px 24px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#374151',
                  background: 'white',
                  border: '2px solid #d1d5db',
                  borderRadius: '10px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: submitting ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '12px 28px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'white',
                  background: submitting 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: submitting ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }
                }}
              >
                <Save size={18} strokeWidth={2.5} />
                {submitting ? 'Saving...' : 'Save Hours'}
              </button>
            </div>
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .working-hours-content::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
