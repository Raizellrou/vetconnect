import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Edit, PawPrint, Loader, AlertCircle } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import styles from '../../styles/Profile.module.css';

export default function Profile() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();

  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  // Real-time pets listener
  const {
    docs: pets = [],
    loading: petsLoading,
    error: petsError
  } = useCollection(
    currentUser?.uid ? `users/${currentUser.uid}/pets` : null
  );

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className={styles.pageRoot}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        
        <main className={styles.content}>
          {/* Header */}
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

          {/* Profile Card */}
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarLarge}>
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Profile" className={styles.avatarImg} />
                  ) : (
                    <span className={styles.avatarInitials}>{getInitials(displayName)}</span>
                  )}
                </div>
                <div className={styles.profileInfo}>
                  <h3 className={styles.profileName}>{displayName}</h3>
                  <p className={styles.profileRole}>Pet Owner</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/edit-profile')}
                className={styles.editBtn}
              >
                <Edit size={18} />
                Edit Profile
              </button>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <Mail size={20} />
                </div>
                <div className={styles.infoContent}>
                  <p className={styles.infoLabel}>Email</p>
                  <p className={styles.infoValue}>{userData?.email || 'Not provided'}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <Phone size={20} />
                </div>
                <div className={styles.infoContent}>
                  <p className={styles.infoLabel}>Phone</p>
                  <p className={styles.infoValue}>{userData?.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <MapPin size={20} />
                </div>
                <div className={styles.infoContent}>
                  <p className={styles.infoLabel}>Address</p>
                  <p className={styles.infoValue}>{userData?.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pets Section - Read Only */}
          <div className={styles.petsSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <PawPrint size={24} />
                My Pets
              </h3>
            </div>

            {/* Loading State */}
            {petsLoading && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                gap: '12px'
              }}>
                <Loader size={40} color="#818cf8" className="animate-spin" />
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loading your pets...</p>
              </div>
            )}

            {/* Error State */}
            {petsError && (
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                border: '1px solid #f87171',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#991b1b', fontWeight: 600 }}>
                  {petsError.message || 'Failed to load pets'}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!petsLoading && !petsError && pets.length === 0 && (
              <div className={styles.emptyPets}>
                <div className={styles.emptyIcon}>
                  <PawPrint size={48} />
                </div>
                <h4 className={styles.emptyTitle}>No pets added yet</h4>
                <p className={styles.emptyText}>Add pets from the Pets page in the sidebar</p>
              </div>
            )}

            {/* Pets List - Read Only Display */}
            {!petsLoading && !petsError && pets.length > 0 && (
              <div className={styles.petsGrid}>
                {pets.map((pet) => (
                  <div key={pet.id} className={styles.petCardReadOnly}>
                    <div className={styles.petAvatarReadOnly}>
                      <PawPrint size={32} color="#818cf8" />
                    </div>
                    <div className={styles.petInfoReadOnly}>
                      <h4 className={styles.petNameReadOnly}>{pet.name}</h4>
                      <p className={styles.petSpeciesReadOnly}>
                        {pet.species} {pet.breed && `• ${pet.breed}`}
                      </p>
                      {pet.gender && (
                        <p className={styles.petDetailReadOnly}>Gender: {pet.gender}</p>
                      )}
                    </div>
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
