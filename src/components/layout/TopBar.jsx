import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import styles from '../../styles/TopBar.module.css';
import logo from '../../assets/logo.png';

export default function TopBar({ username }) {
  const computeInitials = (name) => {
    if (!name) return 'U';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = computeInitials(username);

  return (
    <header className={styles.topBar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link to="/" className={styles.brand}>
            <img src={logo} alt="VetConnect" className={styles.logo} />
            <span className={styles.brandName}>VETCONNECT</span>
          </Link>
        </div>

        <div className={styles.right}>
          <button className={styles.notificationBtn} aria-label="Notifications">
            <Bell size={20} />
          </button>

          <div className={styles.userBox} role="button" tabIndex={0}>
            <div className={styles.avatar}>{initials}</div>
            <span className={styles.username}>{username}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
