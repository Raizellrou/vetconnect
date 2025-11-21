import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import AppointmentStatusLegend from '../../components/AppointmentStatusLegend';
import AppointmentCard from '../../components/AppointmentCard';
import AppointmentDetailsCard from '../../components/AppointmentDetailsCard';
import RatingCommentForm from '../../components/RatingCommentForm';
import CancelAppointmentDialog from '../../components/CancelAppointmentDialog';
import AppointmentFilters from '../../components/filters/AppointmentFilters';
import FilterResultsSummary from '../../components/filters/FilterResultsSummary';
import EmptyAppointmentsState from '../../components/states/EmptyAppointmentsState';
import LoadingState from '../../components/states/LoadingState';
import ErrorState from '../../components/states/ErrorState';
import InstructionsModal from '../../components/modals/InstructionsModal';
import SuccessMessage from '../../components/messages/SuccessMessage';
import styles from '../../styles/Dashboard.module.css';
import { useCollection } from '../../hooks/useCollection';
import { where, deleteDoc, doc } from 'firebase/firestore';
import { formatShortDate, formatTime } from '../../utils/dateUtils';
import { collection, getDocs, query as firestoreQuery } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { cancelAppointment, updateAppointment } from '../../lib/firebaseMutations';
import { addReview, sendNotification } from '../../firebase/firestoreHelpers';
import { useAppointmentFilters } from '../../hooks/useAppointmentFilters';
import { checkAndSendReminders, clearOldReminderFlags } from '../../utils/appointmentReminders';

const VIEW_STATES = {
  APPOINTMENT_LIST: 'list',
  VIEW_DETAILS: 'detail',
  RATING_FORM: 'rating'
};

