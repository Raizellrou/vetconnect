import React from 'react';
import { Loader } from 'lucide-react';

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <Loader size={48} color="#818cf8" className="animate-spin" style={{ margin: '0 auto 16px' }} />
      <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>{message}</p>
    </div>
  );
}
