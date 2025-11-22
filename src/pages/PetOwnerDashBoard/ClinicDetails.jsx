import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, Star, Bookmark, BookmarkCheck, ArrowLeft, Loader, AlertCircle, MessageCircle, Mail, Stethoscope, Award, Briefcase, ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import Toast from '../../components/Toast';
import BookAppointmentWithTimeSlot from '../../components/modals/BookAppointmentWithTimeSlot';
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
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState('');
  const [toast, setToast] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

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
      setToast({ message: 'Please log in to save clinics', type: 'warning' });
      return;
    }

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await removeBookmark(currentUser.uid, clinic.id);
        setIsBookmarked(false);
        setToast({ message: 'Clinic removed from saved list', type: 'success' });
      } else {
        await addBookmark(currentUser.uid, clinic.id, {
          clinicName: clinic.clinicName || clinic.name,
          address: clinic.address
        });
        setIsBookmarked(true);
        setToast({ message: 'Clinic saved successfully!', type: 'success' });
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setToast({ message: 'Failed to update bookmark. Please try again.', type: 'error' });
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleBookAppointment = () => {
    if (!currentUser?.uid) {
      setToast({ message: 'Please log in to book an appointment', type: 'warning' });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    setShowBookingModal(true);
  };

  const nextGalleryImage = () => {
    if (clinic?.galleryPhotos && clinic.galleryPhotos.length > 0) {
      setCurrentGalleryIndex((prev) => 
        prev === clinic.galleryPhotos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevGalleryImage = () => {
    if (clinic?.galleryPhotos && clinic.galleryPhotos.length > 0) {
      setCurrentGalleryIndex((prev) => 
        prev === 0 ? clinic.galleryPhotos.length - 1 : prev - 1
      );
    }
  };

  const openFullImage = (imageUrl) => {
    setFullImageUrl(imageUrl);
    setShowFullImage(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <div className={styles.content}>
          <TopBar username={displayName} />
          <main className={styles.main}>
            <div className={styles.loading}>
              <Loader size={40} color="#818cf8" className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p className={styles.stepDescription}>Loading clinic details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !clinic) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <div className={styles.content}>
          <TopBar username={displayName} />
          <main className={styles.main}>
            <div className={styles.error}>
              <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
              <h3 className={styles.errorTitle}>Error Loading Clinic</h3>
              <p className={styles.errorMessage}>{error || 'Clinic not found'}</p>
              <button
                onClick={() => navigate('/map')}
                className={styles.bookButton}
                style={{ background: '#ef4444', border: 'none', color: 'white' }}
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

  const hasGallery = clinic.galleryPhotos && clinic.galleryPhotos.length > 0;

  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.content}>
        <TopBar username={displayName} />
        
        <main className={styles.main}>
          {/* Hero Section with Cover Photo and Profile */}
          <div className={styles.card} style={{ position: 'relative', padding: 0, overflow: 'hidden' }}>
            {/* Close Button - top-right corner */}
            <button 
              onClick={() => navigate(-1)} 
              aria-label="Close" 
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 10,
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#374151',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#6366f1';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <X size={20} />
            </button>
            {/* Cover / Gallery Carousel */}
            {clinic.galleryPhotos && clinic.galleryPhotos.length > 0 ? (
              <div style={{ position: 'relative', height: '300px', background: '#1f2937' }}>
                <img
                  src={clinic.galleryPhotos[currentGalleryIndex]}
                  alt={`Clinic gallery ${currentGalleryIndex + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => openFullImage(clinic.galleryPhotos[currentGalleryIndex])}
                />
                
                {/* Gallery Navigation */}
                {clinic.galleryPhotos.length > 1 && (
                  <>
                    <button
                      onClick={prevGalleryImage}
                      style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '8px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextGalleryImage}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '8px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>

                    {/* Gallery Dots */}
                    <div style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '6px'
                    }}>
                      {clinic.galleryPhotos.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentGalleryIndex(index)}
                          style={{
                            width: index === currentGalleryIndex ? '24px' : '6px',
                            height: '6px',
                            borderRadius: '3px',
                            background: index === currentGalleryIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Photo Counter */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '6px 12px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <ImageIcon size={14} />
                  {currentGalleryIndex + 1} / {clinic.galleryPhotos.length}
                </div>
              </div>
            ) : (
              <div style={{
                height: '240px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Briefcase size={60} color="rgba(255, 255, 255, 0.3)" />
              </div>
            )}

            {/* Profile Section */}
            <div style={{ padding: 'var(--vc-space-6, 24px)', position: 'relative' }}>
            
              {/* Profile Picture & Main Info */}
              <div style={{ 
                marginTop: 0,
                marginBottom: 'var(--vc-space-5, 20px)'
              }}>
                <div className={styles.header} style={{ marginBottom: 'var(--vc-space-4, 16px)' }}>
                  {/* Profile Picture */}
                  {(clinic.photoURL || clinic.profilePicture) ? (
                    <img
                      src={clinic.photoURL || clinic.profilePicture}
                      alt={clinic.clinicName}
                      style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        border: '3px solid white',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      onClick={() => openFullImage(clinic.photoURL || clinic.profilePicture)}
                    />
                  ) : (
                    <div style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: '3px solid white',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Briefcase size={36} color="white" />
                    </div>
                  )}

                  {/* Clinic Name & Rating */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                    <h1 style={{ 
                      fontSize: '1.75rem', 
                      fontWeight: 700, 
                      color: '#1e293b', 
                      margin: 0, 
                      lineHeight: 1.2,
                      letterSpacing: '-0.01em'
                    }}>
                      {clinic.clinicName || clinic.name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={18}
                            fill={star <= Math.round(averageRating) ? '#fbbf24' : 'none'}
                            color={star <= Math.round(averageRating) ? '#fbbf24' : '#d1d5db'}
                          />
                        ))}
                      </div>
                      <span style={{ 
                        fontSize: '0.9375rem', 
                        color: '#64748b',
                        fontWeight: 500
                      }}>
                        {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons Row */}
                <div className={styles.actions}>
                  <button
                    onClick={handleBookAppointment}
                    className={styles.bookButton}
                  >
                    Book Appointment
                  </button>

                  <button
                    onClick={handleToggleBookmark}
                    disabled={bookmarkLoading}
                    className={`${styles.bookmarkButton} ${isBookmarked ? 'bookmarked' : ''}`}
                    aria-busy={bookmarkLoading}
                  >
                    {bookmarkLoading ? (
                      <Loader size={16} className="animate-spin" />
                    ) : isBookmarked ? (
                      <>
                        <BookmarkCheck size={16} />
                        Saved
                      </>
                    ) : (
                      <>
                        <Bookmark size={16} />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Contact Info Grid */}
              <div className={styles.infoGrid} style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--vc-border)' }}>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={18} color="#3b82f6" />
                  </div>
                  <div>
                    <p className={styles.infoLabel}>Address</p>
                    <p className={styles.infoValue}>{clinic.address || 'No address provided'}</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={18} color="#10b981" />
                  </div>
                  <div>
                    <p className={styles.infoLabel}>Contact</p>
                    <p className={styles.infoValue} style={{ fontWeight: 600 }}>{clinic.contactNumber || clinic.contact || 'No contact provided'}</p>
                    {clinic.email && (
                      <p className={styles.stepDescription} style={{ marginTop: '4px' }}>{clinic.email}</p>
                    )}
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoIcon} style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={18} color="#f59e0b" />
                  </div>
                  <div>
                    <p className={styles.infoLabel}>Hours</p>
                    <p className={styles.infoValue}>{clinic.openHours || 'Hours not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: hasGallery ? 'minmax(0, 2fr) minmax(0, 1fr)' : '1fr', gap: '24px', alignItems: 'start' }}>
            {/* Left Column - Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* About Section */}
              {clinic.description && (
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid var(--vc-border)'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '12px', color: '#1f2937' }}>
                    About
                  </h3>
                  <p style={{ color: '#4b5563', lineHeight: '1.6', margin: 0, fontSize: '0.875rem' }}>
                    {clinic.description}
                  </p>
                </div>
              )}

              {/* Services Section */}
              {clinic.services && (
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid var(--vc-border)'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '12px', color: '#1f2937' }}>
                    Services Offered
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {clinic.services.split(',').map((service, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '8px 14px',
                          background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                          color: '#4338ca',
                          borderRadius: '16px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          border: '1px solid #c7d2fe'
                        }}
                      >
                        {service.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Veterinarians Section */}
              {clinic.veterinarians && clinic.veterinarians.length > 0 && (
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid var(--vc-border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #fae8ff 0%, #f3e8ff 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Stethoscope size={20} color="#a855f7" />
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                      Our Veterinarians
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    {clinic.veterinarians.map((vet, index) => (
                      <div
                        key={vet.id || index}
                        style={{
                          padding: '16px',
                          background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#a855f7';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(168, 85, 247, 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <h4 style={{ 
                              fontSize: '1rem', 
                              fontWeight: 700, 
                              color: '#1f2937', 
                              margin: '0 0 3px 0' 
                            }}>
                              Dr. {vet.name}
                            </h4>
                            <p style={{ 
                              fontSize: '0.8125rem', 
                              color: '#a855f7', 
                              fontWeight: 600,
                              margin: 0 
                            }}>
                              {vet.specialization}
                            </p>
                          </div>
                          {vet.yearsOfExperience && (
                            <div style={{
                              padding: '6px 12px',
                              background: 'linear-gradient(135deg, #fae8ff 0%, #f3e8ff 100%)',
                              borderRadius: '12px',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              color: '#a855f7',
                              whiteSpace: 'nowrap'
                            }}>
                              {vet.yearsOfExperience} years exp.
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'grid', gap: '8px', marginTop: '16px' }}>
                          {vet.licenseNumber && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Award size={16} color="#6b7280" />
                              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                License: <span style={{ fontWeight: 600, color: '#1f2937' }}>{vet.licenseNumber}</span>
                              </span>
                            </div>
                          )}
                          {vet.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Mail size={16} color="#6b7280" />
                              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {vet.email}
                              </span>
                            </div>
                          )}
                          {vet.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Phone size={16} color="#6b7280" />
                              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {vet.phone}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid var(--vc-border)'
              }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 700, 
                  marginBottom: '16px',
                  color: '#1f2937'
                }}>
                  Reviews ({reviews.length})
                </h3>

                {reviewsLoading && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <Loader size={20} className="animate-spin" color="#818cf8" />
                    <span style={{ color: '#6b7280' }}>Loading reviews...</span>
                  </div>
                )}

                {reviewsError && (
                  <div style={{
                    padding: '16px',
                    background: '#fee2e2',
                    border: '1px solid #f87171',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontWeight: 600
                  }}>
                    Failed to load reviews
                  </div>
                )}

                {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                  <div style={{
                    padding: '32px 20px',
                    textAlign: 'center',
                    background: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <MessageCircle size={56} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#6b7280', fontSize: '1.125rem', fontWeight: 600 }}>
                      No reviews yet
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '8px' }}>
                      Be the first to review this clinic!
                    </p>
                  </div>
                )}

                {!reviewsLoading && !reviewsError && reviews.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reviews.map((review) => (
                      <div key={review.id} style={{
                        padding: '16px',
                        background: '#fafafa',
                        border: '1px solid #f3f4f6',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#f3f4f6';
                        e.currentTarget.style.background = '#fafafa';
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={20}
                                fill={star <= review.rating ? '#fbbf24' : 'none'}
                                color={star <= review.rating ? '#fbbf24' : '#d1d5db'}
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 600 }}>
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
                            lineHeight: '1.7',
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
            </div>

            {/* Right Column - Gallery Grid */}
            {clinic.galleryPhotos && clinic.galleryPhotos.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid var(--vc-border)',
                height: 'fit-content',
                position: 'sticky',
                top: '100px',
                minHeight: '400px'
              }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: '#1f2937' }}>
                  Gallery
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '12px'
                }}>
                  {clinic.galleryPhotos.map((photo, index) => (
                    <div
                      key={index}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                      onClick={() => openFullImage(photo)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.zIndex = '10';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.zIndex = '1';
                      }}
                    >
                      <img
                        src={photo}
                        alt={`Gallery ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Full Image Modal */}
      {showFullImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            backdropFilter: 'blur(8px)'
          }}
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <X size={28} />
          </button>
          <img
            src={fullImageUrl}
            alt="Full size"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '12px'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Booking Modal */}
      <BookAppointmentWithTimeSlot
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        clinicId={clinicId}
        clinicName={clinic?.clinicName || clinic?.name}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
