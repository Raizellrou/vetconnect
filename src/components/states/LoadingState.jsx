import React from 'react';
import LoadingSpinner from '../LoadingSpinner';

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <LoadingSpinner size="large" message={message} />
    </div>
  );
}
