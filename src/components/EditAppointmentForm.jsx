import React, { useState } from 'react';
import styles from '../styles/Dashboard.module.css';

export default function EditAppointmentForm({ appointment, onSave, onCancel }) {
  const [form, setForm] = useState({
    pet: appointment.petName || '',
    symptoms: appointment.symptoms || '',
    date: appointment.date || '',
    time: appointment.time || ''
  });

  const handleSave = (e) => {
    e.preventDefault();
    onSave && onSave(form);
  };

  return (
    <form onSubmit={handleSave} className={`${styles.appointmentCard} ${styles.editCard}`}>
      <div className={styles.editFormContent}>
        <h3 className={styles.editTitle}>{appointment.clinicName}</h3>

        <div className={styles.formRow}>
          <label>Pet</label>
          <input
            value={form.pet}
            onChange={(e) => setForm({ ...form, pet: e.target.value })}
            className={styles['vc-input']}
          />
        </div>

        <div className={styles.formRow}>
          <label>Symptoms</label>
          <input
            value={form.symptoms}
            onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
            className={styles['vc-input']}
          />
        </div>

        <div className={styles.formRowGrid}>
          <div>
            <label>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={styles['vc-input']}
            />
          </div>
          <div>
            <label>Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className={styles['vc-input']}
            />
          </div>
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={`${styles.btn} ${styles['btn-outline']}`}>CANCEL</button>
        <button type="submit" className={`${styles.btn} ${styles['btn-primary']}`}>SAVE CHANGES</button>
      </div>
    </form>
  );
}
