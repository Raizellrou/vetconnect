import React from 'react';
import { X, Map, MapPin, Calendar, Clock, MessageSquare } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

export default function InstructionsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>How to Use VetConnect</h2>
          <button 
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalIntro}>
            Welcome to VetConnect! Follow these simple steps to book and manage your pet's appointments:
          </p>

          <div className={styles.instructionsList}>
            <div className={styles.instructionStep}>
              <div className={styles.stepNumber}>
                <Map size={24} />
              </div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>1. Go to the Map</h3>
                <p className={styles.stepDescription}>
                  Access the map feature from the sidebar to view all nearby veterinary clinics in your area.
                </p>
              </div>
            </div>

            <div className={styles.instructionStep}>
              <div className={styles.stepNumber}>
                <MapPin size={24} />
              </div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>2. Locate a Clinic</h3>
                <p className={styles.stepDescription}>
                  Browse through the available clinics and select your preferred veterinary clinic from the options shown.
                </p>
              </div>
            </div>

            <div className={styles.instructionStep}>
              <div className={styles.stepNumber}>
                <Calendar size={24} />
              </div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>3. Book an Appointment</h3>
                <p className={styles.stepDescription}>
                  Choose a date and time that fits your schedule, provide your pet's information and symptoms.
                </p>
              </div>
            </div>

            <div className={styles.instructionStep}>
              <div className={styles.stepNumber}>
                <Clock size={24} />
              </div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>4. Wait for Approval</h3>
                <p className={styles.stepDescription}>
                  The clinic will review and confirm your appointment request. You'll see the status update on your dashboard.
                </p>
              </div>
            </div>

            <div className={styles.instructionStep}>
              <div className={styles.stepNumber}>
                <MessageSquare size={24} />
              </div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>5. After the Appointment</h3>
                <p className={styles.stepDescription}>
                  Share your experience by leaving a comment and rating to help other pet owners make informed decisions.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button 
              className={styles.modalCloseButton}
              onClick={onClose}
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
