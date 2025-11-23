import React, { useState } from 'react';
import { Calendar, Clock, Dog, MapPin, FileText, ArrowLeft, Star } from 'lucide-react';
import styles from '../styles/Dashboard.module.css';
import { uploadMultipleImagesToCloudinary } from '../utils/uploadImage';

export default function AppointmentDetailsCard({ appointment, onBack, onRate, onMarkDone, onMedicalRecordCreated }) {
  if (!appointment) return null;

  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [medicalRecordData, setMedicalRecordData] = useState({ diagnosis: '', treatment: '', prescriptions: '', labResults: '', notes: '', files: [] });
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [isHandlingComplete, setIsHandlingComplete] = useState(false);
  const [showMarkDoneConfirm, setShowMarkDoneConfirm] = useState(false);

  const canRate = appointment.status === 'completed' && !appointment.hasReview;
  const alreadyRated = appointment.status === 'completed' && appointment.hasReview;

  const getAppointmentDateTime = (apt) => {
    if (!apt) return new Date();
    if (apt.dateTime) return apt.dateTime?.toDate ? apt.dateTime.toDate() : new Date(apt.dateTime);
    if (apt.date && apt.startTime) {
      try {
        const [hours, minutes] = apt.startTime.split(':').map(Number);
        const d = new Date(apt.date);
        d.setHours(hours || 0, minutes || 0, 0, 0);
        return d;
      } catch (e) {
        return new Date(apt.date);
      }
    }
    return new Date();
  };

  const canMarkAsCompleted = () => {
    const appointmentDate = getAppointmentDateTime(appointment);
    const now = new Date();
    return appointmentDate < now && (appointment.status === 'confirmed' || appointment.status === 'approved');
  };

  const handleMarkDone = async () => {
    setShowMarkDoneConfirm(false);
    if (!onMarkDone) return alert('No handler provided to mark appointment as done');

    try {
      setIsHandlingComplete(true);
      await onMarkDone(appointment);
      setIsHandlingComplete(false);
      // Open medical record modal after marking done
      setShowMedicalRecordModal(true);
    } catch (err) {
      setIsHandlingComplete(false);
      console.error('Failed to mark appointment as done:', err);
      alert(err?.message || 'Failed to mark appointment as done');
    }
  };

  const handleSaveMedicalRecord = async () => {
    if (!appointment) return;
    setIsSavingRecord(true);
    try {
      const { createMedicalRecord } = await import('../firebase/firestoreHelpers');

      const recordData = {
        petId: appointment.petId,
        ownerId: appointment.ownerId,
        clinicId: appointment.clinicId,
        vetInCharge: '',
        diagnosis: medicalRecordData.diagnosis,
        treatment: medicalRecordData.treatment,
        prescriptions: medicalRecordData.prescriptions.split('\n').filter(p => p.trim()),
        labResults: medicalRecordData.labResults,
        notes: medicalRecordData.notes
      };

      if (medicalRecordData.files && medicalRecordData.files.length > 0) {
        try {
          const uploaded = await uploadMultipleImagesToCloudinary(medicalRecordData.files);
          recordData.files = uploaded;
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
          alert('Failed to upload attachments. Please try again.');
          setIsSavingRecord(false);
          return;
        }
      }

      await createMedicalRecord(appointment.id, recordData);
      setShowMedicalRecordModal(false);
      setMedicalRecordData({ diagnosis: '', treatment: '', prescriptions: '', labResults: '', notes: '', files: [] });
      if (onMedicalRecordCreated) onMedicalRecordCreated(appointment.id);
      alert('Medical record created successfully');
    } catch (error) {
      console.error('Failed to create medical record:', error);
      alert('Failed to create medical record. Please try again.');
    } finally {
      setIsSavingRecord(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '24px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
        >
          <ArrowLeft size={16} />
          Back to Appointments
        </button>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#1f2937',
          marginBottom: '8px'
        }}>
          Appointment Details
        </h2>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          background: appointment.status === 'pending' ? '#fef3c7' :
                     appointment.status === 'confirmed' ? '#d1fae5' :
                     appointment.status === 'completed' ? '#dbeafe' : '#fee2e2',
          color: appointment.status === 'pending' ? '#92400e' :
                 appointment.status === 'confirmed' ? '#065f46' :
                 appointment.status === 'completed' ? '#1e40af' : '#991b1b',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {appointment.status}
        </div>
      </div>

      {/* Appointment Information Grid */}
      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Clinic */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MapPin size={24} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              Clinic
            </p>
            <p style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#1f2937',
              margin: 0
            }}>
              {appointment.clinicName}
            </p>
          </div>
        </div>

        {/* Pet */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: appointment.ownerPhoto ? 'transparent' : 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
            border: appointment.ownerPhoto ? '2px solid #e5e7eb' : 'none'
          }}>
            {appointment.ownerPhoto ? (
              <img src={appointment.ownerPhoto} alt={appointment.ownerName || 'Owner'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Dog size={24} color="white" />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              Pet
            </p>
            <p style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#1f2937',
              margin: 0
            }}>
              {appointment.petName}
            </p>
          </div>
        </div>

        {/* Date & Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '20px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Calendar size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px'
              }}>
                Date
              </p>
              <p style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1f2937',
                margin: 0
              }}>
                {appointment.date}
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '20px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px'
              }}>
                Time
              </p>
              <p style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1f2937',
                margin: 0
              }}>
                {appointment.time}
              </p>
            </div>
          </div>
        </div>

        {/* Symptoms/Reason */}
        {appointment.symptoms && (
          <div style={{
            padding: '20px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={20} color="white" />
              </div>
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
            <p style={{
              fontSize: '0.9375rem',
              color: '#1f2937',
              lineHeight: '1.6',
              margin: 0
            }}>
              {appointment.symptoms}
            </p>
          </div>
        )}
      </div>

      {/* Rate Clinic Button or Already Rated Message */}
      <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #f3f4f6' }}>
        {canMarkAsCompleted() && (
          <button
            onClick={() => setShowMarkDoneConfirm(true)}
            disabled={isHandlingComplete}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: isHandlingComplete ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 20px rgba(59,130,246,0.2)'
            }}
          >
            {isHandlingComplete ? 'Marking...' : 'Mark As Done'}
          </button>
        )}

        {appointment.status === 'completed' && (
          <>
            {canRate && onRate && (
              <button
                onClick={onRate}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Star size={18} />
                &nbsp;Rate This Clinic
              </button>
            )}

            {!appointment.hasMedicalRecord && (
              <button
                onClick={() => setShowMedicalRecordModal(true)}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <FileText size={18} />
                &nbsp;Add Medical Record
              </button>
            )}

            {alreadyRated && (
              <div style={{
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                border: '2px solid #6ee7b7',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '12px'
              }}>
                <Star size={24} color="#059669" fill="#059669" />
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#065f46' }}>
                  You have already reviewed this clinic
                </span>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Mark As Done Confirmation Modal */}
      {showMarkDoneConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowMarkDoneConfirm(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, marginBottom: 12, fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>Mark this appointment as completed?</h3>
            <p style={{ margin: 0, marginBottom: 24, fontSize: '0.9375rem', color: '#6b7280', lineHeight: 1.6 }}>This will mark the appointment as done and allow you to create a medical record.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowMarkDoneConfirm(false)} style={{ padding: '10px 24px', borderRadius: 10, border: '2px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleMarkDone} disabled={isHandlingComplete} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: isHandlingComplete ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', fontSize: '0.9375rem', fontWeight: 600, cursor: isHandlingComplete ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>{isHandlingComplete ? 'Processing...' : 'OK'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Medical Record Modal */}
      {showMedicalRecordModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => !isSavingRecord && setShowMedicalRecordModal(false)}>
          <div style={{ background: 'white', borderRadius: 12, maxWidth: 720, width: '100%', padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0, marginBottom: 8 }}>Create Medical Record for {appointment.petName}</h3>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>Attach findings, prescriptions, and files.</p>

            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ fontWeight: 600 }}>Diagnosis *</label>
              <textarea value={medicalRecordData.diagnosis} onChange={(e) => setMedicalRecordData({ ...medicalRecordData, diagnosis: e.target.value })} rows={3} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} disabled={isSavingRecord} />

              <label style={{ fontWeight: 600 }}>Treatment *</label>
              <textarea value={medicalRecordData.treatment} onChange={(e) => setMedicalRecordData({ ...medicalRecordData, treatment: e.target.value })} rows={3} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} disabled={isSavingRecord} />

              <label style={{ fontWeight: 600 }}>Prescriptions (one per line)</label>
              <textarea value={medicalRecordData.prescriptions} onChange={(e) => setMedicalRecordData({ ...medicalRecordData, prescriptions: e.target.value })} rows={3} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} disabled={isSavingRecord} />

              <label style={{ fontWeight: 600 }}>Lab Results</label>
              <textarea value={medicalRecordData.labResults} onChange={(e) => setMedicalRecordData({ ...medicalRecordData, labResults: e.target.value })} rows={2} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} disabled={isSavingRecord} />

              <label style={{ fontWeight: 600 }}>Additional Notes</label>
              <textarea value={medicalRecordData.notes} onChange={(e) => setMedicalRecordData({ ...medicalRecordData, notes: e.target.value })} rows={2} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }} disabled={isSavingRecord} />

              <label style={{ fontWeight: 600 }}>Attach Files (images/PDF)</label>
              <input type="file" multiple accept="image/*,application/pdf" disabled={isSavingRecord} onChange={(e) => setMedicalRecordData({ ...medicalRecordData, files: e.target.files ? Array.from(e.target.files) : [] })} />

              {medicalRecordData.files && medicalRecordData.files.length > 0 && (
                <div style={{ display: 'grid', gap: 8 }}>
                  {medicalRecordData.files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {f.type && f.type.startsWith('image') ? <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 12, color: '#6b7280' }}>PDF</div>}
                        </div>
                        <div style={{ fontSize: 14 }}>{f.name}</div>
                      </div>
                      <button onClick={() => { const newFiles = medicalRecordData.files.filter((_, idx) => idx !== i); setMedicalRecordData({ ...medicalRecordData, files: newFiles }); }} disabled={isSavingRecord} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6 }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => !isSavingRecord && setShowMedicalRecordModal(false)} disabled={isSavingRecord} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white' }}>Cancel</button>
                <button onClick={handleSaveMedicalRecord} disabled={isSavingRecord || !medicalRecordData.diagnosis || !medicalRecordData.treatment} style={{ padding: '10px 16px', borderRadius: 8, background: isSavingRecord || !medicalRecordData.diagnosis || !medicalRecordData.treatment ? '#9ca3af' : 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', color: 'white', border: 'none' }}>{isSavingRecord ? 'Saving...' : 'Save Record'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
