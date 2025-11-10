import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import AppointmentStatusLegend from '../../components/AppointmentStatusLegend';
import AppointmentCard from '../../components/AppointmentCard';
import AppointmentDetailsCard from '../../components/AppointmentDetailsCard';
import RatingCommentForm from '../../components/RatingCommentForm';
import EditAppointmentForm from '../../components/EditAppointmentForm';
import styles from '../../styles/Dashboard.module.css';

// View state constants
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
          <h1 className={styles.welcomeTitle}>Hello, {displayName}!</h1>
          <p className={styles.welcomeSubtitle}>Instructions How to use Vetconnect</p>
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
    </div>
  );
}