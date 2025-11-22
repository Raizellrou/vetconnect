import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Dog, AlertCircle, Check, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  fetchWorkingHours, 
  generateTimeSlots, 
  checkSlotAvailability, 
  bookAppointmentWithTimeSlot 
} from '../../firebase/firestoreHelpers';
import { collection, getDocs, query as firestoreQuery, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import LoadingSpinner from '../LoadingSpinner';
import Toast from '../Toast';
import styles from '../../styles/Modal.module.css';

export default function BookAppointmentWithTimeSlot({ isOpen, onClose, clinicId, clinicName }) {
  const { currentUser } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Select Pet & Date, 2: Select Time Slot, 3: Confirmation
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  
  // Form data
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [service, setService] = useState('');
  const [notes, setNotes] = useState('');
  
  // Time slot data
  const [workingHours, setWorkingHours] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [slotAvailability, setSlotAvailability] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!currentUser?.uid || !isOpen) return;
      
      setLoading(true);
      try {
        const petsRef = collection(db, 'users', currentUser.uid, 'pets');
        const petsSnapshot = await getDocs(petsRef);
        const petsData = petsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPets(petsData);
      } catch (err) {
        console.error('Error fetching pets:', err);
        setError('Failed to load your pets');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [currentUser, isOpen]);

  // Fetch working hours when clinic is selected
  useEffect(() => {
    const loadWorkingHours = async () => {
      if (!clinicId || !isOpen) return;
      
      try {
        const hours = await fetchWorkingHours(clinicId);
        setWorkingHours(hours);
      } catch (err) {
        console.error('Error fetching working hours:', err);
        setWorkingHours({ start: '08:00', end: '17:00' }); // Default
      }
    };

    loadWorkingHours();
  }, [clinicId, isOpen]);

  // Generate time slots when date is selected
  useEffect(() => {
    if (selectedDate && workingHours) {
      const slots = generateTimeSlots(workingHours, new Date(selectedDate));
      setTimeSlots(slots);
      checkAllSlotsAvailability(slots);
    }
  }, [selectedDate, workingHours]);

  // Check availability for all time slots
  const checkAllSlotsAvailability = async (slots) => {
    if (!clinicId || !selectedDate) return;
    
    setCheckingAvailability(true);
    const availability = {};
    
    try {
      console.log(`%c========================================`, 'color: blue; font-weight: bold');
      console.log(`%cChecking availability for ${slots.length} time slots on ${selectedDate}`, 'color: blue; font-weight: bold');
      console.log(`%cClinic ID: ${clinicId}`, 'color: blue');
      console.log(`%c========================================`, 'color: blue; font-weight: bold');
      
      for (const slot of slots) {
        const isAvailable = await checkSlotAvailability(
          clinicId,
          selectedDate,
          slot.startTime,
          slot.endTime
        );
        console.log(`%cSlot ${slot.startTime}-${slot.endTime}: ${isAvailable ? '✓ AVAILABLE' : '✗ BOOKED'}`, 
          isAvailable ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold');
        availability[`${slot.startTime}-${slot.endTime}`] = isAvailable;
      }
      
      console.log(`%c========================================`, 'color: blue; font-weight: bold');
      console.log('%cFinal availability summary:', 'color: blue; font-weight: bold');
      console.log('Available slots:', Object.entries(availability).filter(([k, v]) => v).map(([k]) => k));
      console.log('Booked slots:', Object.entries(availability).filter(([k, v]) => !v).map(([k]) => k));
      console.log(`%c========================================`, 'color: blue; font-weight: bold');
      
      setSlotAvailability(availability);
    } catch (err) {
      console.error('Error checking slot availability:', err);
      // Set all slots as available on error (fallback)
      const fallbackAvailability = {};
      slots.forEach(slot => {
        fallbackAvailability[`${slot.startTime}-${slot.endTime}`] = true;
      });
      setSlotAvailability(fallbackAvailability);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedPet) {
        setError('Please select a pet');
        return;
      }
      if (!selectedDate) {
        setError('Please select a date');
        return;
      }
      
      // Get today's date at midnight for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(selectedDate);
      
      if (selected < today) {
        setError('Please select a future date');
        return;
      }
      
      setError('');
      setStep(2);
    } else if (step === 2) {
      if (!selectedSlot) {
        setError('Please select a time slot');
        return;
      }
      setError('');
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!selectedPet || !selectedDate || !selectedSlot) {
      setError('Please complete all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await bookAppointmentWithTimeSlot({
        clinicId,
        ownerUid: currentUser.uid,
        petId: selectedPet.id,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason: reason.trim(),
        service: service.trim(),
        notes: notes.trim()
      });

      setToast({
        message: 'Appointment booked successfully! Waiting for clinic approval.',
        type: 'success'
      });

      // Reset form and close
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPet(null);
    setSelectedDate('');
    setSelectedSlot(null);
    setReason('');
    setService('');
    setNotes('');
    setError('');
    setTimeSlots([]);
    setSlotAvailability({});
    onClose();
  };

  if (!isOpen) return null;

  // Get minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  
  // Get maximum date (3 months from now)
  const maxDate = new Date(today.setMonth(today.getMonth() + 3)).toISOString().split('T')[0];

  return (
    <div 
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          handleClose();
        }
      }}
    >
      <div className={styles.modalContent} style={{ maxWidth: '680px', maxHeight: '92vh', overflow: 'auto', borderRadius: 'var(--vc-radius-xl, 16px)', padding: 'var(--vc-space-8, 32px)' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--vc-space-6, 24px)',
          paddingBottom: 'var(--vc-space-5, 20px)',
          borderBottom: '2px solid var(--vc-border-light, #e5e7eb)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>
              Book Appointment
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              {clinicName}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="vc-btn-icon"
            style={{
              padding: 'var(--vc-space-2, 8px)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.5 : 1
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Indicator */}
        <div style={{ display: 'flex', gap: 'var(--vc-space-3, 12px)', marginBottom: 'var(--vc-space-8, 32px)' }}>
          {[1, 2, 3].map(num => (
            <div
              key={num}
              style={{
                flex: 1,
                height: '8px',
                borderRadius: 'var(--vc-radius-full, 9999px)',
                background: num <= step 
                  ? 'linear-gradient(135deg, var(--vc-primary) 0%, var(--vc-primary-hover) 100%)' 
                  : 'var(--vc-border-light)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: num <= step ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none'
              }}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: 'var(--vc-space-3, 12px) var(--vc-space-4, 16px)',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid var(--vc-error-light)',
            borderRadius: 'var(--vc-radius-lg, 12px)',
            color: 'var(--vc-error)',
            marginBottom: 'var(--vc-space-5, 20px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--vc-space-2, 8px)',
            fontWeight: 600
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Step 1: Select Pet & Date */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--vc-space-5, 20px)', display: 'flex', alignItems: 'center', gap: 'var(--vc-space-2, 8px)', color: 'var(--vc-text-primary)' }}>
              <Dog size={22} color="var(--vc-primary)" />
              Select Pet & Date
            </h3>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <LoadingSpinner size="medium" message="Loading your pets..." />
              </div>
            ) : pets.length === 0 ? (
              <div style={{
                padding: '40px',
                background: '#fef3c7',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <AlertCircle size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: '#78350f', fontWeight: 600 }}>You don't have any pets registered yet.</p>
              </div>
            ) : (
              <>
                {/* Pet Selection */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                    Select Pet <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {pets.map(pet => (
                      <div
                        key={pet.id}
                        onClick={() => setSelectedPet(pet)}
                        style={{
                          padding: '16px',
                          border: selectedPet?.id === pet.id ? '2px solid #818cf8' : '2px solid #e5e7eb',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: selectedPet?.id === pet.id ? '#eef2ff' : 'white'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ fontWeight: 600, color: '#1e293b', margin: '0 0 4px 0' }}>
                              {pet.name}
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                              {pet.species} • {pet.breed || 'Mixed'}
                            </p>
                          </div>
                          {selectedPet?.id === pet.id && (
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: '#818cf8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Check size={16} color="white" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Appointment Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={minDate}
                    max={maxDate}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '6px' }}>
                    Select a date within the next 3 months
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Select Time Slot */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="#818cf8" />
              Select Time Slot
            </h3>

            <div style={{
              padding: '12px 16px',
              background: '#eef2ff',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#4338ca', margin: 0 }}>
                <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#4338ca', margin: '4px 0 0 0' }}>
                <strong>Working Hours:</strong> {workingHours?.start} - {workingHours?.end}
              </p>
            </div>

            {checkingAvailability ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <LoadingSpinner size="medium" message="Checking availability..." />
              </div>
            ) : (
              <>
                {/* Status Legend */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '16px',
                  padding: '12px 16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#10b981'
                    }} />
                    <span style={{ fontSize: '0.8125rem', color: '#374151', fontWeight: 600 }}>
                      Available
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#ef4444'
                    }} />
                    <span style={{ fontSize: '0.8125rem', color: '#374151', fontWeight: 600 }}>
                      Booked
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#818cf8'
                    }} />
                    <span style={{ fontSize: '0.8125rem', color: '#374151', fontWeight: 600 }}>
                      Selected
                    </span>
                  </div>
                </div>

                {/* Time Slots Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {timeSlots.map(slot => {
                    const slotKey = `${slot.startTime}-${slot.endTime}`;
                    const isAvailable = slotAvailability[slotKey] === true; // Explicit true check
                    const isSelected = selectedSlot?.startTime === slot.startTime;

                    return (
                      <button
                        key={slotKey}
                        onClick={() => isAvailable && setSelectedSlot(slot)}
                        disabled={!isAvailable}
                        style={{
                          padding: '14px',
                          border: isSelected 
                            ? '2px solid #818cf8' 
                            : isAvailable 
                              ? '2px solid #d1fae5' 
                              : '2px solid #fee2e2',
                          borderRadius: '12px',
                          cursor: isAvailable ? 'pointer' : 'not-allowed',
                          background: isSelected 
                            ? 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' 
                            : isAvailable 
                              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' 
                              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                          opacity: isAvailable ? 1 : 0.7,
                          transition: 'all 0.2s',
                          textAlign: 'left',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (isAvailable && !isSelected) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <Clock size={16} color={isSelected ? '#818cf8' : isAvailable ? '#10b981' : '#ef4444'} />
                              <p style={{ 
                                fontWeight: 700, 
                                color: isSelected ? '#4338ca' : '#1e293b', 
                                margin: 0,
                                fontSize: '0.875rem'
                              }}>
                                {slot.display}
                              </p>
                            </div>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              background: isSelected 
                                ? 'rgba(129, 140, 248, 0.15)'
                                : isAvailable 
                                  ? 'rgba(16, 185, 129, 0.15)' 
                                  : 'rgba(239, 68, 68, 0.15)',
                              border: isSelected
                                ? '1px solid rgba(129, 140, 248, 0.3)'
                                : isAvailable
                                  ? '1px solid rgba(16, 185, 129, 0.3)'
                                  : '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                              <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: isSelected ? '#818cf8' : isAvailable ? '#10b981' : '#ef4444'
                              }} />
                              <span style={{ 
                                fontSize: '0.6875rem', 
                                color: isSelected ? '#4338ca' : isAvailable ? '#047857' : '#991b1b', 
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.025em'
                              }}>
                                {isSelected ? 'Selected' : isAvailable ? 'Available' : 'Booked'}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(129, 140, 248, 0.4)',
                              flexShrink: 0
                            }}>
                              <Check size={16} color="white" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Summary Stats */}
                {timeSlots.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-around',
                    gap: '16px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', margin: '0 0 4px 0' }}>
                        {Object.values(slotAvailability).filter(Boolean).length}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, fontWeight: 600 }}>
                        Available
                      </p>
                    </div>
                    <div style={{ width: '1px', background: '#e5e7eb' }} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', margin: '0 0 4px 0' }}>
                        {Object.values(slotAvailability).filter(v => !v).length}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, fontWeight: 600 }}>
                        Booked
                      </p>
                    </div>
                    <div style={{ width: '1px', background: '#e5e7eb' }} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#374151', margin: '0 0 4px 0' }}>
                        {timeSlots.length}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, fontWeight: 600 }}>
                        Total Slots
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {timeSlots.length === 0 && !checkingAvailability && (
              <div style={{
                padding: '40px',
                background: '#fef3c7',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <AlertCircle size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: '#78350f', fontWeight: 600 }}>No time slots available for this date.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Additional Details */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>
              Appointment Details
            </h3>

            {/* Summary */}
            <div style={{
              padding: '16px',
              background: '#eef2ff',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#4338ca', margin: '0 0 8px 0' }}>
                <strong>Pet:</strong> {selectedPet?.name}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#4338ca', margin: '0 0 8px 0' }}>
                <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#4338ca', margin: 0 }}>
                <strong>Time:</strong> {selectedSlot?.display}
              </p>
            </div>

            {/* Optional Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Reason for Visit
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Annual checkup, Vaccination, Illness"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Service Needed
                </label>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="e.g., Consultation, Surgery, Grooming"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information the clinic should know..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 'var(--vc-space-3, 12px)',
          marginTop: 'var(--vc-space-8, 32px)',
          paddingTop: 'var(--vc-space-5, 20px)',
          borderTop: '2px solid var(--vc-border-light)'
        }}>
          {step > 1 && (
            <button
              onClick={handlePrevStep}
              disabled={submitting}
              className="vc-btn-secondary"
              style={{
                opacity: submitting ? 0.5 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNextStep}
              disabled={loading || checkingAvailability}
              className="vc-btn-primary"
              style={{
                marginLeft: 'auto',
                opacity: (loading || checkingAvailability) ? 0.5 : 1,
                cursor: (loading || checkingAvailability) ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="vc-btn-success"
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--vc-space-2, 8px)',
                opacity: submitting ? 0.5 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Booking...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          )}
        </div>
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
  );
}
