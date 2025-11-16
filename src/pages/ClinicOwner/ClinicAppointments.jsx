import React, { useState, useEffect } from 'react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, User, Dog, CheckCircle, XCircle, AlertCircle, ArrowLeft, Building2, Filter, Search, ChevronRight, FileText, Plus } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from '../../styles/ClinicDashboard.module.css';
import { useCollection } from '../../hooks/useCollection';
import { where } from 'firebase/firestore';
import { updateAppointment, completeAppointment, addAppointmentNotes } from '../../lib/firebaseMutations';
import { collection, getDocs, query as firestoreQuery, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { formatShortDate, formatTime } from '../../utils/dateUtils';
import { sendNotification } from '../../firebase/firestoreHelpers';

export default function ClinicAppointments() {
  const { userData, currentUser } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.clinicName || userData?.email;

  // Two-step navigation state
  const [viewState, setViewState] = useState('clinic-list');
  const [selectedClinic, setSelectedClinic] = useState(null);
  
  // Clinic and appointment data
  const [clinics, setClinics] = useState([]);
  const [enrichedAppointments, setEnrichedAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);

  // Filtering and search
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Missing state variables
  const [showNotesDialog, setShowNotesDialog] = useState(null);
  const [clinicNotes, setClinicNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Real-time listener for appointments of selected clinic
  const {
    docs: appointments = [],
    loading: appointmentsLoading,
    error: appointmentsError
  } = useCollection(
    selectedClinic ? 'appointments' : null,
    selectedClinic ? [where('clinicId', '==', selectedClinic.id)] : []
  );

  // Fetch all clinics owned by this user
  useEffect(() => {
    const fetchClinics = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);

        // Fetch from Firestore
        const clinicsQuery = firestoreQuery(
          collection(db, 'clinics'),
          where('ownerId', '==', currentUser.uid)
        );
        const clinicsSnapshot = await getDocs(clinicsQuery);
        
        const clinicsData = clinicsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Also check localStorage
        const localClinics = JSON.parse(localStorage.getItem('clinics') || '[]');
        
        // Merge, prioritizing Firestore data
        const mergedClinics = [...clinicsData];
        localClinics.forEach(localClinic => {
          if (!mergedClinics.find(c => c.id === localClinic.id)) {
            mergedClinics.push(localClinic);
          }
        });

        setClinics(mergedClinics);
        console.log('Found clinics:', mergedClinics);
      } catch (error) {
        console.error('Error fetching clinics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, [currentUser]);

  // Enrich appointments with pet and owner details
  useEffect(() => {
    const enrichAppointments = async () => {
      if (!appointments || appointments.length === 0) {
        setEnrichedAppointments([]);
        return;
      }

      setEnriching(true);
      try {
        const enriched = await Promise.all(
          appointments.map(async (apt) => {
            try {
              // Fetch pet details
              let petData = { name: 'Unknown Pet', species: 'Unknown', breed: 'Unknown' };
              if (apt.petId && apt.ownerId) {
                try {
                  const petRef = doc(db, 'users', apt.ownerId, 'pets', apt.petId);
                  const petSnap = await getDoc(petRef);
                  if (petSnap.exists()) {
                    petData = petSnap.data();
                  }
                } catch (err) {
                  console.warn('Failed to fetch pet:', err);
                }
              }

              // Fetch owner details
              let ownerData = { fullName: 'Unknown Owner', displayName: 'Unknown' };
              if (apt.ownerId) {
                try {
                  const ownerRef = doc(db, 'users', apt.ownerId);
                  const ownerSnap = await getDoc(ownerRef);
                  if (ownerSnap.exists()) {
                    ownerData = ownerSnap.data();
                  }
                } catch (err) {
                  console.warn('Failed to fetch owner:', err);
                }
              }

              return {
                ...apt,
                petName: petData.name || 'Unknown Pet',
                petSpecies: petData.species || 'Unknown',
                petBreed: petData.breed || 'Unknown',
                ownerName: ownerData.fullName || ownerData.displayName || ownerData.email || 'Unknown Owner',
                symptoms: apt.meta?.reason || apt.reason || 'No reason provided',
                service: apt.meta?.service || apt.service || '',
                additionalNotes: apt.meta?.notes || apt.notes || ''
              };
            } catch (err) {
              console.error('Error enriching appointment:', err);
              return {
                ...apt,
                petName: 'Unknown Pet',
                petSpecies: 'Unknown',
                petBreed: 'Unknown',
                ownerName: 'Unknown Owner',
                symptoms: apt.meta?.reason || 'No reason provided',
                service: apt.meta?.service || '',
                additionalNotes: apt.meta?.notes || ''
              };
            }
          })
        );

        setEnrichedAppointments(enriched);
      } catch (error) {
        console.error('Error enriching appointments:', error);
      } finally {
        setEnriching(false);
      }
    };

    enrichAppointments();
  }, [appointments]);

  const handleUpdateStatus = async (aptId, newStatus, appointment) => {
    try {
      await updateAppointment(aptId, { status: newStatus });
      console.log(`Appointment ${aptId} updated to ${newStatus}`);
      
      // Send notification to pet owner
      const notificationTitle = newStatus === 'confirmed' 
        ? 'Appointment Confirmed' 
        : 'Appointment Rejected';
      
      const notificationBody = newStatus === 'confirmed'
        ? `Your appointment at ${selectedClinic.clinicName || selectedClinic.name} has been confirmed!`
        : `Your appointment at ${selectedClinic.clinicName || selectedClinic.name} has been rejected. Please contact the clinic for more information.`;

      await sendNotification({
        toUserId: appointment.ownerId,
        title: notificationTitle,
        body: notificationBody,
        appointmentId: aptId,
        data: {
          clinicId: selectedClinic.id,
          clinicName: selectedClinic.clinicName || selectedClinic.name,
          status: newStatus,
          petName: appointment.petName
        }
      });

      // Show success message (optional)
      console.log('Notification sent to pet owner');
    } catch (err) {
      console.error('Failed to update appointment status:', err);
      alert('Failed to update appointment status. Please try again.');
    }
  };

  const handleMarkAsCompleted = async (apt) => {
    if (!window.confirm('Mark this appointment as completed?')) return;
    
    try {
      await completeAppointment(apt.id);
      console.log(`Appointment ${apt.id} marked as completed`);
    } catch (err) {
      console.error('Failed to complete appointment:', err);
      alert(err.message || 'Failed to complete appointment. Please try again.');
    }
  };

  const handleAddNotes = (apt) => {
    setShowNotesDialog(apt);
    setClinicNotes(apt.clinicNotes || '');
  };

  const handleSaveNotes = async () => {
    if (!showNotesDialog) return;
    
    setIsSavingNotes(true);
    try {
      await addAppointmentNotes(showNotesDialog.id, clinicNotes);
      setShowNotesDialog(null);
      setClinicNotes('');
    } catch (err) {
      console.error('Failed to save notes:', err);
      alert('Failed to save notes. Please try again.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCreateMedicalRecord = (apt) => {
    // Navigate to medical record creation page
    window.location.href = `/clinic/medical-records/create?appointmentId=${apt.id}&petId=${apt.petId}&ownerId=${apt.ownerId}`;
  };

  const handleSelectClinic = (clinic) => {
    setSelectedClinic(clinic);
    setViewState('appointments');
  };

  const handleBackToClinics = () => {
    setSelectedClinic(null);
    setViewState('clinic-list');
    // Clear filters when going back
    setStatusFilter('all');
    setDateFilter('all');
    setSearchQuery('');
    setCustomDateStart('');
    setCustomDateEnd('');
  };

  // Check if appointment date has passed
  const canMarkAsCompleted = (apt) => {
    const appointmentDate = apt.dateTime?.toDate ? apt.dateTime.toDate() : new Date(apt.dateTime);
    const now = new Date();
    return appointmentDate < now && apt.status === 'confirmed';
  };

  // Filter appointments based on criteria
  const getFilteredAppointments = () => {
    let filtered = [...enrichedAppointments];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Filter by date
    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filtered = filtered.filter(apt => {
        const aptDate = apt.dateTime?.toDate ? apt.dateTime.toDate() : new Date(apt.dateTime);
        return aptDate >= today && aptDate < tomorrow;
      });
    } else if (dateFilter === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      
      filtered = filtered.filter(apt => {
        const aptDate = apt.dateTime?.toDate ? apt.dateTime.toDate() : new Date(apt.dateTime);
        return aptDate >= tomorrow && aptDate < dayAfter;
      });
    } else if (dateFilter === 'custom' && customDateStart && customDateEnd) {
      const start = new Date(customDateStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customDateEnd);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(apt => {
        const aptDate = apt.dateTime?.toDate ? apt.dateTime.toDate() : new Date(apt.dateTime);
        return aptDate >= start && aptDate <= end;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.petName.toLowerCase().includes(query) ||
        apt.ownerName.toLowerCase().includes(query) ||
        apt.symptoms.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.dateTime?.toDate ? a.dateTime.toDate() : new Date(a.dateTime);
      const dateB = b.dateTime?.toDate ? b.dateTime.toDate() : new Date(b.dateTime);
      return dateB - dateA;
    });

    return filtered;
  };

  // Group appointments by date
  const groupAppointmentsByDate = (appointments) => {
    const groups = {};
    
    appointments.forEach(apt => {
      const date = apt.dateTime?.toDate ? apt.dateTime.toDate() : new Date(apt.dateTime);
      const dateKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(apt);
    });
    
    return groups;
  };

  const filteredAppointments = getFilteredAppointments();
  const groupedAppointments = groupAppointmentsByDate(filteredAppointments);

  // Calculate stats for each clinic
  const getClinicStats = (clinicId) => {
    // This would need to fetch appointment counts - for now we'll use placeholder
    return {
      pending: 0,
      total: 0
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.dashboard}>
        <ClinicSidebar />
        <div className={styles.mainWrapper}>
          <TopBar username={displayName} />
          <main className={styles.mainContent}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
              <LoadingSpinner size="large" message="Loading your clinics..." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <ClinicSidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        
        <main className={styles.mainContent}>
          {viewState === 'clinic-list' ? (
            <>
              {/* Clinic Selection View */}
              <header style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', margin: '0 0 8px 0' }}>
                  Select a Clinic
                </h1>
                <p style={{ color: '#64748b', margin: 0 }}>
                  Choose a clinic to view and manage its appointments
                </p>
              </header>

              {clinics.length === 0 ? (
                <div style={{ 
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                  padding: '48px', 
                  borderRadius: '20px', 
                  border: '2px solid #fbbf24',
                  textAlign: 'center'
                }}>
                  <AlertCircle size={64} color="#f59e0b" style={{ margin: '0 auto 24px' }} />
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#92400e', marginBottom: '12px' }}>No Clinics Found</h3>
                  <p style={{ color: '#78350f', marginBottom: '24px' }}>Please register your clinic first to manage appointments.</p>
                  <button
                    onClick={() => window.location.href = '/clinic/management'}
                    style={{
                      padding: '14px 32px',
                      background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Register Clinic
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                  {clinics.map(clinic => {
                    const stats = getClinicStats(clinic.id);
                    return (
                      <div
                        key={clinic.id}
                        onClick={() => handleSelectClinic(clinic)}
                        style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '24px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          border: '2px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.borderColor = '#818cf8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                          <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Building2 size={28} color="white" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{
                              fontSize: '1.25rem',
                              fontWeight: 700,
                              color: '#1f2937',
                              marginBottom: '4px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {clinic.clinicName || clinic.name}
                            </h3>
                            <p style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              margin: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span>{clinic.address || 'No address'}</span>
                            </p>
                          </div>
                          <ChevronRight size={24} color="#9ca3af" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '16px', borderTop: '2px solid #f3f4f6' }}>
                          <div style={{ textAlign: 'center', padding: '12px', background: '#fef3c7', borderRadius: '10px' }}>
                            <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>Pending</p>
                            <p style={{ fontSize: '1.5rem', color: '#78350f', margin: '4px 0 0 0', fontWeight: 700 }}>{stats.pending}</p>
                          </div>
                          <div style={{ textAlign: 'center', padding: '12px', background: '#e0e7ff', borderRadius: '10px' }}>
                            <p style={{ fontSize: '0.75rem', color: '#4338ca', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>Total</p>
                            <p style={{ fontSize: '1.5rem', color: '#3730a3', margin: '4px 0 0 0', fontWeight: 700 }}>{stats.total}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Appointments View for Selected Clinic */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={handleBackToClinics}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '16px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#818cf8';
                    e.currentTarget.style.color = '#818cf8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.color = '#374151';
                  }}
                >
                  <ArrowLeft size={18} />
                  Back to Clinics
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Building2 size={24} color="white" />
                  </div>
                  <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                      {selectedClinic.clinicName || selectedClinic.name}
                    </h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>
                      Appointment Management
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <Filter size={20} color="#818cf8" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Filters</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {/* Status Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Date</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {/* Search */}
                  <div style={{ gridColumn: dateFilter === 'custom' ? 'auto' : 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Search</label>
                    <div style={{ position: 'relative' }}>
                      <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by pet, owner, or symptoms..."
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 40px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Date Range */}
                {dateFilter === 'custom' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Start Date</label>
                      <input
                        type="date"
                        value={customDateStart}
                        onChange={(e) => setCustomDateStart(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>End Date</label>
                      <input
                        type="date"
                        value={customDateEnd}
                        onChange={(e) => setCustomDateEnd(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Results Summary */}
              <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#eef2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: '#4338ca', fontWeight: 600 }}>
                  Showing {filteredAppointments.length} of {enrichedAppointments.length} appointments
                </span>
                {(statusFilter !== 'all' || dateFilter !== 'all' || searchQuery.trim()) && (
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setDateFilter('all');
                      setSearchQuery('');
                      setCustomDateStart('');
                      setCustomDateEnd('');
                    }}
                    style={{
                      padding: '6px 16px',
                      background: 'white',
                      border: '1px solid #c7d2fe',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#4338ca',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {enriching && (
                <div style={{ 
                  background: '#eef2ff', 
                  padding: '12px 20px', 
                  borderRadius: '10px', 
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  <LoadingSpinner size="small" message="Loading appointment details..." />
                </div>
              )}

              {/* Appointments Grouped by Date */}
              {!appointmentsLoading && !enriching && filteredAppointments.length === 0 ? (
                <div style={{ 
                  background: 'white', 
                  borderRadius: '20px', 
                  padding: '80px 40px', 
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
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
                    No appointments found
                  </h3>
                  <p style={{ fontSize: '1.125rem', color: '#6b7280', maxWidth: '500px', margin: '0 auto' }}>
                    {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' 
                      ? 'Try adjusting your filters to see more results.'
                      : 'When pet owners book appointments at this clinic, they will appear here.'}
                  </p>
                </div>
              ) : (
                Object.entries(groupedAppointments).map(([dateKey, dayAppointments]) => (
                  <div key={dateKey} style={{ marginBottom: '32px' }}>
                    {/* Date Separator */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        padding: '8px 20px',
                        background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(129, 140, 248, 0.3)'
                      }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>
                          {dateKey}
                        </span>
                      </div>
                      <div style={{ flex: 1, height: '2px', background: '#e5e7eb' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#9ca3af' }}>
                        {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Appointments for this date */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {dayAppointments.map((apt) => (
                        <div key={apt.id} style={{
                          background: 'white',
                          padding: '24px',
                          borderRadius: '12px',
                          border: '2px solid #e2e8f0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
                                  <Clock size={14} />
                                  <strong>Time:</strong> {apt.dateTime ? formatTime(apt.dateTime) : 'N/A'}
                                </p>
                                {apt.service && (
                                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                                    <strong>Service:</strong> {apt.service}
                                  </p>
                                )}
                              </div>
                              <div style={{ 
                                background: 'white', 
                                padding: '12px', 
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
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
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb'
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
                          
                          {/* Action Buttons */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                            {apt.status === 'pending' && (
                              <>
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
                                onClick={() => handleUpdateStatus(apt.id, 'confirmed', apt)}
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
                                onClick={() => handleUpdateStatus(apt.id, 'rejected', apt)}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                                >
                                  <XCircle size={16} />
                                  Reject
                                </button>
                              </>
                            )}

                            {apt.status === 'confirmed' && canMarkAsCompleted(apt) && (
                              <>
                                <button style={{
                                  padding: '10px 20px',
                                  background: '#3b82f6',
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
                                onClick={() => handleMarkAsCompleted(apt)}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                                >
                                  <CheckCircle size={16} />
                                  Mark Done
                                </button>
                                <button style={{
                                  padding: '10px 20px',
                                  background: 'white',
                                  color: '#6b7280',
                                  border: '2px solid #e5e7eb',
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
                                onClick={() => handleAddNotes(apt)}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#818cf8'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                                >
                                  <FileText size={16} />
                                  Add Notes
                                </button>
                              </>
                            )}

                            {apt.status === 'completed' && (
                              <>
                                <div style={{ 
                                  padding: '8px 20px', 
                                  background: '#22c55e', 
                                  color: 'white', 
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  textAlign: 'center'
                                }}>
                                  COMPLETED
                                </div>
                                {!apt.hasMedicalRecord && (
                                  <button style={{
                                    padding: '10px 20px',
                                    background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
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
                                  onClick={() => handleCreateMedicalRecord(apt)}
                                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'
                                  }
                                  >
                                    <Plus size={16} />
                                    Medical Record
                                  </button>
                                )}
                                <button style={{
                                  padding: '10px 20px',
                                  background: 'white',
                                  color: '#6b7280',
                                  border: '2px solid #e5e7eb',
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
                                onClick={() => handleAddNotes(apt)}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#818cf8'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                                >
                                  <FileText size={16} />
                                  {apt.clinicNotes ? 'View/Edit Notes' : 'Add Notes'}
                                </button>
                              </>
                            )}

                            {apt.status === 'rejected' && (
                              <div style={{ 
                                padding: '8px 20px', 
                                background: '#ef4444', 
                                color: 'white', 
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textAlign: 'center'
                              }}>
                                REJECTED
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </main>
      </div>

      {/* Notes Dialog */}
      {showNotesDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}
        onClick={() => !isSavingNotes && setShowNotesDialog(null)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
              Appointment Notes
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Add notes, tips, or recommendations for <strong>{showNotesDialog.petName}</strong>
            </p>

            <textarea
              value={clinicNotes}
              onChange={(e) => setClinicNotes(e.target.value)}
              placeholder="Enter your notes here..."
              rows={8}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                resize: 'vertical',
                marginBottom: '20px'
              }}
              disabled={isSavingNotes}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => !isSavingNotes && setShowNotesDialog(null)}
                disabled={isSavingNotes}
                style={{
                  padding: '12px 28px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: isSavingNotes ? 'not-allowed' : 'pointer',
                  opacity: isSavingNotes ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                style={{
                  padding: '12px 32px',
                  background: isSavingNotes ? '#9ca3af' : 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  cursor: isSavingNotes ? 'not-allowed' : 'pointer',
                  boxShadow: isSavingNotes ? 'none' : '0 4px 12px rgba(129, 140, 248, 0.4)'
                }}
              >
                {isSavingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}