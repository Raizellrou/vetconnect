import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, Users, DollarSign, UserCog, BarChart3, Settings, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/ClinicSidebar.module.css';
import vetconnectLogo from '../../assets/logo.png';

export default function ClinicSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img src={vetconnectLogo} alt="VetConnect" className={styles.logo} />
        <span className={styles.brandName}>VETCONNECT</span>
      </div>

      <nav className={styles.nav}>
        <NavLink 
          to="/clinic-dashboard" 
          className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.active : ''}`}
          end
        >
          <Home size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink 
          to="/clinic/appointments" 
          className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.active : ''}`}
        >
          <Calendar size={20} />
          <span>Appointments</span>
        </NavLink>

        <NavLink 
          to="/clinic/clients" 
          className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.active : ''}`}
        >
          <Users size={20} />
          <span>Clients</span>
        </NavLink>

        <NavLink 
          to="/clinic/staff" 
          className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.active : ''}`}
        >
          <UserCog size={20} />
          <span>Staff</span>
        </NavLink>

        <NavLink 
          to="/clinic/management" 
          className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.active : ''}`}
        >
          <Building2 size={20} />
          <span>Clinics</span>
        </NavLink>
      </nav>

      <div className={styles.settingsWrapper}>
        <NavLink 
          to="/clinic/settings" 
          className={({ isActive }) => `${styles.navBtn} ${isActive ? styles.active : ''}`}
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
