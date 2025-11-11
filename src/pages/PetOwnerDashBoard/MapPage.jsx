import React from 'react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/MapPage.module.css';

export default function MapPage() {
  const { userData } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  return (
    <div className={styles.pageRoot}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />

        <main className={styles.content}>
          <header className={styles.headerRow}>
            <h2 className={styles.title}>Map</h2>
            <div className={styles.subtitle}>Current Location</div>
          </header>

          <section className={styles.mapCard}>
            <div className={styles.mapContainer}>
              {/* Search bar overlay */}
              <div className={styles.searchBar}>
                <input className={styles.searchInput} placeholder="Search Location" />
              </div>

              {/* Mock markers - decorative, replace with real map markers later */}
              <div className={`${styles.marker} ${styles.markerTop}`}>PaoPaws</div>
              <div className={`${styles.marker} ${styles.markerCenter}`}>Maxwell Clinic</div>
              <div className={`${styles.marker} ${styles.markerRight}`}>Basilio Clinic</div>

              {/* Controls */}
              <div className={styles.mapControls}>
                <button className={styles.controlBtn}>◌</button>
                <div className={styles.zoomBtns}>
                  <button className={styles.controlBtn}>+</button>
                  <button className={styles.controlBtn}>−</button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
