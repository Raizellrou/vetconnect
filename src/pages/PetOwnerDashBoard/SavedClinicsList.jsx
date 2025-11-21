import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkX, MapPin, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
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
          {/* Header Section */}
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '20px', 
            marginBottom: '24px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid var(--vc-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(129, 140, 248, 0.25)'
              }}>
                <MapPin size={24} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: '0 0 6px 0', lineHeight: '1.3' }}>
                  Saved Clinics
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '2px', fontWeight: 500, lineHeight: '1.4' }}>
                  Quick access to your favorite veterinary clinics
                </p>
              </div>
            </div>
          </div>

          {/* Error State */}
          {(bookmarksError || error) && (
            <div style={{ 
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid #f87171', 
              marginBottom: '24px',
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.12)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: '#dc2626',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertCircle size={18} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#991b1b' }}>Error Loading Saved Clinics</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#b91c1c' }}>
                  {bookmarksError?.message || error || 'Please try refreshing the page'}
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {(bookmarksLoading || enriching) && (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <LoadingSpinner 
                size="large" 
                message={bookmarksLoading ? 'Loading saved clinics...' : 'Loading clinic details...'} 
              />
            </div>
          )}

          {/* Empty State */}
          {!bookmarksLoading && !enriching && enrichedClinics.length === 0 && (
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '40px 24px', 
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid var(--vc-border)'
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
              }}>
                <MapPin size={40} color="#f59e0b" strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>
                No saved clinics yet
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '1.5' }}>
                Browse the map and save your favorite veterinary clinics for quick access
              </p>
              <button
                onClick={() => navigate('/map')}
                style={{ 
                  padding: '10px 20px', 
                  background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(129, 140, 248, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(129, 140, 248, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(129, 140, 248, 0.3)';
                }}
              >
                <MapPin size={16} strokeWidth={2.5} />
                Browse Clinics
              </button>
            </div>
          )}

          {/* Clinics List */}
          {!bookmarksLoading && !enriching && enrichedClinics.length > 0 && (
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '20px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid var(--vc-border)'
            }}>
              <h3 style={{ 
                margin: '0 0 20px 0', 
                fontSize: '1.125rem', 
                fontWeight: 700, 
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Your Saved Clinics
                <span style={{ 
                  background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(129, 140, 248, 0.25)'
                }}>
                  {enrichedClinics.length}
                </span>
              </h3>

              <div style={{ 
                display: 'grid', 
                gap: '12px' 
              }}>
                {enrichedClinics.map((clinic) => (
                  <div
                    role="button"
                    tabIndex={0}
                    key={clinic.id}
                    onClick={() => navigate(`/saved/${clinic.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/saved/${clinic.id}`);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(129, 140, 248, 0.12)';
                      e.currentTarget.style.borderColor = '#818cf8';
                      e.currentTarget.style.background = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%)';
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(129, 140, 248, 0.25)'
                    }}>
                      <MapPin size={22} color="white" strokeWidth={2.5} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '0.9375rem', 
                        fontWeight: 700, 
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.3'
                      }}>
                        {clinic.clinicName || clinic.name}
                      </h4>
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        fontSize: '0.8125rem', 
                        color: '#6b7280',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        lineHeight: '1.4'
                      }}>
                        <MapPin size={13} color="#9ca3af" strokeWidth={2.5} />
                        {clinic.address}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleUnsave(e, clinic)}
                      aria-label={`Unsave ${clinic.clinicName || clinic.name}`}
                      title="Remove from saved"
                      style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.background = '#fee2e2';
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <BookmarkX size={16} color="#ef4444" strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
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