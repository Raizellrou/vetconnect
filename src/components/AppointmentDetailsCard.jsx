import React from 'react';
import { Calendar, Clock, Dog, MapPin, FileText, ArrowLeft, Star } from 'lucide-react';
import styles from '../styles/Dashboard.module.css';

export default function AppointmentDetailsCard({ appointment, onBack, onRate }) {
  if (!appointment) return null;

  const canRate = appointment.status === 'completed' && !appointment.hasReview;
  const alreadyRated = appointment.status === 'completed' && appointment.hasReview;

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
            background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Dog size={24} color="white" />
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
      {appointment.status === 'completed' && (
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #f3f4f6' }}>
          {canRate && onRate && (
            <button
              onClick={onRate}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.0625rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 4px 16px rgba(251, 191, 36, 0.4)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(251, 191, 36, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(251, 191, 36, 0.4)';
              }}
            >
              <Star size={24} fill="white" />
              Rate This Clinic
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
              gap: '12px'
            }}>
              <Star size={24} color="#059669" fill="#059669" />
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#065f46' }}>
                You have already reviewed this clinic
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
