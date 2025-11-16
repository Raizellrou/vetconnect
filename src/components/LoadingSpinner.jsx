import React from 'react';
import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ size = 'medium', fullScreen = false, message = '' }) {
  const sizeClass = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large
  }[size] || styles.medium;

  const spinner = (
    <div className={styles.spinnerWrapper}>
      <div className={`${styles.spinner} ${sizeClass}`}>
        <div className={styles.circle}></div>
        <div className={styles.circle}></div>
        <div className={styles.circle}></div>
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={styles.fullScreen}>
        {spinner}
      </div>
    );
  }

  return spinner;
}
