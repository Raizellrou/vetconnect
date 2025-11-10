import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkX } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import UnsaveDialog from '../../components/UnsaveDialog';
import { useAuth } from '../../contexts/AuthContext';
import { removeBookmark } from '../../firebase/firestoreHelpers';
import styles from '../../styles/SavedClinics.module.css';

function SavedClinicsList() {
  const { userData } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.email;
  const navigate = useNavigate();
  
  const [clinicToUnsave, setClinicToUnsave] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedClinics, setSavedClinics] = useState([
    { id: 'p1', name: 'PaoPaws Clinic', location: 'Brgy. 7B, Laoag City' },
    { id: 'p2', name: 'Maxwell Clinic', location: 'Brgy. 4, Laoag City' }
  ]);

  const handleUnsave = (e, clinic) => {
    e.stopPropagation();
    setError(null);
    setClinicToUnsave(clinic);
  };

  const handleConfirmUnsave = async () => {
    if (!clinicToUnsave || !userData?.uid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await removeBookmark(userData.uid, clinicToUnsave.id);
      setSavedClinics(prev => prev.filter(c => c.id !== clinicToUnsave.id));
    } catch (err) {
      console.error('Error unsaving clinic:', err);
      setError('Failed to unsave clinic. Please try again.');
    } finally {
      setIsLoading(false);
      setClinicToUnsave(null);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        <main className={styles.page}>
          <header className={styles.headerRow}>
            <h2 className={styles.title}>Saved</h2>
            <div className={styles.subtitle}>Date Today</div>
          </header>

          <section className={styles.listCard}>
            <h3 className={styles.sectionLabel}>Clinics</h3>
            <div className={styles.listTableHeader}>
              <div>Clinic Name</div>
              <div>Location</div>
            </div>

            <div className={styles.list}>
              {savedClinics.map((c) => (
                <div
                  role="button"
                  tabIndex={0}
                  key={c.id}
                  className={styles.listRow}
                  onClick={() => navigate(`/saved/${c.id}`)}
                >
                  <div className={styles.rowName}>{c.name}</div>
                  <div className={styles.rowLocation}>{c.location}</div>
                  <button
                    className={styles.rowAction}
                    onClick={(e) => handleUnsave(e, c)}
                    aria-label={`Unsave ${c.name}`}
                  >
                    <BookmarkX size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
      {clinicToUnsave && (
        <UnsaveDialog
          clinic={clinicToUnsave}
          onConfirm={handleConfirmUnsave}
          onCancel={() => setClinicToUnsave(null)}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  );
}

export default SavedClinicsList;