import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Calendar, Edit } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/Profile.module.css';

export default function Profile() {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const displayName = userData?.fullName || userData?.displayName || userData?.email;
  const email = userData?.email || '';
  const phone = userData?.phone || 'Not provided';
  const address = userData?.address || 'Not provided';
  const joinDate = userData?.createdAt?.toDate?.().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) || 'N/A';

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className={styles.pageRoot}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />

        <main className={styles.content}>
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

          <div className={styles.profileCard}>
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
                  <p className={styles.userRole}>Pet Owner</p>
                </div>
              </div>
              <button 
                className={styles.editBtn}
                onClick={() => navigate('/edit-profile')}
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
    </div>
  );
}
