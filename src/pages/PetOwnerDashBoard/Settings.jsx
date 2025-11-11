import React, { useState } from 'react';
import { Bell, Mail, Shield, Globe, HelpCircle } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/Settings.module.css';

export default function Settings() {
  const { userData } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem('email-notifications') !== 'false';
  });

  const [pushNotifications, setPushNotifications] = useState(() => {
    return localStorage.getItem('push-notifications') !== 'false';
  });

  const [appointmentReminders, setAppointmentReminders] = useState(() => {
    return localStorage.getItem('appointment-reminders') !== 'false';
  });

  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState(() => {
    return localStorage.getItem('profile-visibility') || 'clinics-only';
  });

  const [shareLocationData, setShareLocationData] = useState(() => {
    return localStorage.getItem('share-location') !== 'false';
  });

  // Language
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const handleToggle = (setting, value, setter) => {
    setter(value);
    localStorage.setItem(setting, value.toString());
  };

  return (
    <div className={styles.pageRoot}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />

        <main className={styles.content}>
          <header className={styles.headerRow}>
            <div className={styles.breadcrumb}>
              <span>Settings</span>
              <span className={styles.bullet}>•</span>
              <span className={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <h2 className={styles.title}>Settings</h2>
          </header>

          {/* Notification Settings */}
          <section className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.headerIcon}>
                <Bell size={20} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Notifications</h3>
                <p className={styles.cardDescription}>Manage how you receive notifications</p>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Email Notifications</div>
                <div className={styles.settingDesc}>Receive notifications via email</div>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => handleToggle('email-notifications', e.target.checked, setEmailNotifications)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Push Notifications</div>
                <div className={styles.settingDesc}>Receive push notifications in your browser</div>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => handleToggle('push-notifications', e.target.checked, setPushNotifications)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Appointment Reminders</div>
                <div className={styles.settingDesc}>Get reminded about upcoming appointments</div>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={appointmentReminders}
                  onChange={(e) => handleToggle('appointment-reminders', e.target.checked, setAppointmentReminders)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </section>

          {/* Privacy & Security */}
          <section className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.headerIcon}>
                <Shield size={20} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Privacy & Security</h3>
                <p className={styles.cardDescription}>Control your privacy and data sharing</p>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Profile Visibility</div>
                <div className={styles.settingDesc}>Who can see your profile information</div>
              </div>
              <select
                className={styles.select}
                value={profileVisibility}
                onChange={(e) => {
                  setProfileVisibility(e.target.value);
                  localStorage.setItem('profile-visibility', e.target.value);
                }}
              >
                <option value="clinics-only">Clinics Only</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Share Location Data</div>
                <div className={styles.settingDesc}>Allow clinics to see your approximate location</div>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={shareLocationData}
                  onChange={(e) => handleToggle('share-location', e.target.checked, setShareLocationData)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </section>

          {/* Language & Region */}
          <section className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.headerIcon}>
                <Globe size={20} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Language & Region</h3>
                <p className={styles.cardDescription}>Set your preferred language</p>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabel}>Language</div>
                <div className={styles.settingDesc}>Choose your display language</div>
              </div>
              <select
                className={styles.select}
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  localStorage.setItem('language', e.target.value);
                }}
              >
                <option value="en">English</option>
                <option value="tl">Tagalog</option>
                <option value="ceb">Cebuano</option>
              </select>
            </div>
          </section>

          {/* Help & Support */}
          <section className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.headerIcon}>
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Help & Support</h3>
                <p className={styles.cardDescription}>Get help and learn more about VetConnect</p>
              </div>
            </div>

            <div className={styles.helpLinks}>
              <a href="#" className={styles.helpLink}>
                <Mail size={18} />
                <div>
                  <div className={styles.helpLinkTitle}>Contact Support</div>
                  <div className={styles.helpLinkDesc}>Get help from our support team</div>
                </div>
              </a>
              <a href="#" className={styles.helpLink}>
                <HelpCircle size={18} />
                <div>
                  <div className={styles.helpLinkTitle}>Help Center</div>
                  <div className={styles.helpLinkDesc}>Browse FAQs and guides</div>
                </div>
              </a>
            </div>
          </section>

          {/* App Version */}
          <div className={styles.versionInfo}>
            <p>VetConnect v1.0.0</p>
            <p className={styles.copyright}>© 2025 VetConnect. All rights reserved.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
