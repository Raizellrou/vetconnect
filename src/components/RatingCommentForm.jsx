import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from '../styles/Dashboard.module.css';

export default function RatingCommentForm({ onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onDone && onDone({ rating, comment });
  };

  return (
    <form className={styles.appointmentCard} onSubmit={submit}>
      <div className={styles.ratingFormContent}>
        <h3 className={styles.editTitle}>Rate your visit</h3>
        
        <div className={styles.starRating}>
          {[1,2,3,4,5].map((s)=> (
            <button 
              key={s} 
              type="button" 
              className={`${styles.starBtn} ${s <= rating ? styles.active : ''}`}
              onClick={() => setRating(s)}
              aria-label={`Rate ${s} stars`}
            >
              <Star 
                size={20} 
                fill={s <= rating ? '#f59e0b' : 'none'} 
                strokeWidth={1.5}
                color={s <= rating ? '#f59e0b' : '#94a3b8'}
              />
            </button>
          ))}
        </div>

        <div className={styles.commentWrapper}>
          <textarea 
            className={styles.commentInput}
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            placeholder="Add a comment (optional)"
            rows={3}
          />
          <div className={styles.ratingFormActions}>
            <button type="submit" className={styles.doneButton}>
              Done
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
