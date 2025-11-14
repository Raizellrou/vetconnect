import React, { useState } from 'react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, User, Dog, CheckCircle, XCircle } from 'lucide-react';
import styles from '../../styles/ClinicDashboard.module.css';

// new imports
import { useCollection } from '../../hooks/useCollection';
import { where } from 'firebase/firestore';
import { updateAppointment } from '../../lib/firebaseMutations';

export default function ClinicAppointments() {
  const { userData } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.clinicName || userData?.email;

  // Dummy appointments data
  const [dummyAppointments, setDummyAppointments] = useState([
    {
      id: 'dummy-1',
      petName: 'Max',
      petSpecies: 'Dog',
      petBreed: 'Golden Retriever',
      ownerName: 'John Smith',
      symptoms: 'Regular checkup and vaccination',
      date: '2024-11-20',
      time: '10:00 AM',
      status: 'pending',
      additionalNotes: 'First visit to clinic'
    },
    {
      id: 'dummy-2',
      petName: 'Bella',
      petSpecies: 'Cat',
      petBreed: 'Persian',
      ownerName: 'Sarah Johnson',
      symptoms: 'Loss of appetite, seems lethargic',
      date: '2024-11-21',
      time: '2:30 PM',
      status: 'pending',
      additionalNotes: 'Has been like this for 2 days'
    },
    {
      id: 'dummy-3',
      petName: 'Charlie',
      petSpecies: 'Dog',
      petBreed: 'Beagle',
      ownerName: 'Mike Davis',
      symptoms: 'Limping on right front leg',
      date: '2024-11-22',
      time: '11:00 AM',
      status: 'pending',
      additionalNotes: 'Started limping yesterday after playing'
    },
    {
      id: 'dummy-4',
      petName: 'Luna',
      petSpecies: 'Cat',
      petBreed: 'Siamese',
      ownerName: 'Emily Brown',
      symptoms: 'Dental cleaning needed',
      date: '2024-11-23',
      time: '9:00 AM',
      status: 'pending',
      additionalNotes: 'Annual dental checkup'
    }
  ]);

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

  const handleDummyUpdateStatus = (aptId, status) => {
    setDummyAppointments(prev => 
      prev.map(apt => 
        apt.id === aptId ? { ...apt, status } : apt
      )
    );
  };

  const pendingDummyAppointments = dummyAppointments.filter(apt => apt.status === 'pending');
  const approvedDummyAppointments = dummyAppointments.filter(apt => apt.status === 'confirmed');
  const rejectedDummyAppointments = dummyAppointments.filter(apt => apt.status === 'rejected');

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

          {/* Pending Appointments */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: '#fef3c7', 
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={20} color="#f59e0b" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                Pending Appointments ({pendingDummyAppointments.length})
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingDummyAppointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No pending appointments
                </div>
              ) : (
                pendingDummyAppointments.map((apt) => (
                  <div key={apt.id} style={{
                    padding: '24px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '20px'
                  }}>
                    <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Dog size={28} color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>
                          {apt.petName} - {apt.petSpecies}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} />
                            <strong>Owner:</strong> {apt.ownerName}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                            <strong>Breed:</strong> {apt.petBreed}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} />
                            <strong>Date:</strong> {new Date(apt.date).toLocaleDateString()}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} />
                            <strong>Time:</strong> {apt.time}
                          </p>
                        </div>
                        <div style={{ 
                          background: 'white', 
                          padding: '12px', 
                          borderRadius: '8px',
                          marginBottom: '8px'
                        }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                            Symptoms / Reason:
                          </p>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e293b' }}>
                            {apt.symptoms}
                          </p>
                        </div>
                        {apt.additionalNotes && (
                          <div style={{ 
                            background: 'white', 
                            padding: '12px', 
                            borderRadius: '8px'
                          }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                              Additional Notes:
                            </p>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e293b' }}>
                              {apt.additionalNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
                      <button style={{
                        padding: '10px 20px',
                        background: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }} 
                      onClick={() => handleDummyUpdateStatus(apt.id, 'confirmed')}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#16a34a'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#22c55e'}
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button style={{
                        padding: '10px 20px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }} 
                      onClick={() => handleDummyUpdateStatus(apt.id, 'rejected')}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Approved Appointments */}
          {approvedDummyAppointments.length > 0 && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  background: '#dcfce7', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle size={20} color="#22c55e" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#22c55e' }}>
                  Approved Appointments ({approvedDummyAppointments.length})
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {approvedDummyAppointments.map((apt) => (
                  <div key={apt.id} style={{
                    padding: '16px',
                    background: '#f0fdf4',
                    borderRadius: '10px',
                    border: '2px solid #22c55e',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>
                        {apt.petName} - {apt.ownerName}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                        {new Date(apt.date).toLocaleDateString()} at {apt.time}
                      </p>
                    </div>
                    <div style={{ 
                      padding: '6px 16px', 
                      background: '#22c55e', 
                      color: 'white', 
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      APPROVED
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Appointments */}
          {rejectedDummyAppointments.length > 0 && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  background: '#fee2e2', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <XCircle size={20} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#ef4444' }}>
                  Rejected Appointments ({rejectedDummyAppointments.length})
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rejectedDummyAppointments.map((apt) => (
                  <div key={apt.id} style={{
                    padding: '16px',
                    background: '#fef2f2',
                    borderRadius: '10px',
                    border: '2px solid #ef4444',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>
                        {apt.petName} - {apt.ownerName}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                        {new Date(apt.date).toLocaleDateString()} at {apt.time}
                      </p>
                    </div>
                    <div style={{ 
                      padding: '6px 16px', 
                      background: '#ef4444', 
                      color: 'white', 
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      REJECTED
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
