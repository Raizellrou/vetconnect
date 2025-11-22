import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import WorkingHoursModal from '../../components/modals/WorkingHoursModal';
import ExtendAppointmentModal from '../../components/modals/ExtendAppointmentModal';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, User, Dog, CheckCircle, XCircle, AlertCircle, ArrowLeft, Building2, Filter, Search, ChevronRight, FileText, Plus, Settings, ArrowRightLeft, MapPin } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from '../../styles/ClinicDashboard.module.css';
import { useCollection } from '../../hooks/useCollection';
import { where } from 'firebase/firestore';
import { updateAppointment, completeAppointment, addAppointmentNotes } from '../../lib/firebaseMutations';
import { collection, getDocs, query as firestoreQuery, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { formatShortDate, formatTime } from '../../utils/dateUtils';
import { sendNotification, approveAppointment } from '../../firebase/firestoreHelpers';

export default function ClinicAppointments() {
  const { userData, currentUser } = useAuth();
  const location = useLocation();
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
  
  // New modals
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingAppointment, setExtendingAppointment] = useState(null);
  
  // Medical record modal state
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [selectedAppointmentForRecord, setSelectedAppointmentForRecord] = useState(null);
  const [medicalRecordData, setMedicalRecordData] = useState({
    diagnosis: '',
    treatment: '',
    prescriptions: '',
    labResults: '',
    notes: '',
    files: []
  });
  const [isSavingRecord, setIsSavingRecord] = useState(false);

  // Helper function to get appointment date/time
  const getAppointmentDateTime = (apt) => {
    // If dateTime exists (old format), use it
    if (apt.dateTime) {
      return apt.dateTime?.toDate ? apt.dateTime.toDate() : new Date(apt.dateTime);
    }
    // If date and startTime exist (new format), combine them
    if (apt.date && apt.startTime) {
      const [hours, minutes] = apt.startTime.split(':');
      const dateObj = new Date(apt.date);
      dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return dateObj;
    }
    // Fallback to current date if nothing is available
    return new Date();
  };

  // Real-time listener for appointments of selected clinic
  const {
    docs: appointments = [],
    loading: appointmentsLoading,
    error: appointmentsError
  } = useCollection(
    selectedClinic ? 'appointments' : null,
    selectedClinic ? [where('clinicId', '==', selectedClinic.id)] : []
  );

  // Auto-update appointment statuses when dates pass
  useEffect(() => {
    if (!appointments || appointments.length === 0) return;

    const checkAndUpdateStatuses = async () => {
      const now = new Date();
      const appointmentsToUpdate = [];

      appointments.forEach(apt => {
        // Skip if already completed or cancelled
        if (apt.status === 'completed' || apt.status === 'cancelled') return;

        const aptDateTime = getAppointmentDateTime(apt);
        
        // If appointment date has passed and status is confirmed, mark as completed
        if (aptDateTime < now && apt.status === 'confirmed') {
          appointmentsToUpdate.push({
            id: apt.id,
            newStatus: 'completed'
          });
        }
      });

      // Update statuses in batch
      if (appointmentsToUpdate.length > 0) {
        console.log(`Auto-updating ${appointmentsToUpdate.length} past appointments to completed`);
        
        for (const apt of appointmentsToUpdate) {
          try {
            await completeAppointment(apt.id, {
              status: 'completed',
              completedAt: new Date().toISOString(),
              autoCompleted: true
            });
          } catch (error) {
            console.error(`Failed to auto-complete appointment ${apt.id}:`, error);
          }
        }
      }
    };

    // Check immediately
    checkAndUpdateStatuses();

    // Set up interval to check every 5 minutes
    const intervalId = setInterval(checkAndUpdateStatuses, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [appointments]);

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

  // Handle navigation from notifications - MOVED BEFORE LOADING CHECK
  useEffect(() => {
    if (location.state?.selectedClinicId && clinics.length > 0) {
      const clinic = clinics.find(c => c.id === location.state.selectedClinicId);
      
      if (clinic) {
        handleSelectClinic(clinic);
        
        // Apply filter if needed
        if (location.state.filterToday) {
          setDateFilter('today');
        }
        
        // Clear the state
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, clinics]);

  // Highlight specific appointment from notification - MOVED BEFORE LOADING CHECK
  useEffect(() => {
    if (location.state?.highlightAppointmentId && enrichedAppointments.length > 0) {
      const appointmentId = location.state.highlightAppointmentId;
      
      // Find and scroll to the appointment
      setTimeout(() => {
        const element = document.getElementById(`appointment-${appointmentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add temporary highlight effect
          element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
          element.style.transition = 'box-shadow 0.3s ease';
          
          setTimeout(() => {
            element.style.boxShadow = '';
          }, 2000);
        }
        
        // Clear the state
        window.history.replaceState({}, document.title);
      }, 500);
    }
  }, [location.state, enrichedAppointments]);

  const handleUpdateStatus = async (aptId, newStatus, appointment) => {
    try {
      // Use the new approveAppointment function if approving
      if (newStatus === 'confirmed' || newStatus === 'approved') {
        await approveAppointment(aptId);
        console.log(`Appointment ${aptId} approved with availability check`);
      } else {
        // Update appointment status for rejection
        await updateAppointment(aptId, { status: newStatus });
        console.log(`Appointment ${aptId} updated to ${newStatus}`);
      }
      
      // Send notification to pet owner
      const notificationTitle = newStatus === 'confirmed' 
        ? 'Appointment Confirmed' 
        : 'Appointment Rejected';
      
      const clinicName = selectedClinic.clinicName || selectedClinic.name;
      const appointmentDateTime = getAppointmentDateTime(appointment);
      const appointmentDate = formatShortDate(appointmentDateTime);
      const appointmentTime = appointment.startTime && appointment.endTime 
        ? `${appointment.startTime} - ${appointment.endTime}` 
        : formatTime(appointmentDateTime);
      
      const notificationBody = newStatus === 'confirmed'
        ? `Your appointment for ${appointment.petName} at ${clinicName} on ${appointmentDate} at ${appointmentTime} has been confirmed! ✅`
        : `Your appointment for ${appointment.petName} at ${clinicName} on ${appointmentDate} at ${appointmentTime} has been rejected. Please contact the clinic for more information. ❌`;

      try {
        await sendNotification({
          toUserId: appointment.ownerId,
          title: notificationTitle,
          body: notificationBody,
          appointmentId: aptId,
          data: {
            type: 'appointment_status',
            action: newStatus,
            clinicId: selectedClinic.id,
            clinicName: clinicName,
            petId: appointment.petId,
            petName: appointment.petName,
            status: newStatus,
            appointmentDate: appointmentDate,
            appointmentTime: appointmentTime
          }
        });
        console.log('✅ Notification sent to pet owner successfully');
      } catch (notifError) {
        console.error('❌ Failed to send notification:', notifError);
        // Don't fail the whole operation if notification fails
      }
    } catch (err) {
      console.error('Failed to update appointment status:', err);
      alert(`Failed to ${newStatus === 'confirmed' ? 'approve' : 'reject'} appointment. Please try again.`);
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
    setSelectedAppointmentForRecord(apt);
    setMedicalRecordData({
      diagnosis: '',
      treatment: '',
      prescriptions: '',
      labResults: '',
      notes: '',
      files: []
    });
    setShowMedicalRecordModal(true);
  };

  const handleSaveMedicalRecord = async () => {
    if (!selectedAppointmentForRecord) return;
    
    setIsSavingRecord(true);
    try {
      const { createMedicalRecord } = await import('../../firebase/firestoreHelpers');
      
      const recordData = {
        petId: selectedAppointmentForRecord.petId,
        ownerId: selectedAppointmentForRecord.ownerId,
        clinicId: selectedClinic.id,
        vetInCharge: userData?.fullName || userData?.displayName || '',
        diagnosis: medicalRecordData.diagnosis,
        treatment: medicalRecordData.treatment,
        prescriptions: medicalRecordData.prescriptions.split('\n').filter(p => p.trim()),
        labResults: medicalRecordData.labResults,
        notes: medicalRecordData.notes
      };

      await createMedicalRecord(selectedAppointmentForRecord.id, recordData);
      
      // Mark appointment as completed if not already
      if (selectedAppointmentForRecord.status !== 'completed') {
        await completeAppointment(selectedAppointmentForRecord.id, {
          status: 'completed',
          completedAt: new Date().toISOString()
        });
      }
      
      setShowMedicalRecordModal(false);
      setSelectedAppointmentForRecord(null);
      alert('Medical record created successfully!');
    } catch (error) {
      console.error('Failed to create medical record:', error);
      alert('Failed to create medical record. Please try again.');
    } finally {
      setIsSavingRecord(false);
    }
  };

  const handleExtendAppointment = (apt) => {
    setExtendingAppointment(apt);
    setShowExtendModal(true);
  };

  const handleManageWorkingHours = () => {
    if (selectedClinic) {
      setShowWorkingHoursModal(true);
    }
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
    const appointmentDate = getAppointmentDateTime(apt);
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
        const aptDate = getAppointmentDateTime(apt);
        return aptDate >= today && aptDate < tomorrow;
      });
    } else if (dateFilter === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      
      filtered = filtered.filter(apt => {
        const aptDate = getAppointmentDateTime(apt);
        return aptDate >= tomorrow && aptDate < dayAfter;
      });
    } else if (dateFilter === 'custom' && customDateStart && customDateEnd) {
      const start = new Date(customDateStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customDateEnd);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(apt => {
        const aptDate = getAppointmentDateTime(apt);
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
      const dateA = getAppointmentDateTime(a);
      const dateB = getAppointmentDateTime(b);
      return dateB - dateA;
    });

    return filtered;
  };

  // Group appointments by date
  const groupAppointmentsByDate = (appointments) => {
    const groups = {};
    
    appointments.forEach(apt => {
      const date = getAppointmentDateTime(apt);
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

  // Store appointment counts for each clinic
  const [clinicAppointmentCounts, setClinicAppointmentCounts] = useState({});

  // Fetch appointment counts for all clinics
  useEffect(() => {
    const fetchAppointmentCounts = async () => {
      if (clinics.length === 0) return;

      const counts = {};
      
      for (const clinic of clinics) {
        try {
          const appointmentsQuery = firestoreQuery(
            collection(db, 'appointments'),
            where('clinicId', '==', clinic.id)
          );
          const appointmentsSnapshot = await getDocs(appointmentsQuery);
          
          const allAppointments = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const pendingCount = allAppointments.filter(apt => apt.status === 'pending').length;
          
          counts[clinic.id] = {
            pending: pendingCount,
            total: allAppointments.length
          };
        } catch (error) {
          console.error(`Error fetching appointments for clinic ${clinic.id}:`, error);
          counts[clinic.id] = { pending: 0, total: 0 };
        }
      }
      
      setClinicAppointmentCounts(counts);
    };

    fetchAppointmentCounts();
  }, [clinics]);

  // Calculate stats for each clinic
  const getClinicStats = (clinicId) => {
    return clinicAppointmentCounts[clinicId] || { pending: 0, total: 0 };
  };

  // Loading state - NOW AFTER ALL HOOKS
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
              {/* Enhanced Clinic Selection Header */}
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '24px 28px',
                marginBottom: '24px',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.25)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  right: '-10%',
                  width: '300px',
                  height: '300px',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
                  borderRadius: '50%'
                }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}>
                    <Calendar size={28} color="white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h1 style={{ 
                      fontSize: '1.75rem', 
                      fontWeight: 700, 
                      color: 'white', 
                      margin: '0 0 4px 0',
                      letterSpacing: '-0.02em'
                    }}>
                      Select a Clinic
                    </h1>
                    <p style={{ fontSize: '0.9375rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                      Choose a clinic to view and manage its appointments
                    </p>
                  </div>
                </div>
              </div>

              {clinics.length === 0 ? (
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '60px 40px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <Building2 size={48} color="#6366f1" strokeWidth={2} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>No Clinics Found</h3>
                  <p style={{ fontSize: '0.9375rem', color: '#64748b', margin: '0 0 24px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>Please register your clinic first to manage appointments.</p>
                  <button
                    onClick={() => window.location.href = '/clinic/management'}
                    style={{
                      padding: '12px 28px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                    }}
                  >
                    <Building2 size={18} strokeWidth={2.5} />
                    Register Clinic
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                  {clinics.map(clinic => {
                    const stats = getClinicStats(clinic.id);
                    return (
                      <div
                        key={clinic.id}
                        onClick={() => handleSelectClinic(clinic)}
                        style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '20px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          border: '1px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.borderColor = '#6366f1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                      >
                        {/* Header Section */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
                          <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                          }}>
                            <Building2 size={32} color="white" strokeWidth={2.5} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{
                              fontSize: '1.125rem',
                              fontWeight: 700,
                              color: '#1e293b',
                              marginBottom: '6px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {clinic.clinicName || clinic.name}
                            </h3>
                            <p style={{
                              fontSize: '0.8125rem',
                              color: '#64748b',
                              margin: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              <MapPin size={14} color="#64748b" strokeWidth={2.5} />
                              <span>{clinic.address || 'No address'}</span>
                            </p>
                          </div>
                          <ChevronRight size={24} color="#6366f1" strokeWidth={2.5} />
                        </div>

                        {/* Stats Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '14px', 
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                            borderRadius: '12px',
                            border: '1px solid #fbbf24'
                          }}>
                            <p style={{ fontSize: '0.6875rem', color: '#78350f', margin: '0 0 4px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending</p>
                            <p style={{ fontSize: '1.75rem', color: '#92400e', margin: 0, fontWeight: 700, lineHeight: 1 }}>{stats.pending}</p>
                          </div>
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '14px', 
                            background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', 
                            borderRadius: '12px',
                            border: '1px solid #818cf8'
                          }}>
                            <p style={{ fontSize: '0.6875rem', color: '#3730a3', margin: '0 0 4px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</p>
                            <p style={{ fontSize: '1.75rem', color: '#4338ca', margin: 0, fontWeight: 700, lineHeight: 1 }}>{stats.total}</p>
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

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                        {selectedClinic.clinicName || selectedClinic.name}
                      </h1>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                        Appointment Management
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleManageWorkingHours}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                    }}
                  >
                    <Settings size={18} />
                    Manage Working Hours
                  </button>
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
                        <div 
                          key={apt.id} 
                          id={`appointment-${apt.id}`}
                          style={{
                            background: 'white',
                            padding: '24px',
                            borderRadius: '12px',
                            border: '2px solid #e2e8f0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '20px',
                            transition: 'box-shadow 0.3s ease'
                          }}
                        >
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
                                  <strong>Time:</strong> {apt.startTime && apt.endTime ? `${apt.startTime} - ${apt.endTime}` : apt.dateTime ? formatTime(apt.dateTime) : 'N/A'}
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
                                  background: 'var(--vc-success)',
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
                                onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--vc-success)'}
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
                                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
                                onClick={() => handleExtendAppointment(apt)}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}
                                >
                                  <ArrowRightLeft size={16} />
                                  Extend
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
                                  background: 'var(--vc-success)', 
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

      {/* Working Hours Modal */}
      <WorkingHoursModal
        isOpen={showWorkingHoursModal}
        onClose={() => setShowWorkingHoursModal(false)}
        clinicId={selectedClinic?.id}
        clinicName={selectedClinic?.clinicName || selectedClinic?.name}
      />

      {/* Extend Appointment Modal */}
      <ExtendAppointmentModal
        isOpen={showExtendModal}
        onClose={() => {
          setShowExtendModal(false);
          setExtendingAppointment(null);
        }}
        appointment={extendingAppointment}
      />

      {/* Medical Record Creation Modal */}
      {showMedicalRecordModal && selectedAppointmentForRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflowY: 'auto'
        }} onClick={() => !isSavingRecord && setShowMedicalRecordModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '24px 28px',
              borderRadius: '16px 16px 0 0'
            }}>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>
                Create Medical Record
              </h2>
              <p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '0.9375rem' }}>
                For {selectedAppointmentForRecord.petName} - {selectedAppointmentForRecord.ownerName}
              </p>
            </div>

            {/* Content */}
            <div style={{ padding: '32px' }}>
              
              {/* Diagnosis */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Diagnosis <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={medicalRecordData.diagnosis}
                  onChange={(e) => setMedicalRecordData({...medicalRecordData, diagnosis: e.target.value})}
                  placeholder="Enter diagnosis details..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    resize: 'vertical'
                  }}
                  disabled={isSavingRecord}
                />
              </div>

              {/* Treatment */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Treatment Provided <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={medicalRecordData.treatment}
                  onChange={(e) => setMedicalRecordData({...medicalRecordData, treatment: e.target.value})}
                  placeholder="Describe the treatment provided..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    resize: 'vertical'
                  }}
                  disabled={isSavingRecord}
                />
              </div>

              {/* Prescriptions */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Prescriptions (one per line)
                </label>
                <textarea
                  value={medicalRecordData.prescriptions}
                  onChange={(e) => setMedicalRecordData({...medicalRecordData, prescriptions: e.target.value})}
                  placeholder="e.g., Amoxicillin 500mg - 2x daily for 7 days"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    resize: 'vertical'
                  }}
                  disabled={isSavingRecord}
                />
              </div>

              {/* Lab Results */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Lab Results (if any)
                </label>
                <textarea
                  value={medicalRecordData.labResults}
                  onChange={(e) => setMedicalRecordData({...medicalRecordData, labResults: e.target.value})}
                  placeholder="Enter lab test results..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    resize: 'vertical'
                  }}
                  disabled={isSavingRecord}
                />
              </div>

              {/* Additional Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Additional Notes
                </label>
                <textarea
                  value={medicalRecordData.notes}
                  onChange={(e) => setMedicalRecordData({...medicalRecordData, notes: e.target.value})}
                  placeholder="Any additional notes or recommendations..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    resize: 'vertical'
                  }}
                  disabled={isSavingRecord}
                />
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowMedicalRecordModal(false)}
                  disabled={isSavingRecord}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    background: 'white',
                    color: '#6b7280',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: isSavingRecord ? 'not-allowed' : 'pointer',
                    opacity: isSavingRecord ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMedicalRecord}
                  disabled={isSavingRecord || !medicalRecordData.diagnosis || !medicalRecordData.treatment}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: (isSavingRecord || !medicalRecordData.diagnosis || !medicalRecordData.treatment) ? 'not-allowed' : 'pointer',
                    opacity: (isSavingRecord || !medicalRecordData.diagnosis || !medicalRecordData.treatment) ? 0.5 : 1
                  }}
                >
                  {isSavingRecord ? 'Saving...' : 'Create Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}