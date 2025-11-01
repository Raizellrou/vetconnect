import React from 'react';
import styles from '../styles/Dashboard.module.css';

export default function AppointmentStatusLegend({ rejectedLabel = 'Rejected', pendingLabel = 'Pending' }) {
  return (
    <div className={styles.statusList}>
      <div className={styles.statusItem}><span className={`${styles.statusDot} ${styles.ready}`}></span><span className={styles.statusText}>Ready</span></div>
      <div className={styles.statusItem}><span className={`${styles.statusDot} ${styles.rejected}`}></span><span className={styles.statusText}>{rejectedLabel}</span></div>
      <div className={styles.statusItem}><span className={`${styles.statusDot} ${styles.pending}`}></span><span className={styles.statusText}>{pendingLabel}</span></div>
      <div className={styles.statusItem}><span className={`${styles.statusDot} ${styles.finished}`}></span><span className={styles.statusText}>Finished</span></div>
    </div>
  );
}
