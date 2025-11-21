import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import layoutStyles from '../../styles/ClinicDashboard.module.css';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/EditProfile.module.css';

export default function ClinicEditProfile() {
  const { userData, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const displayName = userData?.fullName || userData?.displayName || userData?.clinicName || userData?.email;

  const [formData, setFormData] = useState({
    fullName: userData?.fullName || userData?.displayName || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    clinicName: userData?.clinicName || '',
    portfolio: userData?.portfolio || '',
  });

  const [photoURL, setPhotoURL] = useState(userData?.photoURL || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }

      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result);
      };
      reader.readAsDataURL(file);
      setMessage({ type: '', text: '' });
    }
  };

  const handleRemovePhoto = () => {
    setPhotoURL('');
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateUserProfile(formData, photoFile);
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Navigate back to profile after a short delay
      setTimeout(() => {
        navigate('/clinic/profile');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/clinic/profile');
  };

  return (
    <div className={layoutStyles.dashboard}>
      <ClinicSidebar />
      <div className={layoutStyles.mainWrapper}>
        <TopBar username={displayName} />

        <main className={layoutStyles.mainContent}>
          <header className={styles.headerRow}>
            <div className={styles.breadcrumb}>
              <span onClick={() => navigate('/clinic/profile')} className={styles.breadcrumbLink}>Profile</span>
              <span className={styles.bullet}>•</span>
              <span>Edit Profile</span>
            </div>
            <h2 className={styles.title}>Edit Profile</h2>
          </header>

          <form onSubmit={handleSubmit} className={`${styles.profileCard} ${layoutStyles.vcCard}`}>
            <div className={styles.photoSection}>
              <div className={styles.photoWrapper}>
                <div className={styles.avatarLarge}>
                  {photoURL ? (
                    <>
                      <img src={photoURL} alt="Profile" className={styles.avatarImg} />
                      <button
                        type="button"
                        className={styles.removePhotoBtn}
                        onClick={handleRemovePhoto}
                        title="Remove photo"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <span className={styles.avatarInitials}>{getInitials(formData.fullName)}</span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={handlePhotoClick}
                >
                  <Upload size={18} />
                  Upload Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </div>
              <p className={styles.photoHint}>Recommended: Square image, at least 400x400px (Max 5MB)</p>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Personal Information</h3>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="fullName" className={styles.label}>
                    Full Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="clinicName" className={styles.label}>
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    id="clinicName"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Your Clinic Name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email Address <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={styles.input}
                    required
                    disabled
                  />
                  <p className={styles.hint}>Email cannot be changed</p>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.label}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="+63 XXX XXX XXXX"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="address" className={styles.label}>
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="Street, City, Province"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="portfolio" className={styles.label}>
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    id="portfolio"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="https://your-portfolio-website.com"
                  />
                </div>
              </div>
            </div>

            {message.text && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}

            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
