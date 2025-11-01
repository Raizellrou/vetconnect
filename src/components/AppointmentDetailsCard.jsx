import React from 'react';
import { PenSquare, Trash2 } from 'lucide-react';
import styles from '../styles/Dashboard.module.css';

export default function AppointmentDetailsCard({ appointment, onEdit, onDelete }) {
  if (!appointment) return null;

  return (
    <div className={styles.appointmentCard}>
      <div style={{flex:1}}>
        <h3 className={styles.editTitle}>{appointment.clinicName}</h3>
        <p><strong>Pet:</strong> {appointment.petName}</p>
        <p><strong>Symptoms:</strong> {appointment.symptoms}</p>
        <p><strong>Date:</strong> {appointment.date}</p>
        <p><strong>Time:</strong> {appointment.time}</p>
      </div>
      <div className={styles.cardActions}>
        <button className={styles.iconBtn} title="Edit" onClick={onEdit}>
          <PenSquare size={18} />
        </button>
        <button className={`${styles.iconBtn} ${styles.iconBtnDelete}`} title="Delete" onClick={onDelete}>
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
