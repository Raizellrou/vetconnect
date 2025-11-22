import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit, Trash2, MapPin, Phone, Clock, Briefcase } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { uploadImageToCloudinary } from '../../utils/uploadImage';
import LoadingSpinner from '../../components/LoadingSpinner';
import Toast from '../../components/Toast';
import SuccessModal from '../../components/SuccessModal';
import styles from '../../styles/ClinicDashboard.module.css';

export default function ClinicManagement() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clinics, setClinics] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [toast, setToast] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    loadClinics();
    // Check for success message from location state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      // Clear location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const loadClinics = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleAddClinic = () => {
    navigate('/clinic/create');
  };

  const handleEditClinic = (clinic) => {
    navigate(`/clinic/edit/${clinic.id}`);
  };

  const handleDeleteClick = (clinic) => {
    setDeleteConfirm(clinic);
  };

  const handlePhotoUpload = async (e, clinic) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // limit file size to 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setToast({ message: 'File is too large (max 5MB).', type: 'error' });
      return;
    }

    try {
      setUploadProgress(prev => ({ ...prev, [clinic.id]: 50 })); // Show progress
      
      // Upload to Cloudinary
      const url = await uploadImageToCloudinary(file);
      
      // Update clinic document
      await updateDoc(doc(db, 'clinics', clinic.id), { photoURL: url, profilePicture: url });
      
      // Update local state
      setClinics(prev => prev.map(c => c.id === clinic.id ? { ...c, photoURL: url, profilePicture: url } : c));
      setToast({ message: 'Photo uploaded successfully', type: 'success' });
      setUploadProgress(prev => ({ ...prev, [clinic.id]: 0 }));
    } catch (err) {
      console.error(err);
      setToast({ message: 'Upload failed. Please try again.', type: 'error' });
      setUploadProgress(prev => ({ ...prev, [clinic.id]: 0 }));
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteDoc(doc(db, 'clinics', deleteConfirm.id));
        loadClinics();
        setDeleteConfirm(null);
        setToast({ message: 'Clinic deleted successfully!', type: 'success' });
      } catch (error) {
        console.error('Error deleting clinic:', error);
        setToast({ message: 'Failed to delete clinic. Please try again.', type: 'error' });
        setDeleteConfirm(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  return (
    <div className={styles.dashboard}>
      <ClinicSidebar />
      
      <div className={styles.mainWrapper}>
        <TopBar />
        
        <main className={styles.mainContent}>
          {/* Success Modal */}
          <SuccessModal
            isOpen={!!successMessage}
            onClose={() => setSuccessMessage('')}
            title="Success!"
            message={successMessage}
          />

          {/* Header with gradient background */}
          <div className={styles.welcomeBanner}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <MapPin size={32} color="white" />
                <h1 className={styles.welcomeTitle}>Clinic Management</h1>
              </div>
              <p className={styles.welcomeSubtitle}>Manage all your clinic branches and locations</p>
            </div>
            <button onClick={handleAddClinic} className={styles.vcPrimaryBtn}>
              <Plus size={18} />
              ADD CLINIC
            </button>
          </div>

          {/* Clinics Container */}
          <div style={{
            background: 'white',
            borderRadius: 'var(--vc-radius-xl)',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid var(--vc-border)',
            marginTop: '24px'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <LoadingSpinner size="large" message="Loading your clinics..." />
              </div>
            ) : clinics.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: 'var(--vc-radius-2xl)',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)'
                }}>
                  <MapPin size={40} color="#3b82f6" strokeWidth={2.5} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--vc-text-dark)', marginBottom: '8px' }}>No clinics registered yet</h3>
                <p style={{ color: 'var(--vc-text-muted)', marginBottom: '24px', fontSize: '0.9375rem' }}>Add your first clinic to get started with VetConnect</p>
                <button onClick={handleAddClinic} className={styles.vcPrimaryBtn}>
                  <Plus size={18} />
                  ADD CLINIC
                </button>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#1e293b'
                  }}>
                    Your Clinics
                  </h3>
                  <span style={{
                    background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: 'var(--vc-radius-sm)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(129, 140, 248, 0.25)'
                  }}>
                    {clinics.length} {clinics.length === 1 ? 'Clinic' : 'Clinics'}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px'
                }}>
                  {clinics.map((clinic) => (
                    <div key={clinic.id} style={{
                      background: 'white',
                      border: '1px solid var(--vc-border)',
                      borderRadius: 'var(--vc-radius-xl)',
                      padding: '20px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(129, 140, 248, 0.15)';
                      e.currentTarget.style.borderColor = '#818cf8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                      e.currentTarget.style.borderColor = 'var(--vc-border)';
                    }}>
                      {/* Photo and Upload Button */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: 'var(--vc-radius-xl)',
                          overflow: 'hidden',
                          flexShrink: 0,
                          background: clinic.photoURL ? 'transparent' : 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(129, 140, 248, 0.3)'
                        }}>
                          {clinic.photoURL ? (
                            <img src={clinic.photoURL} alt={clinic.clinicName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ color: 'white', fontSize: '1.75rem', fontWeight: 700 }}>
                              {(clinic.clinicName || 'C').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <label htmlFor={`photo-input-${clinic.id}`} style={{
                          padding: '8px 16px',
                          background: '#f8f9fa',
                          border: '1px solid var(--vc-border)',
                          borderRadius: 'var(--vc-radius-sm)',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: '#64748b',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f1f5f9';
                          e.currentTarget.style.borderColor = '#818cf8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f8f9fa';
                          e.currentTarget.style.borderColor = 'var(--vc-border)';
                        }}>
                          Upload Photo
                        </label>
                        <input id={`photo-input-${clinic.id}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(e, clinic)} />
                      </div>

                      {/* Upload Progress */}
                      {uploadProgress[clinic.id] > 0 && (
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${uploadProgress[clinic.id]}%`,
                            height: '100%',
                            background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      )}

                      {/* Clinic Info */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          margin: '0 0 6px 0',
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: '#1e293b',
                          lineHeight: '1.3'
                        }}>
                          {clinic.clinicName}
                        </h3>
                        <p style={{
                          margin: '0 0 16px 0',
                          fontSize: '0.8125rem',
                          color: '#94a3b8',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Clinic Branch
                        </p>

                        {/* Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <p style={{
                              margin: '0 0 4px 0',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#94a3b8',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Address
                            </p>
                            <p style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              color: '#64748b',
                              lineHeight: '1.5',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '6px'
                            }}>
                              <MapPin size={14} color="#94a3b8" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span>{clinic.address}</span>
                            </p>
                          </div>

                          <div>
                            <p style={{
                              margin: '0 0 4px 0',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#94a3b8',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Contact
                            </p>
                            <p style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <Phone size={14} color="#94a3b8" strokeWidth={2.5} />
                              <span>{clinic.contactNumber}</span>
                            </p>
                          </div>

                          <div>
                            <p style={{
                              margin: '0 0 4px 0',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#94a3b8',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Schedule
                            </p>
                            <p style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <Clock size={14} color="#94a3b8" strokeWidth={2.5} />
                              <span>{clinic.openHours}</span>
                            </p>
                          </div>

                          <div>
                            <p style={{
                              margin: '0 0 4px 0',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#94a3b8',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Services
                            </p>
                            <p style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '6px',
                              lineHeight: '1.5'
                            }}>
                              <Briefcase size={14} color="#94a3b8" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                              <span>{clinic.services}</span>
                            </p>
                          </div>

                          {clinic.description && (
                            <div style={{
                              padding: '12px',
                              background: '#f8f9fa',
                              borderRadius: 'var(--vc-radius-md)',
                              border: '1px solid var(--vc-border)'
                            }}>
                              <p style={{
                                margin: '0 0 4px 0',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#94a3b8',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Description
                              </p>
                              <p style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                color: '#64748b',
                                lineHeight: '1.5'
                              }}>
                                {clinic.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{
                        paddingTop: '16px',
                        borderTop: '1px solid var(--vc-border)',
                        display: 'flex',
                        gap: '8px'
                      }}>
                        <button onClick={(e) => { e.stopPropagation(); handleEditClinic(clinic); }} style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--vc-radius-md)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(129, 140, 248, 0.25)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(129, 140, 248, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(129, 140, 248, 0.25)';
                        }}>
                          <Edit size={16} strokeWidth={2.5} />
                          Edit
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(clinic); }} style={{
                          padding: '10px 16px',
                          background: 'white',
                          color: '#ef4444',
                          border: '2px solid #fecaca',
                          borderRadius: 'var(--vc-radius-md)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fee2e2';
                          e.currentTarget.style.borderColor = '#ef4444';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.borderColor = '#fecaca';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) handleCancelDelete(); }}>
          <div className={styles.modalContent} style={{ maxWidth: '520px', padding: 0, overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              padding: '24px',
              borderBottom: '1px solid #fca5a5'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
              }}>
                <Trash2 size={32} color="#ef4444" strokeWidth={2.5} />
              </div>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                color: '#991b1b', 
                margin: 0,
                textAlign: 'center'
              }}>
                Delete Clinic?
              </h3>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Warning Message */}
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <p style={{ 
                  color: '#991b1b', 
                  margin: 0, 
                  lineHeight: '1.6',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  ⚠️ This action cannot be undone. All clinic data, appointments, and records will be permanently deleted.
                </p>
              </div>

              {/* Clinic Details Card */}
              <div style={{
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* Clinic Photo */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: deleteConfirm.photoURL ? 'transparent' : 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}>
                    {deleteConfirm.photoURL ? (
                      <img 
                        src={deleteConfirm.photoURL} 
                        alt={deleteConfirm.clinicName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>
                        {(deleteConfirm.clinicName || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Clinic Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: '#1e293b'
                    }}>
                      {deleteConfirm.clinicName}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#64748b" strokeWidth={2.5} />
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                          {deleteConfirm.address}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} color="#64748b" strokeWidth={2.5} />
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                          {deleteConfirm.contactNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleCancelDelete} 
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                  }}
                >
                  <Trash2 size={18} strokeWidth={2.5} />
                  Delete Clinic
                </button>
              </div>
            </div>
          </div>
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
