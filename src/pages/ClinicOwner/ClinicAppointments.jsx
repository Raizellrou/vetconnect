import React from 'react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, User, Dog } from 'lucide-react';
import styles from '../../styles/ClinicDashboard.module.css';

export default function ClinicAppointments() {
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
              Appointments Management
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              View, confirm, and manage all pet appointment requests
            </p>
          </header>

          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>Pending Appointments</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3].map((item) => (
                <div key={item} style={{
                  padding: '20px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Dog size={24} color="#818cf8" />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>
                        Max - Beagle
                      </h4>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#64748b' }}>
                        <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Nov 15, 2025 at 2:30 PM
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                        <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        John Doe
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                      padding: '8px 16px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}>
                      Confirm
                    </button>
                    <button style={{
                      padding: '8px 16px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
