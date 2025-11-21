import React from 'react';
import { XCircle, Star, Eye, Trash2 } from 'lucide-react';
import styles from '../styles/Dashboard.module.css';

export default function AppointmentCard({ id, clinicName, petName, date, time, status, onClick, onCancelClick, onRateClick, onViewClick, onDeleteClick, hasReview }) {
  const canCancel = ['pending', 'confirmed'].includes(status);
  const canDelete = status === 'rejected' && onDeleteClick;
  const canRate = status === 'completed' && !hasReview && onRateClick; // Only if not reviewed AND onRateClick exists
  
  return (
    <div className={`${styles.appointmentCard} ${styles[status]}`} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e)=>{ if(e.key === 'Enter') onClick && onClick(); }}>
      <div className={styles.cardLeft}>
        <div className={styles.clinicName}>{clinicName}</div>
      </div>

      <div className={styles.cardMiddle}>
        <div className={styles.petName}>{petName}</div>
      </div>

      <div className={styles.cardDate}>{date}</div>
      <div className={styles.cardTime}>{time}</div>

      <div className={styles.cardActions} onClick={(e)=>e.stopPropagation()}>
        {canRate && (
          <button 
            className={styles.iconBtn} 
            title="Rate & Review" 
            onClick={onRateClick}
            style={{ color: '#fbbf24' }}
          >
            <Star size={18} />
          </button>
        )}
        
        {status === 'completed' && (
          <button 
            className={styles.iconBtn} 
            title="View Details" 
            onClick={onViewClick}
          >
            <Eye size={18} />
          </button>
        )}
        
        {canCancel && (
          <button 
            className={`${styles.iconBtn} ${styles.iconBtnDelete}`} 
            title="Cancel Appointment" 
            onClick={onCancelClick}
          >
            <XCircle size={18} />
          </button>
        )}
        
        {canDelete && (
          <button 
            className={`${styles.iconBtn} ${styles.iconBtnDelete}`} 
            title="Delete Appointment" 
            onClick={onDeleteClick}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
