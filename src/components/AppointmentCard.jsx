import React from 'react';
import { PenSquare, Trash2, Star } from 'lucide-react';
import styles from '../styles/Dashboard.module.css';

export default function AppointmentCard({ id, clinicName, petName, date, time, status, onClick, onEditClick, onRateClick, onDeleteClick }) {
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
        {status === 'finished' ? (
          <button className={styles.iconBtn} title="Rate" onClick={onRateClick}>
            <Star size={18} />
          </button>
        ) : (
          <button className={styles.iconBtn} title="Edit" onClick={onEditClick}>
            <PenSquare size={18} />
          </button>
        )}
        <button className={`${styles.iconBtn} ${styles.iconBtnDelete}`} title="Delete" onClick={onDeleteClick}>
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
