import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Bookmark, Settings, PawPrint } from 'lucide-react';
import styles from '../../styles/Sidebar.module.css';
import logo from '../../assets/logo.png';

export default function Sidebar() {
  const location = useLocation();
  const path = location.pathname;

  const NavLink = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`${styles.navBtn} ${path === to ? styles.active : ''}`}
      aria-label={label}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img src={logo} alt="VetConnect logo" className={styles.logo} />
        <span className={styles.brandName}>VetConnect</span>
      </div>

      <nav className={styles.nav}>
        <NavLink to="/owner-dashboard" icon={Home} label="Home" />
        <NavLink to="/map" icon={MapPin} label="Map" />
        <NavLink to="/pets" icon={PawPrint} label="Pets" />
        <NavLink to="/saved" icon={Bookmark} label="Saved" />
      </nav>

      <div className={styles.settingsWrapper}>
        <NavLink to="/settings" icon={Settings} label="Settings" />
      </div>
    </aside>
  );
}
