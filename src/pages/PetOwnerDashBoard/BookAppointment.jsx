import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, FileText, AlertCircle, CheckCircle, PawPrint, ArrowLeft, MapPin, X } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { bookAppointment } from '../../lib/firebaseMutations';
import { toTimestamp } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { sendNotification } from '../../firebase/firestoreHelpers';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import { formatShortDate, formatTime } from '../../utils/dateUtils';

export default function BookAppointment() {
  const navigate = useNavigate();
  const { clinicId } = useParams();
  const { currentUser, userData } = useAuth();
  
  const displayName = userData?.fullName || userData?.displayName || userData?.email;
  
  const [formData, setFormData] = useState({
    petId: '',
    date: '',
    time: '',
    service: '',
    reason: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [pets, setPets] = useState([]);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if no clinicId
    if (!clinicId) {
      navigate('/map', { replace: true });
      return;
    }

    const fetchData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setLoading(true);
        
        // Fetch clinic details
        const clinicRef = doc(db, 'clinics', clinicId);
        const clinicSnap = await getDoc(clinicRef);
        
        if (clinicSnap.exists()) {
          setClinic({ id: clinicSnap.id, ...clinicSnap.data() });
        } else {
          setSubmitError('Clinic not found. Please select a valid clinic.');
          return;
        }

        // Fetch user's pets
        const petsQuery = query(
          collection(db, 'users', currentUser.uid, 'pets')
        );
        const petsSnapshot = await getDocs(petsQuery);
        const petsData = petsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setPets(petsData);
        
        console.log('Fetched pets:', petsData);
        console.log('Fetched clinic:', clinicSnap.data());
      } catch (error) {
        console.error('Error fetching data:', error);
        setSubmitError('Failed to load booking information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, clinicId, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.petId) newErrors.petId = 'Please select a pet';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.reason.trim()) newErrors.reason = 'Reason for visit is required';

    // Validate date is not in the past
    if (formData.date && formData.time) {
      try {
        const appointmentTimestamp = toTimestamp(formData.date, formData.time);
        const now = new Date();
        
        if (appointmentTimestamp.toDate() < now) {
          newErrors.date = 'Appointment must be in the future';
        }
      } catch (err) {
        newErrors.date = 'Invalid date or time format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear submit errors
    if (submitError) setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const selectedPet = pets.find(p => p.id === formData.petId);
      const timestamp = toTimestamp(formData.date, formData.time);

      const appointmentData = {
        ownerId: currentUser.uid,
        clinicId: clinicId,
        petId: formData.petId,
        dateTime: timestamp,
        status: 'pending',
        meta: {
          service: formData.service,
          reason: formData.reason,
          notes: formData.notes
        }
      };

      const appointmentRef = await bookAppointment(appointmentData);
      console.log('✅ Appointment booked:', appointmentRef.id);

      // Send notification to clinic owner
      try {
        const clinicName = clinic.clinicName || clinic.name;
        const petName = selectedPet?.name || 'Unknown Pet';
        const appointmentDate = formatShortDate(timestamp);
        const appointmentTime = formatTime(timestamp);
        
        await sendNotification({
          toUserId: clinic.ownerId,
          title: '📅 New Appointment Request',
          body: `New appointment request from ${userData.fullName || 'Pet Owner'} for ${petName} at ${clinicName} on ${appointmentDate} at ${appointmentTime}`,
          appointmentId: appointmentRef.id,
          data: {
            type: 'new_appointment',
            clinicId: clinicId,
            clinicName: clinicName,
            petId: formData.petId,
            petName: petName,
            ownerId: currentUser.uid,
            ownerName: userData.fullName || userData.displayName || userData.email,
            appointmentDate: appointmentDate,
            appointmentTime: appointmentTime,
            service: formData.service,
            reason: formData.reason
          }
        });
        console.log('✅ Notification sent to clinic owner');
      } catch (notifError) {
        console.error('❌ Failed to send notification to clinic:', notifError);
        // Don't fail the booking if notification fails
      }

      setSubmitSuccess(true);

      setTimeout(() => {
        navigate(-1, {
          state: { message: 'Appointment booked successfully!' }
        });
      }, 1500);

    } catch (error) {
      console.error('Error booking appointment:', error);
      setSubmitError(
        error.message || 'Failed to book appointment. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const minDate = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: '240px' }}>
          <TopBar username={displayName} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)' }}>
            <div style={{ textAlign: 'center' }}>
              <LoadingSpinner size="large" message="Loading..." />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: '240px' }}>
          <TopBar username={displayName} />
          <div style={{ padding: '88px 24px 24px 24px', textAlign: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', minHeight: 'calc(100vh - 64px)' }}>
            <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} strokeWidth={2.5} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Clinic Not Found</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '20px' }}>Please select a clinic from the map or your saved clinics.</p>
            <button 
              onClick={() => navigate('/map')} 
              style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Browse Clinics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <TopBar username={displayName} />
        
        <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', padding: '88px 24px 24px 24px' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {/* Clinic Info Banner with Close Button */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e0e7ff', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '44px' }}>
                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={20} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6b7280', fontWeight: 600 }}>Booking appointment at</p>
                  <h3 style={{ margin: '2px 0 0 0', fontSize: '1.125rem', fontWeight: 700, color: '#1f2937' }}>{clinic.clinicName || clinic.name}</h3>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={handleCancel}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '32px',
                  height: '32px',
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <X size={18} color="#6b7280" strokeWidth={2.5} />
              </button>
            </div>

            {/* Header */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={28} color="white" />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: '0 0 6px 0' }}>Book Appointment</h1>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 2 }}>Schedule a visit for your pet</p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {submitSuccess && (
              <div style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', padding: '14px 16px', borderRadius: '10px', border: '1px solid #6ee7b7', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="#059669" />
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#065f46' }}>Appointment Booked Successfully!</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: '#047857' }}>Redirecting to dashboard...</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', padding: '14px 16px', borderRadius: '10px', border: '1px solid #f87171', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={20} color="#dc2626" />
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#991b1b' }}>Booking Failed</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: '#b91c1c' }}>{submitError}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Pet Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                      Select Pet <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    {pets.length === 0 ? (
                      <div style={{ padding: '14px 16px', background: '#fef3c7', borderRadius: '10px', border: '1px solid #fbbf24', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PawPrint size={20} color="#f59e0b" />
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#92400e' }}>No pets found</p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: '#78350f' }}>
                            Add a pet from the{' '}
                            <button
                              type="button"
                              onClick={() => navigate('/pets')}
                              style={{ color: '#1e40af', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                            >
                              Pets page
                            </button>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <select
                          name="petId"
                          value={formData.petId}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          style={{ width: '100%', padding: '12px 14px', border: `1px solid ${errors.petId ? '#ef4444' : '#e5e7eb'}`, borderRadius: '10px', fontSize: '0.9375rem', cursor: 'pointer' }}
                        >
                          <option value="">Choose a pet...</option>
                          {pets.map(pet => (
                            <option key={pet.id} value={pet.id}>{pet.name} ({pet.species})</option>
                          ))}
                        </select>
                        {errors.petId && <p style={{ color: '#ef4444', marginTop: '6px', fontSize: '0.8125rem' }}>{errors.petId}</p>}
                      </>
                    )}
                  </div>

                  {/* Date and Time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                        Date <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Calendar size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          min={minDate}
                          disabled={isSubmitting}
                          style={{ width: '100%', padding: '12px 14px 12px 42px', border: `1px solid ${errors.date ? '#ef4444' : '#e5e7eb'}`, borderRadius: '8px', fontSize: '0.9375rem' }}
                        />
                      </div>
                      {errors.date && <p style={{ color: '#ef4444', marginTop: '6px', fontSize: '0.8125rem' }}>{errors.date}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                        Time <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Clock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                        <input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          style={{ width: '100%', padding: '12px 14px 12px 42px', border: `1px solid ${errors.time ? '#ef4444' : '#e5e7eb'}`, borderRadius: '8px', fontSize: '0.9375rem' }}
                        />
                      </div>
                      {errors.time && <p style={{ color: '#ef4444', marginTop: '6px', fontSize: '0.8125rem' }}>{errors.time}</p>}
                    </div>
                  </div>

                  {/* Service (Optional) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                      Service Type (Optional)
                    </label>
                    <input
                      type="text"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      placeholder="e.g., Vaccination, Checkup"
                      disabled={isSubmitting}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9375rem' }}
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                      Reason for Visit <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <FileText size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#9ca3af', pointerEvents: 'none' }} />
                      <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Describe the reason"
                        disabled={isSubmitting}
                        style={{ width: '100%', padding: '12px 14px 12px 42px', border: `1px solid ${errors.reason ? '#ef4444' : '#e5e7eb'}`, borderRadius: '8px', fontSize: '0.9375rem', resize: 'vertical' }}
                      />
                    </div>
                    {errors.reason && <p style={{ color: '#ef4444', marginTop: '6px', fontSize: '0.8125rem' }}>{errors.reason}</p>}
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Any additional information..."
                      disabled={isSubmitting}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9375rem', resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    style={{ padding: '11px 24px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9375rem', fontWeight: 600, color: '#6b7280', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.5 : 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || pets.length === 0}
                    style={{ padding: '11px 28px', background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9375rem', fontWeight: 700, cursor: (isSubmitting || pets.length === 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.35)' }}
                  >
                    {isSubmitting ? (
                      <>
                        <div style={{ width: '18px', height: '18px' }}>
                          <LoadingSpinner size="small" />
                        </div>
                        Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Book Appointment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
