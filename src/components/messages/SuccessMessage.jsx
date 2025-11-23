import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export default function SuccessMessage({ message, onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes scaleIn {
            from {
              transform: scale(0.9);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
      
      {/* Backdrop Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Success Card */}
        <div 
          style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* Icon Container */}
          <div 
            style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              border: '3px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
            }}
          >
            <CheckCircle size={36} color="white" strokeWidth={2.5} />
          </div>
          
          {/* Message */}
          <p 
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#1e293b',
              margin: 0,
              lineHeight: 1.6
            }}
          >
            {message}
          </p>
        </div>
      </div>
    </>
  );
}
