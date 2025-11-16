import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, Star, Bookmark, BookmarkCheck, ArrowLeft, Loader, AlertCircle, MessageCircle, Mail, Stethoscope, Award, Briefcase, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import Toast from '../../components/Toast';
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
    navigate(`/clinics/${clinicId}/appointment`);
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
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: '200px', display: 'flex', flexDirection: 'column' }}>
          <TopBar username={displayName} />
          <main style={{ padding: '108px 32px 40px 32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
              <Loader size={48} color="#818cf8" className="animate-spin" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Loading clinic details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !clinic) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: '200px', display: 'flex', flexDirection: 'column' }}>
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
      <div style={{ flex: 1, marginLeft: '200px', display: 'flex', flexDirection: 'column' }}>
        <TopBar username={displayName} />
        
        <main style={{ padding: '108px 32px 40px 32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
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

          {/* Hero Section with Cover Photo and Profile */}
          <div style={{
            background: 'white',
            borderRadius: '24px',
            overflow: 'hidden',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
          }}>
            {/* Cover / Gallery Carousel */}
            {clinic.galleryPhotos && clinic.galleryPhotos.length > 0 ? (
              <div style={{ position: 'relative', height: '400px', background: '#1f2937' }}>
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
                        left: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '12px',
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
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextGalleryImage}
                      style={{
                        position: 'absolute',
                        right: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '12px',
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
                      <ChevronRight size={24} />
                    </button>

                    {/* Gallery Dots */}
                    <div style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      {clinic.galleryPhotos.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentGalleryIndex(index)}
                          style={{
                            width: index === currentGalleryIndex ? '32px' : '8px',
                            height: '8px',
                            borderRadius: '4px',
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
                  top: '20px',
                  right: '20px',
                  padding: '8px 16px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '20px',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ImageIcon size={16} />
                  {currentGalleryIndex + 1} / {clinic.galleryPhotos.length}
                </div>
              </div>
            ) : (
              <div style={{
                height: '300px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Briefcase size={80} color="rgba(255, 255, 255, 0.3)" />
              </div>
            )}

            {/* Profile Section */}
            <div style={{ padding: '0 40px 40px 40px' }}>
              {/* Profile Picture & Main Info */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-end', 
                justifyContent: 'space-between',
                marginTop: '-60px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
                  {/* Profile Picture */}
                  {clinic.profilePicture ? (
                    <img
                      src={clinic.profilePicture}
                      alt={clinic.clinicName}
                      style={{
                        width: '140px',
                        height: '140px',
                        borderRadius: '24px',
                        objectFit: 'cover',
                        border: '5px solid white',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                        cursor: 'pointer'
                      }}
                      onClick={() => openFullImage(clinic.profilePicture)}
                    />
                  ) : (
                    <div style={{
                      width: '140px',
                      height: '140px',
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: '5px solid white',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Briefcase size={48} color="white" />
                    </div>
                  )}

                  {/* Clinic Name & Rating */}
                  <div style={{ marginBottom: '12px' }}>
                    <h1 style={{ 
                      fontSize: '2.5rem', 
                      fontWeight: 800, 
                      color: '#1f2937', 
                      margin: '0 0 8px 0',
                      lineHeight: 1
                    }}>
                      {clinic.clinicName || clinic.name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={22}
                            fill={star <= Math.round(averageRating) ? '#fbbf24' : 'none'}
                            color={star <= Math.round(averageRating) ? '#fbbf24' : '#d1d5db'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 600 }}>
                        {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <button
                    onClick={handleBookAppointment}
                    style={{
                      padding: '16px 32px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)';
                    }}
                  >
                    Book Appointment
                  </button>

                  <button
                    onClick={handleToggleBookmark}
                    disabled={bookmarkLoading}
                    style={{
                      padding: '16px 28px',
                      background: isBookmarked ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'white',
                      color: isBookmarked ? 'white' : '#374151',
                      border: isBookmarked ? 'none' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      cursor: bookmarkLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: bookmarkLoading ? 0.6 : 1,
                      transition: 'all 0.2s',
                      boxShadow: isBookmarked ? '0 4px 16px rgba(251, 191, 36, 0.3)' : 'none'
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
                      <Loader size={20} className="animate-spin" />
                    ) : isBookmarked ? (
                      <>
                        <BookmarkCheck size={20} />
                        Saved
                      </>
                    ) : (
                      <>
                        <Bookmark size={20} />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Contact Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
                padding: '24px',
                background: '#f9fafb',
                borderRadius: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <MapPin size={20} color="#3b82f6" />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Address</p>
                    <p style={{ fontSize: '0.9375rem', color: '#1f2937', margin: 0, lineHeight: 1.5 }}>{clinic.address || 'No address provided'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Phone size={20} color="#10b981" />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Contact</p>
                    <p style={{ fontSize: '0.9375rem', color: '#1f2937', margin: 0, fontWeight: 600 }}>{clinic.contactNumber || clinic.contact || 'No contact provided'}</p>
                    {clinic.email && (
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0 0' }}>{clinic.email}</p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Clock size={20} color="#f59e0b" />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>Hours</p>
                    <p style={{ fontSize: '0.9375rem', color: '#1f2937', margin: 0 }}>{clinic.openHours || 'Hours not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
            {/* Left Column - Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* About Section */}
              {clinic.description && (
                <div style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', color: '#1f2937' }}>
                    About
                  </h3>
                  <p style={{ color: '#4b5563', lineHeight: '1.8', margin: 0, fontSize: '1rem' }}>
                    {clinic.description}
                  </p>
                </div>
              )}

              {/* Services Section */}
              {clinic.services && (
                <div style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px', color: '#1f2937' }}>
                    Services Offered
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {clinic.services.split(',').map((service, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '12px 20px',
                          background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                          color: '#4338ca',
                          borderRadius: '24px',
                          fontSize: '0.9375rem',
                          fontWeight: 600,
                          border: '2px solid #c7d2fe'
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
                  borderRadius: '20px',
                  padding: '32px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #fae8ff 0%, #f3e8ff 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Stethoscope size={24} color="#a855f7" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                      Our Veterinarians
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gap: '16px' }}>
                    {clinic.veterinarians.map((vet, index) => (
                      <div
                        key={vet.id || index}
                        style={{
                          padding: '24px',
                          background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                          borderRadius: '16px',
                          border: '2px solid #e5e7eb',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#a855f7';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(168, 85, 247, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ 
                              fontSize: '1.25rem', 
                              fontWeight: 700, 
                              color: '#1f2937', 
                              margin: '0 0 4px 0' 
                            }}>
                              Dr. {vet.name}
                            </h4>
                            <p style={{ 
                              fontSize: '0.9375rem', 
                              color: '#a855f7', 
                              fontWeight: 600,
                              margin: 0 
                            }}>
                              {vet.specialization}
                            </p>
                          </div>
                          {vet.yearsOfExperience && (
                            <div style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #fae8ff 0%, #f3e8ff 100%)',
                              borderRadius: '20px',
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
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
              }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  marginBottom: '24px',
                  color: '#1f2937'
                }}>
                  Reviews ({reviews.length})
                </h3>

                {reviewsLoading && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '24px',
                    background: '#f9fafb',
                    borderRadius: '12px'
                  }}>
                    <Loader size={20} className="animate-spin" color="#818cf8" />
                    <span style={{ color: '#6b7280' }}>Loading reviews...</span>
                  </div>
                )}

                {reviewsError && (
                  <div style={{
                    padding: '24px',
                    background: '#fee2e2',
                    border: '2px solid #f87171',
                    borderRadius: '12px',
                    color: '#991b1b',
                    fontWeight: 600
                  }}>
                    Failed to load reviews
                  </div>
                )}

                {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                  <div style={{
                    padding: '48px 20px',
                    textAlign: 'center',
                    background: '#f9fafb',
                    borderRadius: '16px'
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.map((review) => (
                      <div key={review.id} style={{
                        padding: '24px',
                        background: '#fafafa',
                        border: '2px solid #f3f4f6',
                        borderRadius: '16px',
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
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                height: 'fit-content',
                position: 'sticky',
                top: '108px'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px', color: '#1f2937' }}>
                  Gallery
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)',
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
