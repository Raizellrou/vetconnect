import React from 'react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, User, Dog } from 'lucide-react';
import styles from '../../styles/ClinicDashboard.module.css';

// new imports
import { useCollection } from '../../hooks/useCollection';
import { where } from 'firebase/firestore';
import { updateAppointment } from '../../lib/firebaseMutations';

export default function ClinicAppointments() {
  const { userData } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.clinicName || userData?.email;

  // determine clinicId (depends on your user model; adjust if clinic id stored elsewhere)
  const clinicId = userData?.clinicId || userData?.clinicId; // fallback; ensure clinicId is set for clinic owners

  const { docs: appointments = [], loading } = useCollection(
    clinicId ? `appointments` : null,
    clinicId ? [where('clinicId', '==', clinicId)] : []
  );

  const handleUpdateStatus = async (aptId, status) => {
    try {
      await updateAppointment(aptId, { status });
    } catch (err) {
      console.error('Failed to update appointment status', err);
    }
  };

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
              {loading ? (
                <div>Loading appointments...</div>
              ) : appointments.length === 0 ? (
                <div>No appointments</div>
              ) : (
                appointments.map((apt) => (
                  <div key={apt.id} style={{
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
                          {apt.petName || 'Unnamed Pet'}
                        </h4>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#64748b' }}>
                          <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          {apt.date} {apt.time}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                          <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          {apt.ownerName || apt.ownerId || 'Owner'}
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
                      }} onClick={() => handleUpdateStatus(apt.id, 'confirmed')}>
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
                      }} onClick={() => handleUpdateStatus(apt.id, 'rejected')}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
