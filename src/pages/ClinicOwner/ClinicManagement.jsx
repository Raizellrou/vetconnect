import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit, Trash2, MapPin, Phone, Clock, Briefcase } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase/firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import LoadingSpinner from '../../components/LoadingSpinner';
import Toast from '../../components/Toast';
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
      const path = `clinicPhotos/${clinic.id}/${Date.now()}_${file.name}`;
      const storageReference = storageRef(storage, path);
      const uploadTask = uploadBytesResumable(storageReference, file);

      uploadTask.on('state_changed', (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(prev => ({ ...prev, [clinic.id]: percent }));
      }, (err) => {
        console.error('Upload error', err);
        setToast({ message: 'Upload failed. Please try again.', type: 'error' });
        setUploadProgress(prev => ({ ...prev, [clinic.id]: 0 }));
      }, async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        // update clinic document (store both legacy `profilePicture` and `photoURL` fields)
        await updateDoc(doc(db, 'clinics', clinic.id), { photoURL: url, profilePicture: url });
        // update local state
        setClinics(prev => prev.map(c => c.id === clinic.id ? { ...c, photoURL: url } : c));
        setToast({ message: 'Photo uploaded successfully', type: 'success' });
        setUploadProgress(prev => ({ ...prev, [clinic.id]: 0 }));
      });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Upload failed. Please try again.', type: 'error' });
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
          {/* Success Message */}
          {successMessage && (
            <div className={styles.successBanner}>
              <div className={styles.successBadge}>✓</div>
              <span className={styles.successText}>{successMessage}</span>
            </div>
          )}

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

          {/* Clinics List */}
          <div className={`${styles.stack} ${styles.rowStack} ${styles.rowStackRight}`}>
            {loading ? (
              <div className={`${styles.vcCardLarge} ${styles.centerText}`}>
                <LoadingSpinner size="large" message="Loading your clinics..." />
              </div>
              ) : clinics.length === 0 ? (
              <div className={`${styles.vcCardLarge} ${styles.centerText}`}>
                <div className={styles.heroCircle}>
                  <MapPin size={40} color="#818cf8" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>No clinics registered yet</h3>
                <p style={{ color: '#6b7280', marginBottom: '18px' }}>Add your first clinic to get started with VetConnect</p>
                <button onClick={handleAddClinic} className={`${styles.vcPrimaryAction}`} style={{ marginTop: '8px' }}>
                  <Plus size={20} />
                  ADD CLINIC
                </button>
              </div>
            ) : (
                <>
                  {clinics.map((clinic) => (
                    <div key={clinic.id} className={`${styles.clinicCard} ${styles.clinicCardCompact}`}>
                      <div className={styles.clinicPhoto}>
                          {clinic.photoURL ? (
                            <img src={clinic.photoURL} alt={`${clinic.clinicName} photo`} />
                          ) : (
                            <div className={styles.clinicInitials}>{(clinic.clinicName || 'CL').split(' ').map(n => n[0]).join('').slice(0,2)}</div>
                          )}
                        </div>

                      <div className={styles.clinicMeta}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                          <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '4px', color: '#1f2937' }}>{clinic.clinicName}</h3>
                            <p className={styles.sectionDescription}>Clinic Branch</p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <label htmlFor={`photo-input-${clinic.id}`} className={`${styles.vcSmallBtn}`}>
                              Upload Photo
                            </label>
                            <input id={`photo-input-${clinic.id}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(e, clinic)} />
                          </div>
                        </div>

                        <div className={styles.infoGrid}>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</p>
                            <p className="text-gray-800 break-words">{clinic.address}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact</p>
                            <p className="text-gray-800 break-words font-medium">{clinic.contactNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Schedule</p>
                            <p className="text-gray-800 break-words">{clinic.openHours}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Services Offered</p>
                            <p className="text-gray-800 break-words">{clinic.services}</p>
                          </div>
                          {clinic.description && (
                            <div className={styles.vcCard}>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                              <p className="text-gray-700 text-sm break-words">{clinic.description}</p>
                            </div>
                          )}
                        </div>

                        {/* Upload progress */}
                        {uploadProgress[clinic.id] > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <div className={styles.progressTrack}>
                              <div className={styles.progressFill} style={{ width: `${uploadProgress[clinic.id]}%` }} />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '6px' }}>{uploadProgress[clinic.id]}%</div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button onClick={() => handleEditClinic(clinic)} className={`${styles.vcSmallBtn} ${styles.vcPrimarySmall}`}>
                            <Edit size={16} />
                            EDIT
                          </button>
                          <button onClick={() => handleDeleteClick(clinic)} className={`${styles.vcSmallBtn} ${styles.vcDangerBtn}`}>
                            <Trash2 size={16} />
                            DELETE
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) handleCancelDelete(); }}>
          <div className={styles.modalContent} style={{ maxWidth: '480px', padding: 24 }}>
            <div className={styles.deleteBadge}>
              <Trash2 size={32} color="#ef4444" />
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>Delete Clinic?</h3>

            <p style={{ color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>
              Are you sure you want to delete <span style={{ fontWeight: '700', color: '#1f2937' }}>{deleteConfirm.clinicName}</span>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={handleCancelDelete} className={styles.vcNeutralBtn}>Cancel</button>
              <button onClick={handleConfirmDelete} className={`${styles.vcSmallBtn} ${styles.vcDangerBtn}`}>Delete Clinic</button>
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
