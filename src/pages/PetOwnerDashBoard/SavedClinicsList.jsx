import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkX, MapPin, Loader, AlertCircle } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import UnsaveDialog from '../../components/UnsaveDialog';
import { useAuth } from '../../contexts/AuthContext';
import { removeBookmark } from '../../firebase/firestoreHelpers';
import { useCollection } from '../../hooks/useCollection';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import styles from '../../styles/SavedClinics.module.css';

function SavedClinicsList() {
  const { userData, currentUser } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.email;
  const navigate = useNavigate();
  
  const [clinicToUnsave, setClinicToUnsave] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enrichedClinics, setEnrichedClinics] = useState([]);
  const [enriching, setEnriching] = useState(false);

  // Real-time bookmarks listener
  const {
    docs: bookmarks = [],
    loading: bookmarksLoading,
    error: bookmarksError
  } = useCollection(
    currentUser?.uid ? `users/${currentUser.uid}/bookmarks` : null
  );

  // Enrich bookmarks with clinic details
  useEffect(() => {
    const enrichBookmarks = async () => {
      if (!bookmarks || bookmarks.length === 0) {
        setEnrichedClinics([]);
        return;
      }

      setEnriching(true);
      
      try {
        const enriched = await Promise.all(
          bookmarks.map(async (bookmark) => {
            try {
              // Fetch full clinic details from Firestore
              const clinicRef = doc(db, 'clinics', bookmark.clinicId);
              const clinicSnap = await getDoc(clinicRef);
              
              if (clinicSnap.exists()) {
                const clinicData = clinicSnap.data();
                
                return {
                  id: clinicSnap.id,
                  ...clinicData,
                  bookmarkedAt: bookmark.createdAt || bookmark.bookmarkedAt
                };
              } else {
                // Fallback to bookmark metadata
                return {
                  id: bookmark.clinicId,
                  name: bookmark.clinicName || 'Unknown Clinic',
                  clinicName: bookmark.clinicName || 'Unknown Clinic',
                  address: bookmark.address || 'Address not available',
                  bookmarkedAt: bookmark.createdAt || bookmark.bookmarkedAt
                };
              }
            } catch (err) {
              console.error('Failed to fetch clinic details for', bookmark.clinicId, ':', err);
              
              return {
                id: bookmark.clinicId,
                name: bookmark.clinicName || 'Unknown Clinic',
                clinicName: bookmark.clinicName || 'Unknown Clinic',
                address: bookmark.address || 'Address not available',
                bookmarkedAt: bookmark.createdAt || bookmark.bookmarkedAt
              };
            }
          })
        );

        // Sort by bookmarked date (newest first)
        enriched.sort((a, b) => {
          const dateA = a.bookmarkedAt?.toDate ? a.bookmarkedAt.toDate() : new Date(0);
          const dateB = b.bookmarkedAt?.toDate ? b.bookmarkedAt.toDate() : new Date(0);
          return dateB - dateA;
        });

        setEnrichedClinics(enriched);
      } catch (err) {
        console.error('Error enriching bookmarks:', err);
        setError('Failed to load clinic details');
      } finally {
        setEnriching(false);
      }
    };

    enrichBookmarks();
  }, [bookmarks]);

  const handleUnsave = (e, clinic) => {
    e.stopPropagation();
    setError(null);
    setClinicToUnsave(clinic);
  };

  const handleConfirmUnsave = async () => {
    if (!clinicToUnsave || !currentUser?.uid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await removeBookmark(currentUser.uid, clinicToUnsave.id);
      // No need to update state - real-time listener handles it
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
            <h2 className={styles.title}>Saved Clinics</h2>
          </header>

          {/* Error State */}
          {(bookmarksError || error) && (
            <div style={{ 
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
              padding: '20px 24px', 
              borderRadius: '14px', 
              border: '2px solid #f87171', 
              marginBottom: '24px',
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px' 
            }}>
              <AlertCircle size={24} color="#dc2626" />
              <div>
                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#991b1b' }}>Error Loading Saved Clinics</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#b91c1c' }}>
                  {bookmarksError?.message || error || 'Please try refreshing the page'}
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {(bookmarksLoading || enriching) && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Loader size={48} color="#818cf8" className="animate-spin" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
                {bookmarksLoading ? 'Loading saved clinics...' : 'Loading clinic details...'}
              </p>
            </div>
          )}

          {/* Empty State */}
          {!bookmarksLoading && !enriching && enrichedClinics.length === 0 && (
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
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                borderRadius: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px' 
              }}>
                <MapPin size={56} color="#f59e0b" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>
                No saved clinics yet
              </h3>
              <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                Browse the map and save your favorite veterinary clinics for quick access
              </p>
              <button
                onClick={() => navigate('/map')}
                style={{ 
                  padding: '14px 32px', 
                  background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  boxShadow: '0 4px 12px rgba(129, 140, 248, 0.4)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(129, 140, 248, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(129, 140, 248, 0.4)';
                }}
              >
                <MapPin size={20} />
                Browse Clinics
              </button>
            </div>
          )}

          {/* Clinics List */}
          {!bookmarksLoading && !enriching && enrichedClinics.length > 0 && (
            <section className={styles.listCard}>
              <h3 className={styles.sectionLabel}>
                Your Saved Clinics ({enrichedClinics.length})
              </h3>
              <div className={styles.listTableHeader}>
                <div>Clinic Name</div>
                <div>Location</div>
              </div>

              <div className={styles.list}>
                {enrichedClinics.map((clinic) => (
                  <div
                    role="button"
                    tabIndex={0}
                    key={clinic.id}
                    className={styles.listRow}
                    onClick={() => navigate(`/saved/${clinic.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/saved/${clinic.id}`);
                    }}
                  >
                    <div className={styles.rowName}>
                      {clinic.clinicName || clinic.name}
                    </div>
                    <div className={styles.rowLocation}>
                      {clinic.address}
                    </div>
                    <button
                      className={styles.rowAction}
                      onClick={(e) => handleUnsave(e, clinic)}
                      aria-label={`Unsave ${clinic.clinicName || clinic.name}`}
                      title="Remove from saved"
                    >
                      <BookmarkX size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
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