import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { MapPin, Phone, Clock, Star, Bookmark, BookmarkCheck, Calendar, ArrowLeft, X } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
=======
import { MapPin, Phone, Clock, Star, Bookmark, BookmarkCheck, ArrowLeft, Loader, AlertCircle, MessageCircle } from 'lucide-react';
>>>>>>> b46e9c861f0b7efe19f65b1b5e940c994d99d697
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { addBookmark, removeBookmark, isClinicBookmarked } from '../../firebase/firestoreHelpers';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import styles from '../../styles/ClinicDetails.module.css';

export default function ClinicDetails() {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  // Fetch reviews from Firestore subcollection
  const {
    docs: reviews = [],
    loading: reviewsLoading,
    error: reviewsError
  } = useCollection(
    clinic?.id ? `clinics/${clinic.id}/reviews` : null
  );

  // Fetch clinic data
  useEffect(() => {
    const fetchClinic = async () => {
      if (!clinicId) {
        setError('No clinic ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Try Firestore first
        const clinicRef = doc(db, 'clinics', clinicId);
        const clinicSnap = await getDoc(clinicRef);
        
        if (clinicSnap.exists()) {
          setClinic({ id: clinicSnap.id, ...clinicSnap.data() });
        } else {
          // Fallback to localStorage
          const localClinics = JSON.parse(localStorage.getItem('clinics') || '[]');
          const localClinic = localClinics.find(c => c.id === clinicId);
          
          if (localClinic) {
            setClinic(localClinic);
          } else {
            setError('Clinic not found');
          }
        }
      } catch (err) {
        console.error('Error fetching clinic:', err);
        setError('Failed to load clinic details');
      } finally {
        setLoading(false);
      }
    };

    fetchClinic();
  }, [clinicId]);

  // Check if clinic is bookmarked
  useEffect(() => {
    const checkBookmark = async () => {
      if (!currentUser?.uid || !clinicId) return;
      
      try {
        const bookmarked = await isClinicBookmarked(currentUser.uid, clinicId);
        setIsBookmarked(bookmarked);
      } catch (err) {
        console.error('Error checking bookmark:', err);
      }
    };

    checkBookmark();
  }, [currentUser, clinicId]);

  const handleToggleBookmark = async () => {
    if (!currentUser?.uid || !clinic) {
      alert('Please log in to save clinics');
      return;
    }

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark(currentUser.uid, clinic.id);
        setIsBookmarked(false);
        console.log('Clinic removed from bookmarks');
      } else {
        await addBookmark(currentUser.uid, clinic.id, {
          clinicName: clinic.clinicName || clinic.name,
          address: clinic.address
        });
        setIsBookmarked(true);
        console.log('Clinic added to bookmarks');
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      alert('Failed to update bookmark. Please try again.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleBookAppointment = () => {
    if (!currentUser?.uid) {
      alert('Please log in to book an appointment');
      navigate('/login');
      return;
    }
    navigate(`/book-appointment/${clinicId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
        <Sidebar />
<<<<<<< HEAD
        <div style={{ flex: 1, marginLeft: '240px' }}>
          <TopBar username={displayName} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
            <LoadingSpinner size="large" message="Loading clinic details..." />
          </div>
=======
        <div style={{ flex: 1, marginLeft: '200px', display: 'flex', flexDirection: 'column' }}>
          <TopBar username={displayName} />
          <main style={{ padding: '108px 32px 40px 32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
              <Loader size={48} color="#818cf8" className="animate-spin" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading clinic details...</p>
            </div>
          </main>
>>>>>>> b46e9c861f0b7efe19f65b1b5e940c994d99d697
        </div>
      </div>
    );
  }

  // Error state
  if (error || !clinic) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
        <Sidebar />
<<<<<<< HEAD
        <div style={{ flex: 1, marginLeft: '240px' }}>
=======
        <div style={{ flex: 1, marginLeft: '200px', display: 'flex', flexDirection: 'column' }}>
>>>>>>> b46e9c861f0b7efe19f65b1b5e940c994d99d697
          <TopBar username={displayName} />
          <main style={{ padding: '108px 32px 40px 32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <div style={{
              padding: '48px 24px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '2px solid #f87171',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>
                Error Loading Clinic
              </h3>
              <p style={{ color: '#7f1d1d', marginBottom: '16px' }}>
                {error || 'Clinic not found'}
              </p>
              <button
                onClick={() => navigate('/map')}
                style={{
                  padding: '10px 24px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Back to Map
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Calculate average rating
  const averageRating = clinic.averageRating || 
    (reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
      : 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <Sidebar />
<<<<<<< HEAD
      <div style={{ flex: 1, marginLeft: '240px' }}>
=======
      <div style={{ flex: 1, marginLeft: '200px', display: 'flex', flexDirection: 'column' }}>
>>>>>>> b46e9c861f0b7efe19f65b1b5e940c994d99d697
        <TopBar username={displayName} />
        
        <main style={{ padding: '108px 32px 40px 32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
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
              marginBottom: '24px',
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
            Back
          </button>

          {/* Clinic Header Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: '16px' }}>
                  {clinic.clinicName || clinic.name}
                </h1>

                {/* Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        fill={star <= Math.round(averageRating) ? '#fbbf24' : 'none'}
                        color={star <= Math.round(averageRating) ? '#fbbf24' : '#d1d5db'}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 600 }}>
                    {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <MapPin size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Address</p>
                      <p style={{ fontSize: '0.9375rem', color: '#1f2937', margin: 0 }}>{clinic.address || 'No address provided'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Phone size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Contact</p>
                      <p style={{ fontSize: '0.9375rem', color: '#1f2937', margin: 0 }}>{clinic.contactNumber || clinic.contact || 'No contact provided'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Clock size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Hours</p>
                      <p style={{ fontSize: '0.9375rem', color: '#1f2937', margin: 0 }}>{clinic.openHours || 'Hours not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
                <button
                  onClick={handleBookAppointment}
                  style={{
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  Book Appointment
                </button>

                <button
                  onClick={handleToggleBookmark}
                  disabled={bookmarkLoading}
                  style={{
                    padding: '14px 24px',
                    background: isBookmarked ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'white',
                    color: isBookmarked ? 'white' : '#374151',
                    border: isBookmarked ? 'none' : '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    cursor: bookmarkLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: bookmarkLoading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!bookmarkLoading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {bookmarkLoading ? (
                    <Loader size={18} className="animate-spin" />
                  ) : isBookmarked ? (
                    <>
                      <BookmarkCheck size={18} />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark size={18} />
                      Save Clinic
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Services */}
          {clinic.services && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: '#1f2937' }}>
                Services Offered
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {clinic.services.split(',').map((service, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                      color: '#4338ca',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    {service.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {clinic.description && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#1f2937' }}>
                About
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6', margin: 0 }}>
                {clinic.description}
              </p>
            </div>
          )}

          {/* Reviews Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              marginBottom: '20px',
              color: '#1f2937'
            }}>
              Reviews ({reviews.length})
            </h3>

<<<<<<< HEAD
            {reviewsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <LoadingSpinner size="medium" message="Loading reviews..." />
              </div>
            ) : reviews.length === 0 ? (
=======
            {reviewsLoading && (
>>>>>>> b46e9c861f0b7efe19f65b1b5e940c994d99d697
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '20px',
                background: '#f9fafb',
                borderRadius: '12px'
              }}>
                <Loader size={20} className="animate-spin" color="#818cf8" />
                <span style={{ color: '#6b7280' }}>Loading reviews...</span>
              </div>
            )}

            {reviewsError && (
              <div style={{
                padding: '20px',
                background: '#fee2e2',
                border: '1px solid #f87171',
                borderRadius: '12px',
                color: '#991b1b'
              }}>
                Failed to load reviews
              </div>
            )}

            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: '#f9fafb',
                borderRadius: '12px'
              }}>
                <MessageCircle size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                  No reviews yet. Be the first to review this clinic!
                </p>
              </div>
            )}

            {!reviewsLoading && !reviewsError && reviews.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviews.map((review) => (
                  <div key={review.id} style={{
                    padding: '20px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={18}
                            fill={star <= review.rating ? '#fbbf24' : 'none'}
                            color={star <= review.rating ? '#fbbf24' : '#d1d5db'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {review.createdAt?.toDate ? 
                          review.createdAt.toDate().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Recently'}
                      </span>
                    </div>
                    {review.comment && (
                      <p style={{
                        color: '#374151',
                        lineHeight: '1.6',
                        margin: 0
                      }}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
