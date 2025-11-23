import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Users, DollarSign, UserCog, BarChart3, Settings, MapPin, FileText, ClipboardList, ChevronDown, Building2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getAllClinics, getActiveClinic, setActiveClinic } from '../../utils/clinicStorage';
import { checkAndSendReminders, clearOldReminderFlags } from '../../utils/appointmentReminders';
import styles from '../../styles/ClinicDashboard.module.css';

export default function ClinicOwnerDashboard() {
  const { userData, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showClinicDropdown, setShowClinicDropdown] = useState(false);

  const displayName = userData?.fullName || userData?.displayName || userData?.clinicName || userData?.email;

  useEffect(() => {
    loadClinics();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    // Clear old reminder flags
    clearOldReminderFlags();
    
    // Check and send reminders
    checkAndSendReminders(currentUser.uid, 'clinicOwner');
  }, [currentUser]);

  const loadClinics = () => {
    const allClinics = getAllClinics();
    setClinics(allClinics);
    
    const active = getActiveClinic();
    if (active) {
      setSelectedClinic(active);
    } else if (allClinics.length > 0) {
      setSelectedClinic(allClinics[0]);
      setActiveClinic(allClinics[0].id);
    }
  };

  const handleClinicSelect = (clinic) => {
    setSelectedClinic(clinic);
    setActiveClinic(clinic.id);
    setShowClinicDropdown(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!userData) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <LoadingSpinner size="large" message="Loading..." />
    </div>
  );

  // Dashboard navigation cards data
  const dashboardSections = [
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

          {/* Register Clinic Button - Only shows when no clinics registered */}
          {clinics.length === 0 && (
            <div className={styles.sectionSpacing}>
              <button
                onClick={() => navigate('/clinic/management')}
                className={styles.vcPrimaryAction}
              >
                <Building2 size={18} strokeWidth={2.5} />
                <span>Register Your First Clinic</span>
              </button>
            </div>
          )}

          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#eef2ff' }}>
                <Calendar size={20} color="#818cf8" strokeWidth={2.5} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Today's Appointments</p>
                <h3 className={styles.statValue}>8</h3>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
                <Users size={20} color="#22c55e" strokeWidth={2.5} />
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Active Clients</p>
                <h3 className={styles.statValue}>48</h3>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fff7ed' }}>
                <ClipboardList size={20} color="#f97316" strokeWidth={2.5} />
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
                    <IconComponent size={22} color={section.color} strokeWidth={2.5} />
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
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
            padding: '20px'
          }}
          onClick={() => setShowTutorial(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              animation: 'slideUp 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '28px 32px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                  <ClipboardList size={26} color="white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{
                    fontSize: '1.375rem',
                    fontWeight: 700,
                    margin: 0,
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    Clinic Owner Guide
                  </h2>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '0.875rem', 
                    opacity: 0.9 
                  }}>
                    Get started with VetConnect
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTutorial(false)}
                style={{
                  width: '38px',
                  height: '38px',
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
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
                aria-label="Close"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div 
              style={{
                padding: '32px',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                flex: 1
              }}
            >
              <p style={{
                fontSize: '1rem',
                color: '#4b5563',
                lineHeight: 1.6,
                marginBottom: '28px',
                textAlign: 'center'
              }}>
                Welcome to VetConnect! Follow these steps to register and manage your veterinary clinic:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Step 1 */}
                <div style={{
                  padding: '24px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  border: '2px solid #fcd34d',
                  borderRadius: '14px',
                  display: 'flex',
                  gap: '18px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(252, 211, 77, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}>
                    1
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: '#78350f',
                      margin: '0 0 8px 0'
                    }}>
                      Click the "Register Clinic" Button
                    </h3>
                    <p style={{
                      fontSize: '0.9375rem',
                      color: '#92400e',
                      margin: 0,
                      lineHeight: 1.6
                    }}>
                      Start by clicking the registration button to begin setting up your clinic profile on VetConnect.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{
                  padding: '24px',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  border: '2px solid #93c5fd',
                  borderRadius: '14px',
                  display: 'flex',
                  gap: '18px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(147, 197, 253, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}>
                    <MapPin size={28} color="white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: '#1e3a8a',
                      margin: '0 0 8px 0'
                    }}>
                      Find Your Location on the Map
                    </h3>
                    <p style={{
                      fontSize: '0.9375rem',
                      color: '#1e40af',
                      margin: 0,
                      lineHeight: 1.6
                    }}>
                      Use the interactive map to pin your clinic's exact location so pet owners can easily find you.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{
                  padding: '24px',
                  background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                  border: '2px solid #f9a8d4',
                  borderRadius: '14px',
                  display: 'flex',
                  gap: '18px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(249, 168, 212, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
                  }}>
                    <FileText size={28} color="white" strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: '#831843',
                      margin: '0 0 8px 0'
                    }}>
                      Fill Up the Registration Form
                    </h3>
                    <p style={{
                      fontSize: '0.9375rem',
                      color: '#9f1239',
                      margin: '0 0 12px 0',
                      lineHeight: 1.6
                    }}>
                      Complete the form with essential information:
                    </p>
                    <ul style={{
                      fontSize: '0.875rem',
                      color: '#9f1239',
                      margin: 0,
                      paddingLeft: '20px',
                      lineHeight: 1.8
                    }}>
                      <li><strong>Clinic Name</strong> - Your veterinary clinic's official name</li>
                      <li><strong>Services Offered</strong> - List all veterinary services you provide</li>
                      <li><strong>Operating Hours</strong> - Your clinic's business hours</li>
                      <li><strong>Contact Number</strong> - Phone number for appointments and inquiries</li>
                    </ul>
                  </div>
                </div>

                {/* Step 4 */}
                <div style={{
                  padding: '24px',
                  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                  border: '2px solid #6ee7b7',
                  borderRadius: '14px',
                  display: 'flex',
                  gap: '18px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(110, 231, 183, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}>
                    <ClipboardList size={28} color="white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: '#064e3b',
                      margin: '0 0 8px 0'
                    }}>
                      Submit Your Registration
                    </h3>
                    <p style={{
                      fontSize: '0.9375rem',
                      color: '#065f46',
                      margin: 0,
                      lineHeight: 1.6
                    }}>
                      Review all information carefully and submit the form to complete your clinic registration. You'll be able to manage appointments right away!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 32px',
              background: '#f9fafb',
              borderTop: '2px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button 
                onClick={() => setShowTutorial(false)}
                style={{
                  padding: '12px 32px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: 'white',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                Got it!
              </button>
            </div>
          </div>

          <style>{`
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
          `}</style>
        </div>
      )}
    </div>
  );
}
