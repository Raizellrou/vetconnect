import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Users, DollarSign, UserCog, BarChart3, Settings, MapPin, FileText, ClipboardList } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import styles from '../../styles/ClinicDashboard.module.css';

export default function ClinicOwnerDashboard() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);

  const displayName = userData?.fullName || userData?.displayName || userData?.clinicName || userData?.email;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!userData) return <p>Loading...</p>;

  // Dashboard navigation cards data
  const dashboardSections = [
    {
      id: 'appointments',
      title: 'Appointments',
      description: 'Manage and confirm pet bookings',
      icon: Calendar,
      color: '#818cf8',
      path: '/clinic/appointments',
      stats: '12 Pending'
    },
    {
      id: 'clients',
      title: 'Clients / Pet Records',
      description: 'View, add, and edit client profiles',
      icon: Users,
      color: '#22c55e',
      path: '/clinic/clients',
      stats: '48 Active'
    },
    {
      id: 'services',
      title: 'Services & Pricing',
      description: 'Configure veterinary services and rates',
      icon: DollarSign,
      color: '#f97316',
      path: '/clinic/services',
      stats: '15 Services'
    },
    {
      id: 'staff',
      title: 'Staff Management',
      description: 'Manage veterinarians and support staff',
      icon: UserCog,
      color: '#a78bfa',
      path: '/clinic/staff',
      stats: '8 Staff'
    },
    {
      id: 'reports',
      title: 'Reports / Analytics',
      description: 'Monitor booking data and metrics',
      icon: BarChart3,
      color: '#06b6d4',
      path: '/clinic/reports',
      stats: 'View Insights'
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Manage account info and business hours',
      icon: Settings,
      color: '#64748b',
      path: '/clinic/settings',
      stats: 'Configure'
    }
  ];

  return (
    <div className={styles.dashboard}>
      <ClinicSidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        
        <main className={styles.mainContent}>
          {/* Welcome Banner */}
          <div className={styles.welcomeBanner}>
            <div className={styles.bannerMeta}>
              <span>Clinic Dashboard</span>
              <span className={styles.bulletPoint}>•</span>
              <span className={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <h1 className={styles.welcomeTitle}>Welcome back, {displayName}! 🏥</h1>
            <p className={styles.welcomeSubtitle}>
              <button 
                onClick={() => setShowTutorial(true)}
                className={styles.instructionsLink}
              >
                Instructions: How to Use VetConnect
              </button>
            </p>
          </div>

          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#eef2ff' }}>
                <Calendar size={24} color="#818cf8" />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Today's Appointments</p>
                <h3 className={styles.statValue}>8</h3>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
                <Users size={24} color="#22c55e" />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Active Clients</p>
                <h3 className={styles.statValue}>48</h3>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fff7ed' }}>
                <ClipboardList size={24} color="#f97316" />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Pending Requests</p>
                <h3 className={styles.statValue}>12</h3>
              </div>
            </div>
          </div>

          {/* Dashboard Sections Grid */}
          <div className={styles.sectionsGrid}>
            {dashboardSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <div
                  key={section.id}
                  className={styles.sectionCard}
                  onClick={() => navigate(section.path)}
                >
                  <div 
                    className={styles.sectionIcon}
                    style={{ background: `${section.color}15` }}
                  >
                    <IconComponent size={28} color={section.color} />
                  </div>
                  <div className={styles.sectionContent}>
                    <h3 className={styles.sectionTitle}>{section.title}</h3>
                    <p className={styles.sectionDescription}>{section.description}</p>
                  </div>
                  <div className={styles.sectionStats}>
                    <span className={styles.statsLabel}>{section.stats}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className={styles.modalOverlay} onClick={() => setShowTutorial(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>How to Use VetConnect - Clinic Owner Guide</h2>
              <button 
                className={styles.modalCloseBtn}
                onClick={() => setShowTutorial(false)}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalIntro}>
                Welcome to VetConnect! Follow these steps to register and manage your veterinary clinic:
              </p>

              <div className={styles.instructionsList}>
                <div className={styles.instructionStep}>
                  <div className={styles.stepNumber}>
                    <span>1</span>
                  </div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Click the "Register Clinic" Button</h3>
                    <p className={styles.stepDescription}>
                      Start by clicking the registration button to begin setting up your clinic profile on VetConnect.
                    </p>
                  </div>
                </div>

                <div className={styles.instructionStep}>
                  <div className={styles.stepNumber}>
                    <MapPin size={24} />
                  </div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Find Your Location on the Map</h3>
                    <p className={styles.stepDescription}>
                      Use the interactive map to pin your clinic's exact location so pet owners can easily find you.
                    </p>
                  </div>
                </div>

                <div className={styles.instructionStep}>
                  <div className={styles.stepNumber}>
                    <FileText size={24} />
                  </div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Fill Up the Registration Form</h3>
                    <p className={styles.stepDescription}>
                      Complete the form with essential information:
                    </p>
                    <ul className={styles.stepList}>
                      <li><strong>Clinic Name</strong> - Your veterinary clinic's official name</li>
                      <li><strong>Services Offered</strong> - List all veterinary services you provide</li>
                      <li><strong>Operating Hours</strong> - Your clinic's business hours</li>
                      <li><strong>Contact Number</strong> - Phone number for appointments and inquiries</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.instructionStep}>
                  <div className={styles.stepNumber}>
                    <ClipboardList size={24} />
                  </div>
                  <div className={styles.stepContent}>
                    <h3 className={styles.stepTitle}>Submit Your Registration</h3>
                    <p className={styles.stepDescription}>
                      Review all information carefully and submit the form to complete your clinic registration. You'll be able to manage appointments right away!
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  className={styles.modalCloseButton}
                  onClick={() => setShowTutorial(false)}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
