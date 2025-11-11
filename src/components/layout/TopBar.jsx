import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Clock, Check, X, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/TopBar.module.css';

export default function TopBar({ username }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Mock notifications data - replace with real data later
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Appointment Confirmed',
      message: 'Your appointment with Animal Care Clinic has been confirmed for Nov 3, 2025',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'pending',
      title: 'Appointment Pending',
      message: 'Your appointment request is waiting for approval from Pet Wellness Center',
      time: '5 hours ago',
      read: false
    },
    {
      id: 3,
      type: 'info',
      title: 'Medical Record Updated',
      message: 'New medical record has been added for Max',
      time: '1 day ago',
      read: true
    }
  ]);

  const computeInitials = (name) => {
    if (!name) return 'U';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
    // TODO: Navigate to view profile page
    navigate('/profile');
  };

  const handleEditProfile = () => {
    setShowDropdown(false);
    // TODO: Navigate to edit profile page
    navigate('/edit-profile');
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <Check size={18} className={styles.iconSuccess} />;
      case 'pending': return <Clock size={18} className={styles.iconPending} />;
      default: return <Bell size={18} className={styles.iconInfo} />;
    }
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
                        className={`${styles.notificationItem} ${notif.read ? styles.read : styles.unread}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className={styles.notifIcon}>
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className={styles.notifContent}>
                          <div className={styles.notifTitle}>{notif.title}</div>
                          <div className={styles.notifMessage}>{notif.message}</div>
                          <div className={styles.notifTime}>{notif.time}</div>
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
