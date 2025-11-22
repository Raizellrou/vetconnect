import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import ImageUploader from '../../components/ImageUploader';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/EditProfile.module.css';

export default function EditProfile() {
  const { userData, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  const [formData, setFormData] = useState({
    fullName: userData?.fullName || userData?.displayName || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
  });

  const [photoURL, setPhotoURL] = useState(userData?.photoURL || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getInitials = (name) => {
    if (!name) return 'U';
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

  const handlePhotoUpload = (cloudinaryUrl) => {
    setPhotoURL(cloudinaryUrl);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Pass photoURL directly (already uploaded to Cloudinary)
      await updateUserProfile({ ...formData, photoURL });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Navigate back to profile after a short delay
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  return (
    <div className={styles.pageRoot}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />

        <main className={styles.content}>
          <header className={styles.headerRow}>
            <div className={styles.breadcrumb}>
              <span onClick={() => navigate('/profile')} className={styles.breadcrumbLink}>Profile</span>
              <span className={styles.bullet}>•</span>
              <span>Edit Profile</span>
            </div>
            <h2 className={styles.title}>Edit Profile</h2>
          </header>

          <form onSubmit={handleSubmit} className={styles.profileCard}>
            <div className={styles.photoSection}>
              <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                <ImageUploader
                  onUpload={handlePhotoUpload}
                  currentImage={photoURL}
                  label="Upload Profile Photo"
                  aspectRatio="1/1"
                />
              </div>
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
