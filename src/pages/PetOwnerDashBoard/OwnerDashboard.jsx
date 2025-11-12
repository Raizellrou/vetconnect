import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Map, MapPin, Calendar, Clock, MessageSquare } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import AppointmentStatusLegend from '../../components/AppointmentStatusLegend';
import AppointmentCard from '../../components/AppointmentCard';
import AppointmentDetailsCard from '../../components/AppointmentDetailsCard';
import RatingCommentForm from '../../components/RatingCommentForm';
import EditAppointmentForm from '../../components/EditAppointmentForm';
import styles from '../../styles/Dashboard.module.css';

const VIEW_STATES = {
  APPOINTMENT_LIST: 'list',
  VIEW_DETAILS: 'detail',
  RATING_FORM: 'rating',
  EDIT_FORM: 'edit'
};

export default function OwnerDashboard() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const [viewState, setViewState] = useState(VIEW_STATES.APPOINTMENT_LIST);
  const [showInstructions, setShowInstructions] = useState(false);

  const [appointments, setAppointments] = useState([
    {
      id: 'a1',
      clinicName: 'Animal Care Clinic',
      petName: 'Max',
      petType: 'Dog',
      petBreed: 'Beagle',
      symptoms: 'Coughing, low energy',
      date: 'Nov 3, 2025',
      time: '10:00 AM',
      status: 'ready'
    },
    {
      id: 'a2',
      clinicName: 'Pet Wellness Center',
      petName: 'Luna',
      petType: 'Cat',
      petBreed: 'Siamese',
      symptoms: 'Itching',
      date: 'Nov 5, 2025',
      time: '2:30 PM',
      status: 'pending'
    },
    {
      id: 'a3',
      clinicName: 'Vet Partners',
      petName: 'Charlie',
      petType: 'Dog',
      petBreed: 'Labrador',
      symptoms: 'Annual checkup',
      date: 'Nov 1, 2025',
      time: '11:15 AM',
      status: 'finished'
    }
  ]);

  const [selected, setSelected] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!userData) return <p>Loading...</p>;

  const displayName = userData.fullName || userData.displayName || userData.email;

  const handleCardClick = (id) => {
    const appt = appointments.find((a) => a.id === id);
    setSelected(appt);
    if (!appt) return;
    if (appt.status === 'finished') setViewState(VIEW_STATES.RATING_FORM);
    else setViewState(VIEW_STATES.VIEW_DETAILS);
  };

  const handleEdit = (id) => {
    const appt = appointments.find((a) => a.id === id);
    setSelected(appt);
    setViewState(VIEW_STATES.EDIT_FORM);
  };

  const handleDelete = (id) => {
    setAppointments((prev) => prev.filter((p) => p.id !== id));
    setViewState(VIEW_STATES.APPOINTMENT_LIST);
  };

  const handleSaveEdit = (form) => {
    setAppointments((prev) => prev.map((p) => (p.id === selected.id ? { ...p, petName: form.pet, symptoms: form.symptoms, date: form.date, time: form.time } : p)));
    setViewState(VIEW_STATES.VIEW_DETAILS);
  };

  const handleDoneRating = ({ rating, comment }) => {
    console.log('rating', rating, 'comment', comment);
    setViewState(VIEW_STATES.APPOINTMENT_LIST);
  };

  const rejectedLabel = 
    viewState === VIEW_STATES.VIEW_DETAILS || viewState === VIEW_STATES.EDIT_FORM 
      ? 'Not Ready' 
      : 'Rejected';
  const pendingLabel = 
    viewState === VIEW_STATES.RATING_FORM || 
    viewState === VIEW_STATES.VIEW_DETAILS || 
    viewState === VIEW_STATES.EDIT_FORM
      ? 'For Approval' 
      : 'Pending';

  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        <main className={styles.mainContent}>
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

          {/* ── CLEAN HEADER (no button) ────────────────────────────────────────── */}
          <h1 className={styles.welcomeTitle}>Hello, {displayName}!</h1>
          {/* ─────────────────────────────────────────────────────────────────────── */}

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
          <h2 className={styles.sectionTitle}>Appointments</h2>

          <AppointmentStatusLegend rejectedLabel={rejectedLabel} pendingLabel={pendingLabel} />

          <div className={styles.divider} />

          {viewState === VIEW_STATES.APPOINTMENT_LIST && (
              <div className={styles.appointmentList}>
                {appointments.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    id={a.id}
                    clinicName={a.clinicName}
                    petName={a.petName}
                    date={a.date}
                    time={a.time}
                    status={a.status}
                    onClick={() => handleCardClick(a.id)}
                    onEditClick={() => handleEdit(a.id)}
                    onRateClick={() => {
                      setSelected(a);
                      setViewState(VIEW_STATES.RATING_FORM);
                    }}
                    onDeleteClick={() => handleDelete(a.id)}
                  />
                ))}
              </div>
            )}

            {viewState === VIEW_STATES.VIEW_DETAILS && selected && (
              <AppointmentDetailsCard
                appointment={selected}
                onEdit={() => handleEdit(selected.id)}
                onDelete={() => handleDelete(selected.id)}
              />
            )}

            {viewState === VIEW_STATES.RATING_FORM && selected && (
              <RatingCommentForm onDone={handleDoneRating} />
            )}

            {viewState === VIEW_STATES.EDIT_FORM && selected && (
              <EditAppointmentForm
                appointment={selected}
                onSave={handleSaveEdit}
                onCancel={() => setViewState(VIEW_STATES.VIEW_DETAILS)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className={styles.modalOverlay} onClick={() => setShowInstructions(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>How to Use VetConnect</h2>
              <button 
                className={styles.modalCloseBtn}
                onClick={() => setShowInstructions(false)}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalIntro}>
                Welcome to VetConnect! Follow these simple steps to book and manage your pet's appointments:
              </p>

              <div className={styles.instructionsList}>
                <div className={styles.instructionStep}>
                  <div className={styles.stepNumber}>
                    <Map size={24} />
                  </div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>1. Go to the Map</h3>
                    <p className={styles.stepDescription}>
                      Access the map feature from the sidebar to view all nearby veterinary clinics in your area.
                    </p>
                  </div>
                </div>

                <div className={styles.instructionStep}>
                  <div className={styles.stepNumber}>
                    <MapPin size={24} />
                  </div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>2. Locate a Clinic</h3>
                    <p className={styles.stepDescription}>
                      Browse through the available clinics and select your preferred veterinary clinic from the options shown.
                    </p>
                  </div>
                </div>

                <div className={styles.instructionStep}>
                  <div className={styles.stepNumber}>
                    <Calendar size={24} />
                  </div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>3. Book an Appointment</h3>
                    <p className={styles.stepDescription}>
                      Choose a date and time that fits your schedule, provide your pet's information and symptoms.
                    </p>
                  </div>
                </div>

                <div className={styles.instructionStep}>
                  <div className={styles.stepNumber}>
                    <Clock size={24} />
                  </div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>4. Wait for Approval</h3>
                    <p className={styles.stepDescription}>
                      The clinic will review and confirm your appointment request. You'll see the status update on your dashboard.
                    </p>
                  </div>
                </div>

                <div className={styles.instructionStep}>
                  <div className={styles.stepNumber}>
                    <MessageSquare size={24} />
                  </div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>5. After the Appointment</h3>
                    <p className={styles.stepDescription}>
                      Share your experience by leaving a comment and rating to help other pet owners make informed decisions.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  className={styles.modalCloseButton}
                  onClick={() => setShowInstructions(false)}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}