import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Clock, Check, X, UserCircle, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../../firebase/firestoreHelpers';
import { deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import styles from '../../styles/TopBar.module.css';

export default function TopBar({ username }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const { logout, userData, currentUser } = useAuth();
  const navigate = useNavigate();

  // Real-time notifications from Firestore
  const { docs: notifications = [], loading: notificationsLoading } = useCollection(
    currentUser?.uid ? `users/${currentUser.uid}/notifications` : null,
    [],
    [orderBy('createdAt', 'desc')]
  );

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

  const markAsRead = async (id) => {
    if (!currentUser?.uid) return;
    try {
      await markNotificationAsRead(currentUser.uid, id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser?.uid) return;
    try {
      await markAllNotificationsAsRead(currentUser.uid);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    if (!currentUser?.uid) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  // Helper function to get relative time
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (notification) => {
    const title = notification.title?.toLowerCase() || '';
    const body = notification.body?.toLowerCase() || '';
    
    if (title.includes('confirmed') || title.includes('approved')) {
      return (
        <div className={styles.iconWrapperSuccess}>
          <Check size={20} strokeWidth={2.5} />
        </div>
      );
    }
    if (title.includes('cancelled') || title.includes('rejected')) {
      return (
        <div className={styles.iconWrapperError}>
          <X size={20} strokeWidth={2.5} />
        </div>
      );
    }
    if (title.includes('pending') || title.includes('waiting')) {
      return (
        <div className={styles.iconWrapperPending}>
          <Clock size={20} strokeWidth={2.5} />
        </div>
      );
    }
    if (title.includes('appointment') || body.includes('appointment')) {
      return (
        <div className={styles.iconWrapperInfo}>
          <Calendar size={20} strokeWidth={2.5} />
        </div>
      );
    }
    return (
      <div className={styles.iconWrapperInfo}>
        <AlertCircle size={20} strokeWidth={2.5} />
      </div>
    );
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
                <span className={styles.badge}>{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className={styles.notificationPanel}>
                <div className={styles.notificationHeader}>
                  <h3 className={styles.notificationTitle}>Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      className={styles.markAllBtn}
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <div className={styles.emptyState}>
                      <Bell size={32} className={styles.emptyIcon} />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`${styles.notificationItem} ${notif.status === 'read' ? styles.read : styles.unread}`}        
                        onClick={() => markAsRead(notif.id)}
                      >
                        {getNotificationIcon(notif)}
                        <div className={styles.notifContent}>
                          <div className={styles.notifTitle}>{notif.title}</div>
                          <div className={styles.notifMessage}>{notif.body}</div>
                          <div className={styles.notifTime}>{getRelativeTime(notif.createdAt)}</div>
                        </div>
                        <button
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                        >
                          <X size={16} />
                        </button>
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
