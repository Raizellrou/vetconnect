import React, { useState } from 'react';
import { Star, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { addReview } from '../firebase/firestoreHelpers';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/Dashboard.module.css';

export default function RatingCommentForm({ clinicId, appointmentId, onDone }) {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!currentUser?.uid) {
      setError('You must be logged in to submit a review');
      return;
    }

    if (!clinicId) {
      setError('Clinic information is missing');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await addReview(currentUser.uid, clinicId, {
        rating,
        comment: comment.trim(),
        appointmentId: appointmentId || null,
      });

      console.log('Review submitted successfully');
      setSuccess(true);

      // Reset form after short delay
      setTimeout(() => {
        setRating(0);
        setComment('');
        onDone && onDone({ rating, comment });
      }, 1500);
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${styles.appointmentCard} ${styles.editCard}`}>
      <div className={styles.editFormContent}>
        <h3 className={styles.editTitle}>Rate Your Experience</h3>
        
        {/* Success Message */}
        {success && (
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            border: '2px solid #6ee7b7',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle size={20} color="#059669" />
            <span style={{ color: '#065f46', fontWeight: 600, fontSize: '0.875rem' }}>
              Review submitted successfully!
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '2px solid #f87171',
            borderRadius: '10px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={20} color="#dc2626" />
            <span style={{ color: '#991b1b', fontWeight: 600, fontSize: '0.875rem' }}>
              {error}
            </span>
          </div>
        )}

        {/* Rating Selection */}
        <div className={styles.formRow}>
          <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
            Rating <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '8px', fontSize: '2rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={40}
                fill={(hoveredRating || rating) >= star ? '#fbbf24' : 'none'}
                color={(hoveredRating || rating) >= star ? '#fbbf24' : '#d1d5db'}
                style={{ 
                  cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                  transition: 'all 0.2s',
                  opacity: isSubmitting ? 0.5 : 1
                }}
                onMouseEnter={() => !isSubmitting && setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => !isSubmitting && setRating(star)}
              />
            ))}
          </div>
          {rating > 0 && (
            <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
              You rated: {rating} star{rating !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className={styles.formRow}>
          <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
            Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this clinic..."
            rows={5}
            className={styles['vc-input']}
            style={{ resize: 'vertical' }}
            disabled={isSubmitting}
          />
          <p style={{ marginTop: '6px', fontSize: '0.75rem', color: '#9ca3af' }}>
            {comment.length}/500 characters
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.formActions}>
        <button 
          type="submit" 
          className={`${styles.btn} ${styles['btn-primary']}`}
          disabled={isSubmitting || success}
          style={{
            opacity: (isSubmitting || success) ? 0.6 : 1,
            cursor: (isSubmitting || success) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center'
          }}
        >
          {isSubmitting ? (
            <>
              <div style={{ width: '18px', height: '18px' }}>
                <LoadingSpinner size="small" />
              </div>
              SUBMITTING...
            </>
          ) : success ? (
            <>
              <CheckCircle size={18} />
              SUBMITTED
            </>
          ) : (
            'SUBMIT RATING'
          )}
        </button>
      </div>
    </form>
  );
}
