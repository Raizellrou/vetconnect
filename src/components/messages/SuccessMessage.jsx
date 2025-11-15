import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function SuccessMessage({ message }) {
  if (!message) return null;

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
      padding: '20px 24px', 
      borderRadius: '14px', 
      border: '2px solid #6ee7b7', 
      marginBottom: '24px', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px',
      animation: 'slideIn 0.3s ease'
    }}>
      <CheckCircle size={24} color="#059669" />
      <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#065f46' }}>
        {message}
      </p>
    </div>
  );
}
