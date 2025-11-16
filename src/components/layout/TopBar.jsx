import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Clock, Check, X, UserCircle, Building2, Dog, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { markNotificationAsRead, clearNotifications } from '../../firebase/firestoreHelpers';
import { orderBy } from 'firebase/firestore';
import { handleNotificationClick } from '../../utils/notificationHandlers';
import styles from '../../styles/TopBar.module.css';

export default function TopBar({ username }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const { logout, userData, currentUser } = useAuth();
  const navigate = useNavigate();

  // Real-time notifications listener
  const {
    docs: notifications = [],
    loading: notificationsLoading
  } = useCollection(
    currentUser?.uid ? `users/${currentUser.uid}/notifications` : null,
    [],
    [orderBy('createdAt', 'desc')]
  );

  // Count unread notifications
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  const computeInitials = (name) => {
    if (!name) return 'U';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    return parts[0].charAt(0).toUpperCase();
  };

  const initials = computeInitials(username);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleViewProfile = () => {
    setShowDropdown(false);
    // Navigate based on user role
    const isClinicOwner = userData?.role === 'clinicOwner' || userData?.role === 'clinicStaff';
    navigate(isClinicOwner ? '/clinic/profile' : '/profile');
  };

  const handleEditProfile = () => {
    setShowDropdown(false);
    // Navigate based on user role
    const isClinicOwner = userData?.role === 'clinicOwner' || userData?.role === 'clinicStaff';
    navigate(isClinicOwner ? '/clinic/edit-profile' : '/edit-profile');
  };

  const markAsRead = async (notificationId) => {
    if (!currentUser?.uid) return;
    
    try {
      await markNotificationAsRead(currentUser.uid, notificationId);
      console.log('Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const unreadNotifications = notifications.filter(n => n.status === 'unread');
      await Promise.all(
        unreadNotifications.map(n => markNotificationAsRead(currentUser.uid, n.id))
      );
      console.log('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleClearAll = async () => {
    if (!currentUser?.uid) return;
    
    if (!window.confirm('Are you sure you want to clear all notifications?')) {
      return;
    }
    
    try {
      await clearNotifications(currentUser.uid);
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      alert('Failed to clear notifications. Please try again.');
    }
  };

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (notification) => {
    const type = notification.data?.type || '';
    const title = notification.title?.toLowerCase() || '';
    
    if (type === 'appointment_status' || title.includes('confirmed') || title.includes('approved')) {
      return <Check size={18} style={{ color: '#22c55e' }} />;
    } else if (type === 'appointment_reminder' || title.includes('reminder')) {
      return <Clock size={18} style={{ color: '#f59e0b' }} />;
    } else if (type === 'new_appointment' || title.includes('new appointment')) {
      return <Bell size={18} style={{ color: '#3b82f6' }} />;
    } else if (title.includes('rejected') || title.includes('cancelled')) {
      return <X size={18} style={{ color: '#ef4444' }} />;
    } else if (type === 'daily_schedule') {
      return <Calendar size={18} style={{ color: '#8b5cf6' }} />;
    } else {
      return <Bell size={18} style={{ color: '#6b7280' }} />;
    }
  };

  const handleNotificationItemClick = async (notif) => {
    // Mark as read if unread
    if (notif.status === 'unread') {
      await markAsRead(notif.id);
    }

    // Close notification panel
    setShowNotifications(false);

    // Handle navigation based on notification type
    handleNotificationClick(notif, navigate, userData);
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.inner}>
        <div className={styles.right}>
          <div className={styles.notificationWrapper} ref={notificationRef}>
            <button
              className={styles.notificationBtn}
              aria-label="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className={styles.notificationPanel}>
                <div className={styles.notificationHeader}>
                  <h3 className={styles.notificationTitle}>Notifications</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {unreadCount > 0 && (
                      <button
                        className={styles.markAllBtn}
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        className={styles.markAllBtn}
                        onClick={handleClearAll}
                        style={{ color: '#ef4444' }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.notificationList}>
                  {notificationsLoading ? (
                    <div className={styles.emptyState}>
                      <p>Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className={styles.emptyState}>
                      <Bell size={32} className={styles.emptyIcon} />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`${styles.notificationItem} ${notif.status === 'unread' ? styles.unread : styles.read}`}
                        onClick={() => handleNotificationItemClick(notif)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={styles.notifIcon}>
                          {getNotificationIcon(notif)}
                        </div>
                        <div className={styles.notifContent}>
                          <div className={styles.notifTitle}>{notif.title}</div>
                          <div className={styles.notifMessage}>{notif.body}</div>
                          {/* Show clinic name for clinic owners */}
                          {notif.data?.clinicName && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#9ca3af', 
                              marginTop: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Building2 size={12} />
                              {notif.data.clinicName}
                            </div>
                          )}
                          {/* Show pet name for pet owners */}
                          {notif.data?.petName && (
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: '#9ca3af', 
                              marginTop: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Dog size={12} />
                              {notif.data.petName}
                            </div>
                          )}
                          <div className={styles.notifTime}>
                            {formatNotificationTime(notif.createdAt)}
                          </div>
                        </div>
                        {notif.status === 'unread' && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            background: '#3b82f6',
                            borderRadius: '50%',
                            flexShrink: 0,
                            marginTop: '6px'
                          }}></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.userBoxWrapper} ref={dropdownRef}>
            <div
              className={styles.userBox}
              role="button"
              tabIndex={0}
              title={username}
              onClick={() => setShowDropdown(!showDropdown)}
              onKeyDown={(e) => e.key === 'Enter' && setShowDropdown(!showDropdown)}
            >
              <div className={styles.avatar}>{initials}</div>
            </div>

            {showDropdown && (
              <div className={styles.dropdown}>
                <button className={styles.dropdownItem} onClick={handleViewProfile}>
                  <UserCircle size={18} />
                  <span>View Profile</span>
                </button>
                <button className={styles.dropdownItem} onClick={handleEditProfile}>
                  <User size={18} />
                  <span>Edit Profile</span>
                </button>
                <div className={styles.dropdownDivider}></div>
                <button className={styles.dropdownItem} onClick={handleLogout}>
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
