import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/TopBar.module.css';

export default function TopBar({ username }) {
  const { currentUser } = useAuth();

  return (
    <div className={styles.topbar}>
      <div className={styles.searchBar}>
        {/* ...existing search content... */}
      </div>

      <div className={styles.userSection}>
        {/* Notifications Bell */}
        <button
          style={{
            padding: '10px',
            background: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Bell size={20} />
        </button>

        {/* User Profile */}
        <div className={styles.userProfile}>
          <span className={styles.userName}>{username}</span>
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}
