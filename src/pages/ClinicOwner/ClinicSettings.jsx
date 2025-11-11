import React from 'react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Settings as SettingsIcon, Clock, Phone, MapPin } from 'lucide-react';
import styles from '../../styles/ClinicDashboard.module.css';

export default function ClinicSettings() {
  const { userData } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.clinicName || userData?.email;

  return (
    <div className={styles.dashboard}>
      <ClinicSidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        
        <main className={styles.mainContent}>
          <header style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', margin: '0 0 8px 0' }}>
              Clinic Settings
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              Manage your clinic information, business hours, and preferences
            </p>
          </header>

          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <SettingsIcon size={24} color="#818cf8" />
                Clinic Information
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>
                    Clinic Name
                  </label>
                  <input 
                    type="text" 
                    defaultValue={userData?.clinicName || 'My Veterinary Clinic'}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>
                    <Phone size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Contact Number
                  </label>
                  <input 
                    type="tel" 
                    placeholder="+1 (555) 123-4567"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#1e293b' }}>
                    <MapPin size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Address
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="123 Main Street, City, State 12345"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={24} color="#818cf8" />
                Business Hours
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '120px', fontWeight: 600, color: '#1e293b' }}>{day}</div>
                    <input 
                      type="time" 
                      defaultValue="09:00"
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <span>to</span>
                    <input 
                      type="time" 
                      defaultValue="17:00"
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button style={{
                padding: '12px 24px',
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}>
                Cancel
              </button>
              <button style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}>
                Save Changes
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