export default function OwnerDashboard() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [viewState, setViewState] = useState(VIEW_STATES.APPOINTMENT_LIST);
  const [showInstructions, setShowInstructions] = useState(false);
  const [selected, setSelected] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [pets, setPets] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Delete appointment state
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use custom hook for filtering
  const {
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    customDateStart,
    setCustomDateStart,
    customDateEnd,
    setCustomDateEnd,
    searchQuery,
    setSearchQuery,
    clearFilters,
    hasActiveFilters
  } = useAppointmentFilters();

  // Real-time listener for appointments
  const {
    docs: appointments = [],
    loading: appointmentsLoading,
    error: appointmentsError
  } = useCollection(
    currentUser?.uid ? 'appointments' : null,
    currentUser?.uid ? [where('ownerId', '==', currentUser.uid)] : []
  );

  // Load success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // Load pets and clinics for display
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setDataLoading(true);
        
        // Fetch pets
        const petsQuery = firestoreQuery(
          collection(db, 'users', currentUser.uid, 'pets')
        );
        const petsSnapshot = await getDocs(petsQuery);
        const petsData = petsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setPets(petsData);

        // Fetch clinics
        const clinicsSnapshot = await getDocs(collection(db, 'clinics'));
        const clinicsData = clinicsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setClinics(clinicsData);
        
        console.log('Fetched pets:', petsData);
        console.log('Fetched clinics:', clinicsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Check for appointment reminders on load
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    // Clear old reminder flags
    clearOldReminderFlags();
    
    // Check and send reminders
    checkAndSendReminders(currentUser.uid, 'petOwner');
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  // Helper functions
  const getPetName = (petId) => pets.find(p => p.id === petId)?.name || 'Unknown Pet';
  const getClinicName = (clinicId) => clinics.find(c => c.id === clinicId)?.clinicName || clinics.find(c => c.id === clinicId)?.name || 'Unknown Clinic';

  // Event handlers
  const handleCardClick = (appointment) => {
    setSelected(appointment);
    setViewState(VIEW_STATES.VIEW_DETAILS);
  };

  const handleCancelClick = (appointment) => setAppointmentToCancel(appointment);

  const handleConfirmCancel = async (reason) => {
    if (!appointmentToCancel) return;
    
    setIsCancelling(true);
    try {
      await cancelAppointment(appointmentToCancel.id, reason);
      
      // Send notification to clinic owner
      const clinic = clinics.find(c => c.id === appointmentToCancel.clinicId);
      if (clinic?.ownerId) {
        const petName = getPetName(appointmentToCancel.petId);
        const clinicName = getClinicName(appointmentToCancel.clinicId);
        
        await sendNotification({
          toUserId: clinic.ownerId,
          title: 'Appointment Cancelled',
          body: `Appointment for ${petName} has been cancelled by the pet owner${reason ? `: ${reason}` : ''}`,
          appointmentId: appointmentToCancel.id,
          data: {
            petName,
            clinicName,
            reason: reason || 'No reason provided'
          }
        });
      }
      
      setAppointmentToCancel(null);
      setSuccessMessage('Appointment cancelled successfully');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDoneRating = async ({ rating, comment }) => {
    if (!selected || !currentUser?.uid || selected.hasReview) {
      if (selected.hasReview) alert('You have already reviewed this appointment.');
      setViewState(VIEW_STATES.APPOINTMENT_LIST);
      return;
    }
    
    setIsSubmittingReview(true);
    try {
      await addReview(currentUser.uid, selected.clinicId, {
        rating,
        comment,
        appointmentId: selected.id
      });

      await updateAppointment(selected.id, { 
        hasReview: true,
        reviewedAt: new Date()
      });

      setSuccessMessage('Thank you for your review!');
      setViewState(VIEW_STATES.APPOINTMENT_LIST);
      setSelected(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteClick = (appointment) => setAppointmentToDelete(appointment);

  const handleConfirmDelete = async () => {
    if (!appointmentToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'appointments', appointmentToDelete.id));
      setAppointmentToDelete(null);
      setSuccessMessage('Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter appointments
  const getFilteredAppointments = () => {
    let filtered = [...appointments].filter(apt => apt.status !== 'cancelled');

    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filtered = filtered.filter(apt => {
        const aptDate = apt.dateTime?.toDate ? apt.dateTime.toDate() : new Date(apt.dateTime);
        return aptDate >= today && aptDate < tomorrow;
      });
    } else if (dateFilter === 'upcoming') {
      const now = new Date();
      filtered = filtered.filter(apt => {
        const aptDate = apt.dateTime?.toDate ? apt.dateTime.toDate() : new Date(apt.dateTime);
        return aptDate > now;
      });
    } else if (dateFilter === 'past') {
      const now = new Date();
      filtered = filtered.filter(apt => {
        const aptDate = apt.dateTime?.toDate ? apt.dateTime.toDate() : new Date(apt.dateTime);
        return aptDate < now;
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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt => 
        getClinicName(apt.clinicId).toLowerCase().includes(query) ||
        getPetName(apt.petId).toLowerCase().includes(query) ||
        apt.meta?.reason?.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const dateA = a.dateTime?.toDate ? a.dateTime.toDate() : new Date(a.dateTime);
      const dateB = b.dateTime?.toDate ? b.dateTime.toDate() : new Date(b.dateTime);
      return dateB - dateA;
    });

    return filtered;
  };

  const filteredAppointments = getFilteredAppointments();

  // Handle navigation from notifications
  useEffect(() => {
    if (location.state?.viewAppointmentId && location.state?.openDetails) {
      // Find the appointment by ID
      const appointment = appointments.find(apt => apt.id === location.state.viewAppointmentId);
      
      if (appointment) {
        setSelected(appointment);
        setViewState(VIEW_STATES.VIEW_DETAILS);
        
        // Clear the state to prevent reopening on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, appointments]);

  if (!userData) return <LoadingState message="Loading user data..." />;

  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        <main className={styles.mainContent}>
          <SuccessMessage message={successMessage} />

          <div className={styles.welcomeBanner}>
            <div className={styles.bannerMeta}>
              <span>Home</span>
              <span className={styles.bulletPoint}>•</span>
              <span className={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <h1 className={styles.welcomeTitle}>Hello, {displayName}!</h1>

            <p className={styles.welcomeSubtitle}>
              <button 
                onClick={() => setShowInstructions(true)}
                className={styles.instructionsLink}
              >
                Instructions: How to Use VetConnect
              </button>
            </p>
          </div>

          <div className={styles.appointmentSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 className={styles.sectionTitle}>Appointments</h2>
              <button
                onClick={() => navigate('/map')}
                style={{
                  padding: '10px 18px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.25)';
                }}
              >
                <Calendar size={16} strokeWidth={2.5} />
                <span>Find Clinic & Book</span>
              </button>
            </div>

            <AppointmentStatusLegend />

            {/* Filters */}
            {!appointmentsLoading && !dataLoading && appointments.length > 0 && viewState === VIEW_STATES.APPOINTMENT_LIST && (
              <>
                <AppointmentFilters
                  statusFilter={statusFilter}
                  dateFilter={dateFilter}
                  searchQuery={searchQuery}
                  customDateStart={customDateStart}
                  customDateEnd={customDateEnd}
                  onStatusChange={setStatusFilter}
                  onDateFilterChange={setDateFilter}
                  onSearchChange={setSearchQuery}
                  onCustomDateStartChange={setCustomDateStart}
                  onCustomDateEndChange={setCustomDateEnd}
                  onClearFilters={clearFilters}
                  showClearButton={hasActiveFilters}
                />

                <FilterResultsSummary
                  filteredCount={filteredAppointments.length}
                  totalCount={appointments.filter(apt => apt.status !== 'cancelled').length}
                  showClearButton={hasActiveFilters}
                  onClearFilters={clearFilters}
                />
              </>
            )}

            <div className={styles.divider} />

            {/* States */}
            {(appointmentsLoading || dataLoading) && <LoadingState message="Loading appointments..." />}
            {appointmentsError && <ErrorState title="Error Loading Appointments" message={appointmentsError.message || 'Please try refreshing the page'} />}
            {!appointmentsLoading && !dataLoading && !appointmentsError && appointments.length === 0 && <EmptyAppointmentsState />}

            {/* Appointments List */}
            {!appointmentsLoading && !dataLoading && !appointmentsError && viewState === VIEW_STATES.APPOINTMENT_LIST && appointments.length > 0 && (
              <div className={styles.appointmentList}>
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    id={appointment.id}
                    clinicName={getClinicName(appointment.clinicId)}
                    petName={getPetName(appointment.petId)}
                    date={formatShortDate(appointment.dateTime)}
                    time={formatTime(appointment.dateTime)}
                    status={appointment.status}
                    hasReview={appointment.hasReview}
                    onClick={() => handleCardClick(appointment)}
                    onCancelClick={() => handleCancelClick(appointment)}
                    onDeleteClick={appointment.status === 'rejected' ? () => handleDeleteClick(appointment) : undefined}
                    onRateClick={appointment.status === 'completed' && !appointment.hasReview ? () => {
                      setSelected(appointment);
                      setViewState(VIEW_STATES.RATING_FORM);
                    } : undefined}
                    onViewClick={() => {
                      setSelected(appointment);
                      setViewState(VIEW_STATES.VIEW_DETAILS);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Detail Views */}
            {viewState === VIEW_STATES.VIEW_DETAILS && selected && (
              <AppointmentDetailsCard
                appointment={{
                  ...selected,
                  clinicName: getClinicName(selected.clinicId),
                  petName: getPetName(selected.petId),
                  date: formatShortDate(selected.dateTime),
                  time: formatTime(selected.dateTime),
                  symptoms: selected.meta?.reason || 'N/A',
                  hasReview: selected.hasReview
                }}
                onBack={() => setViewState(VIEW_STATES.APPOINTMENT_LIST)}
                onRate={() => setViewState(VIEW_STATES.RATING_FORM)}
              />
            )}

            {viewState === VIEW_STATES.RATING_FORM && selected && (
              <RatingCommentForm 
                clinicId={selected.clinicId}
                appointmentId={selected.id}
                onDone={handleDoneRating}
                isSubmitting={isSubmittingReview}
              />
            )}
          </div>
        </main>
      </div>

      <InstructionsModal isOpen={showInstructions} onClose={() => setShowInstructions(false)} />

      {appointmentToCancel && (
        <CancelAppointmentDialog
          appointment={{
            ...appointmentToCancel,
            clinicName: getClinicName(appointmentToCancel.clinicId),
            petName: getPetName(appointmentToCancel.petId)
          }}
          onConfirm={handleConfirmCancel}
          onCancel={() => setAppointmentToCancel(null)}
          isLoading={isCancelling}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {appointmentToDelete && (
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
        onClick={() => !isDeleting && setAppointmentToDelete(null)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
          }}
          onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#1e293b' }}>
              Delete Rejected Appointment
            </h3>
            
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete this rejected appointment for <strong>{getPetName(appointmentToDelete.petId)}</strong> at <strong>{getClinicName(appointmentToDelete.clinicId)}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => !isDeleting && setAppointmentToDelete(null)}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '10px 24px',
                  background: isDeleting ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}