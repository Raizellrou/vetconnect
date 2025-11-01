import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Bookmark, FileText, Settings } from 'lucide-react';
import styles from '../../styles/Sidebar.module.css';

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
    </Link>
  );

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <NavLink to="/owner-dashboard" icon={Home} label="Home" />
        <NavLink to="/map" icon={MapPin} label="Map" />
        <NavLink to="/saved" icon={Bookmark} label="Saved" />
        <NavLink to="/files" icon={FileText} label="Files" />
      </nav>

      <button 
        className={styles.navBtn} 
        aria-label="Settings"
        onClick={() => {/* TODO: Toggle settings menu */}}
      >
        <Settings size={20} />
      </button>
    </aside>
  );
}
