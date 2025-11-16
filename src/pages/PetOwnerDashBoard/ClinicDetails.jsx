import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, Star, Bookmark, BookmarkCheck, Calendar, ArrowLeft, X } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useCollection } from '../../hooks/useCollection';
import { addBookmark, removeBookmark } from '../../firebase/firestoreHelpers';
import styles from '../../styles/SavedClinics.module.css';
import { StarHalf } from 'lucide-react';

export default function ClinicDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [tab, setTab] = useState('overview');

  // Real-time bookmark status
  const {
    docs: bookmarks = []
  } = useCollection(
    currentUser?.uid ? `users/${currentUser.uid}/bookmarks` : null
  );

  const isBookmarked = bookmarks.some(b => b.clinicId === id);

  // Real-time reviews listener
  const {
    docs: reviews = [],
    loading: reviewsLoading
  } = useCollection(
    id ? `clinics/${id}/reviews` : null
  );

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        setLoading(true);
        
        // Fetch clinic from Firestore
        const clinicRef = doc(db, 'clinics', id);
        const clinicSnap = await getDoc(clinicRef);
        
        if (clinicSnap.exists()) {
          setClinic({ id: clinicSnap.id, ...clinicSnap.data() });
        } else {
          // Fallback to localStorage
          const clinics = JSON.parse(localStorage.getItem('clinics') || '[]');
          const found = clinics.find(c => c.id === id);
          if (found) setClinic(found);
        }
      } catch (error) {
        console.error('Error fetching clinic:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClinic();
  }, [id, currentUser]);

  const handleBookmark = async () => {
    if (!currentUser?.uid) {
      alert('Please log in to bookmark clinics');
      return;
    }

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark(currentUser.uid, id);
      } else {
        await addBookmark(currentUser.uid, id, {
          clinicName: clinic?.clinicName || clinic?.name,
          address: clinic?.address
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleMakeAppointment = () => {
    navigate(`/clinics/${id}/appointment`);
  };

  // Helper to render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} size={16} fill="#fbbf24" color="#fbbf24" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" size={16} fill="#fbbf24" color="#fbbf24" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} color="#d1d5db" />);
    }

    return stars;
  };

  // Format review date
  const formatReviewDate = (timestamp) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: '240px' }}>
          <TopBar username={displayName} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
            <LoadingSpinner size="large" message="Loading clinic details..." />
          </div>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: '240px' }}>
          <TopBar username={displayName} />
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Clinic not found</h2>
            <button onClick={() => navigate('/map')} style={{ marginTop: '20px', padding: '12px 24px', background: '#818cf8', color: 'white', borderRadius: '10px' }}>
              Back to Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '240px' }}>
        <TopBar username={displayName} />
        
        <main style={{ padding: '80px 20px 24px 20px', maxWidth: '1400px', margin: '0 auto' }}>
          {/* Clinic Header */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => navigate(-1)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fee2e2';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <X size={20} />
            </button>

            <div style={{ paddingRight: '50px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                  {clinic.clinicName || clinic.name}
                </h1>
                {(clinic.averageRating || clinic.rating) && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 16px', 
                    background: '#fef3c7', 
                    borderRadius: '10px',
                    border: '2px solid #fbbf24'
                  }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {renderStars(clinic.averageRating || clinic.rating)}
                    </div>
                    <span style={{ fontWeight: 700, color: '#92400e', fontSize: '1.125rem' }}>
                      {(clinic.averageRating || clinic.rating).toFixed(1)}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#78350f' }}>
                      ({clinic.reviewCount || reviews.length} {(clinic.reviewCount || reviews.length) === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {clinic.address && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <MapPin size={20} color="#6b7280" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: '#374151', fontSize: '1rem' }}>{clinic.address}</span>
                  </div>
                )}
                {(clinic.contactNumber || clinic.phone) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone size={20} color="#6b7280" />
                    <span style={{ color: '#374151', fontSize: '1rem' }}>{clinic.contactNumber || clinic.phone}</span>
                  </div>
                )}
                {clinic.openHours && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={20} color="#6b7280" />
                    <span style={{ color: '#374151', fontSize: '1rem' }}>{clinic.openHours}</span>
                  </div>
                )}
              </div>

              {clinic.description && (
                <p style={{ color: '#6b7280', lineHeight: '1.6', fontSize: '1rem', marginBottom: '32px' }}>
                  {clinic.description}
                </p>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleMakeAppointment}
                  style={{
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
                  }}
                >
                  <Calendar size={20} strokeWidth={2.5} />
                  Make Appointment
                </button>

                <button
                  onClick={handleBookmark}
                  disabled={bookmarkLoading}
                  style={{
                    padding: '14px 28px',
                    background: isBookmarked ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'white',
                    color: isBookmarked ? 'white' : '#374151',
                    border: `2px solid ${isBookmarked ? '#fbbf24' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: bookmarkLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    opacity: bookmarkLoading ? 0.6 : 1
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
                  {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  {bookmarkLoading ? 'Updating...' : isBookmarked ? 'Saved' : 'Save Clinic'}
                </button>
              </div>
            </div>
          </div>

          {/* Services */}
          {clinic.services && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '20px' }}>
                Services Offered
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {(Array.isArray(clinic.services) ? clinic.services : clinic.services.split(',')).map((service, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                      borderRadius: '10px',
                      border: '2px solid #c7d2fe',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: '#4338ca'
                    }}
                  >
                    {typeof service === 'string' ? service.trim() : service}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Star size={24} color="#fbbf24" fill="#fbbf24" />
              Reviews {reviews.length > 0 && `(${reviews.length})`}
            </h2>

            {reviewsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <LoadingSpinner size="medium" message="Loading reviews..." />
              </div>
            ) : reviews.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 40px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '16px',
                border: '2px solid #fbbf24'
              }}>
                <Star size={56} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
                  No reviews yet
                </h3>
                <p style={{ fontSize: '1rem', color: '#78350f', margin: 0 }}>
                  Be the first to review this clinic!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviews
                  .sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                    return dateB - dateA; // Newest first
                  })
                  .map((review) => (
                    <div
                      key={review.id}
                      style={{
                        padding: '20px',
                        background: '#f9fafb',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      {/* Review Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {renderStars(review.rating)}
                          </div>
                          <span style={{ fontWeight: 700, color: '#1f2937' }}>
                            {review.rating}.0
                          </span>
                        </div>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {formatReviewDate(review.createdAt)}
                        </span>
                      </div>

                      {/* Review Comment */}
                      {review.comment && (
                        <p style={{
                          color: '#374151',
                          lineHeight: '1.6',
                          margin: 0,
                          fontSize: '0.9375rem'
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
