import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorState({ title = 'Error', message = 'Something went wrong' }) {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
      padding: '24px', 
      borderRadius: '14px', 
      border: '2px solid #f87171', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px' 
    }}>
      <AlertCircle size={24} color="#dc2626" />
      <div>
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#991b1b' }}>{title}</p>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#b91c1c' }}>{message}</p>
      </div>
    </div>
  );
}
