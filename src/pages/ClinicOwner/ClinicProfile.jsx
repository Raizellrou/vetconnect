import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Calendar, Edit, Building2, ExternalLink, X } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import layoutStyles from '../../styles/ClinicDashboard.module.css';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/Profile.module.css';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

export default function ClinicProfile() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [showClinicModal, setShowClinicModal] = useState(false);

  const displayName = userData?.fullName || userData?.displayName || userData?.clinicName || userData?.email;
  const email = userData?.email || '';
  const phone = userData?.phone || 'Not provided';
  const address = userData?.address || 'Not provided';
  const clinicName = userData?.clinicName || 'Not provided';
  const portfolio = userData?.portfolio || '';
  const joinDate = userData?.createdAt?.toDate?.().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) || 'N/A';

  useEffect(() => {
    const loadClinics = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setLoadingClinics(true);
        const clinicsRef = collection(db, 'clinics');
        const q = query(clinicsRef, where('ownerId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const loadedClinics = [];
        querySnapshot.forEach((doc) => {
          loadedClinics.push({ id: doc.id, ...doc.data() });
        });
        
        setClinics(loadedClinics);
      } catch (error) {
        console.error('Error loading clinics:', error);
      } finally {
        setLoadingClinics(false);
      }
    };

    loadClinics();
  }, [currentUser]);

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className={layoutStyles.dashboard}>
      <ClinicSidebar />
      <div className={layoutStyles.mainWrapper}>
        <TopBar username={displayName} />

        <main className={layoutStyles.mainContent}>
          <header className={styles.headerRow}>
            <div className={styles.breadcrumb}>
              <span>Profile</span>
              <span className={styles.bullet}>•</span>
              <span className={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <h2 className={styles.title}>My Profile</h2>
          </header>

          <div className={`${styles.profileCard} ${layoutStyles.vcCard}`}>
            <div className={styles.profileHeader}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarLarge}>
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt={displayName} className={styles.avatarImg} />
                  ) : (
                    <span className={styles.avatarInitials}>{getInitials(displayName)}</span>
                  )}
                </div>
                <div className={styles.userInfo}>
                  <h1 className={styles.userName}>{displayName}</h1>
                  <p className={styles.userRole}>Clinic Owner</p>
                </div>
              </div>
              <button 
                className={styles.editBtn}
                onClick={() => navigate('/clinic/edit-profile')}
              >
                <Edit size={18} />
                Edit Profile
              </button>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Personal Information</h3>
              
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <Mail size={20} />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Email Address</div>
                    <div className={styles.infoValue}>{email}</div>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <Phone size={20} />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Phone Number</div>
                    <div className={styles.infoValue}>{phone}</div>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <MapPin size={20} />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Address</div>
                    <div className={styles.infoValue}>{address}</div>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <Building2 size={20} />
                  </div>
                  <div className={styles.infoContent} style={{ flex: 1 }}>
                    <div className={styles.infoLabel}>Clinics</div>
                    {!loadingClinics && clinics.length > 0 && (
                      <div 
                        className={styles.infoValue} 
                        style={{ 
                          cursor: 'pointer',
                          color: '#667eea',
                          fontWeight: 600,
                          transition: 'color 0.2s ease',
                          display: 'inline-block'
                        }}
                        onClick={() => setShowClinicModal(true)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#764ba2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#667eea';
                        }}
                      >
                        {clinics.length}
                      </div>
                    )}
                  </div>
                </div>

                {portfolio && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoIcon}>
                      <ExternalLink size={20} />
                    </div>
                    <div className={styles.infoContent}>
                      <div className={styles.infoLabel}>Portfolio</div>
                      <div className={styles.infoValue}>
                        <a 
                          href={portfolio} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          View Portfolio <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <Calendar size={20} />
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Member Since</div>
                    <div className={styles.infoValue}>{joinDate}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Clinics Modal */}
      {showClinicModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setShowClinicModal(false)}
        >
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}
          </style>
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              animation: 'slideUp 0.3s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '24px 28px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <Building2 size={24} color="white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 700, 
                    margin: 0,
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    Registered Clinics
                  </h3>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '0.875rem', 
                    opacity: 0.9 
                  }}>
                    {clinics.length} clinic{clinics.length !== 1 ? 's' : ''} registered
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowClinicModal(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ 
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px'
              }}>
                {clinics.map((clinic) => (
                  <div key={clinic.id} style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
                    e.currentTarget.style.borderColor = '#93c5fd';
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => {
                    setShowClinicModal(false);
                    navigate('/clinic/manage-clinics');
                  }}
                  >
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      marginBottom: '8px'
                    }}>
                      {clinic.clinicName}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '6px'
                    }}>
                      <MapPin size={16} />
                      {clinic.address}
                    </div>
                    {clinic.contactNumber && (
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Phone size={16} />
                        {clinic.contactNumber}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
