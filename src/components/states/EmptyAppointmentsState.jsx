import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmptyAppointmentsState() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ 
        width: '120px', 
        height: '120px', 
        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', 
        borderRadius: '24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        margin: '0 auto 24px' 
      }}>
        <Calendar size={56} color="#818cf8" />
      </div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>
        No appointments yet
      </h3>
      <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '24px' }}>
        Find a clinic and book your first appointment
      </p>
      <button
        onClick={() => navigate('/map')}
        style={{ 
          padding: '14px 32px', 
          background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)', 
          color: 'white', 
          border: 'none', 
          borderRadius: '12px', 
          fontSize: '1rem', 
          fontWeight: 700, 
          cursor: 'pointer', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '10px' 
        }}
      >
        <MapPin size={20} />
        Browse Clinics
      </button>
    </div>
  );
}
