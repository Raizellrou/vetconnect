import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Dog, MapPin, FileText, Star, Loader, AlertCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import styles from '../../styles/Modal.module.css';

export default function AppointmentDetailsModal({ isOpen, onClose, appointmentId }) {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointmentId || !isOpen) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch appointment
        const appointmentRef = doc(db, 'appointments', appointmentId);
        const appointmentSnap = await getDoc(appointmentRef);

        if (!appointmentSnap.exists()) {
          setError('Appointment not found');
          setLoading(false);
          return;
        }

        const aptData = { id: appointmentSnap.id, ...appointmentSnap.data() };

        // Fetch clinic details
        let clinicName = 'Unknown Clinic';
        if (aptData.clinicId) {
          try {
            const clinicRef = doc(db, 'clinics', aptData.clinicId);
            const clinicSnap = await getDoc(clinicRef);
            if (clinicSnap.exists()) {
              clinicName = clinicSnap.data().clinicName || clinicSnap.data().name || 'Unknown Clinic';
            }
          } catch (err) {
            console.warn('Failed to fetch clinic details:', err);
          }
        }

        // Fetch pet details
        let petName = 'Unknown Pet';
        if (aptData.petId && aptData.ownerId) {
          try {
            const petRef = doc(db, 'users', aptData.ownerId, 'pets', aptData.petId);
            const petSnap = await getDoc(petRef);
            if (petSnap.exists()) {
              petName = petSnap.data().name || 'Unknown Pet';
            }
          } catch (err) {
            console.warn('Failed to fetch pet details:', err);
          }
        }

        // Format date and time
        const formatDate = (dateStr) => {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        };

        const formatTime = (timeStr) => {
          if (!timeStr) return '';
          const [hour, minute] = timeStr.split(':').map(Number);
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
          return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
        };

        const timeDisplay = aptData.startTime && aptData.endTime
          ? `${formatTime(aptData.startTime)} - ${formatTime(aptData.endTime)}`
          : aptData.time || 'Time not specified';

        setAppointment({
          ...aptData,
          clinicName,
          petName,
          date: formatDate(aptData.date),
          time: timeDisplay,
          symptoms: aptData.reason || aptData.symptoms || 'No reason provided'
        });
      } catch (err) {
        console.error('Error fetching appointment details:', err);
        setError('Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [appointmentId, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <style>
        {`
          .appt-details-modal::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <div 
        className={styles.modalOverlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        <div className="appt-details-modal" style={{ 
          background: 'white',
          borderRadius: 'var(--vc-radius-xl, 16px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '700px', 
          width: '100%',
          maxHeight: '90vh', 
          overflow: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: 'var(--vc-space-8, 32px)'
        }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Appointment Details
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
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
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Loader size={40} className="animate-spin" style={{ margin: '0 auto 16px', color: '#818cf8' }} />
            <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>Loading appointment details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: '#fee2e2',
            borderRadius: '12px',
            border: '1px solid #f87171'
          }}>
            <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#991b1b', fontWeight: 600, fontSize: '1rem' }}>{error}</p>
          </div>
        )}

        {/* Appointment Details */}
        {appointment && !loading && !error && (
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Status Badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <div style={{
                display: 'inline-block',
                padding: '8px 20px',
                background: appointment.status === 'pending' ? '#fef3c7' :
                           appointment.status === 'approved' ? '#dbeafe' :
                           appointment.status === 'confirmed' ? '#d1fae5' :
                           appointment.status === 'completed' ? '#e0e7ff' : '#fee2e2',
                color: appointment.status === 'pending' ? '#92400e' :
                       appointment.status === 'approved' ? '#1e40af' :
                       appointment.status === 'confirmed' ? '#065f46' :
                       appointment.status === 'completed' ? '#4338ca' : '#991b1b',
                borderRadius: '24px',
                fontSize: '0.875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {appointment.status}
              </div>
            </div>

            {/* Clinic */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
              borderRadius: '12px',
              border: '1px solid #c7d2fe'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <MapPin size={20} color="#4f46e5" />
                <p style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#4338ca',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  margin: 0
                }}>
                  Clinic
                </p>
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                {appointment.clinicName}
              </p>
            </div>

            {/* Pet */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
              borderRadius: '12px',
              border: '1px solid #f9a8d4'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <Dog size={20} color="#db2777" />
                <p style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#be185d',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  margin: 0
                }}>
                  Pet
                </p>
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                {appointment.petName}
              </p>
            </div>

            {/* Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                borderRadius: '12px',
                border: '1px solid #6ee7b7'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Calendar size={18} color="#059669" />
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#047857',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    margin: 0
                  }}>
                    Date
                  </p>
                </div>
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  {appointment.date}
                </p>
              </div>

              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '12px',
                border: '1px solid #fcd34d'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Clock size={18} color="#d97706" />
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#b45309',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    margin: 0
                  }}>
                    Time
                  </p>
                </div>
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  {appointment.time}
                </p>
              </div>
            </div>

            {/* Reason */}
            {appointment.symptoms && (
              <div style={{
                padding: '20px',
                background: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <FileText size={20} color="#6b7280" />
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    margin: 0
                  }}>
                    Reason for Visit
                  </p>
                </div>
                <p style={{ fontSize: '0.9375rem', color: '#1f2937', lineHeight: '1.6', margin: 0 }}>
                  {appointment.symptoms}
                </p>
              </div>
            )}

            {/* Service */}
            {appointment.service && (
              <div style={{
                padding: '16px',
                background: '#f0fdf4',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#15803d',
                  margin: 0
                }}>
                  Service: {appointment.service}
                </p>
              </div>
            )}

            {/* Notes */}
            {appointment.notes && (
              <div style={{
                padding: '16px',
                background: '#fef9c3',
                borderRadius: '12px',
                border: '1px solid #fde047'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#854d0e',
                  margin: 0
                }}>
                  Notes: {appointment.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
