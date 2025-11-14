import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, BookmarkX, Star, Calendar } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/SavedClinics.module.css';

const dummyClinic = {
  id: 'p1',
  name: 'PaoPaws Clinic',
  owner: 'Dr. Maria Cristina Santos, D.V.M.',
  title: 'Clinic Owner',
  rating: 4.1,
  saves: 1000,
  description: 'PaoPaws Clinic in Laoag City is a caring veterinary facility offering preventive care, check-ups, diagnosis, and treatment for pets. The clinic provides comprehensive health services to support the well-being and longevity of animals in the local community.',
  services: [
    {
      name: 'Wellness',
      description: 'In a veterinary clinic, wellness service refers to a set of preventive care measures designed to maintain a pet\'s health and catch problems early. These typically include routine check-ups, vaccinations, dental care, parasite prevention, and blood tests, all aimed at supporting long-term well-being and preventing disease in pets.'
    }
  ],
  reviews: [
    {
      name: 'Charles Erick Ramos',
      avatar: 'L',
      rating: 3.5,
      comment: 'PaoPaws Clinic provided excellent service and my pet recovered quickly. Friendly staff and clean facilities.'
    }
  ]
};

export default function ClinicDetails() {
  const [tab, setTab] = useState('overview');
  const { userData } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.email;
  const navigate = useNavigate();

  const handleBookAppointment = () => {
    navigate('/book-appointment', { 
      state: { 
        clinic: dummyClinic 
      } 
    });
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        <main className={styles.page}>
          <header className={styles.headerRow}>
            <h2 className={styles.title}>Saved</h2>
            <div className={styles.subtitle}>Clinic Details</div>
          </header>

          <section className={styles.detailsCard}>
            <div className={styles.banner} />

            <div className={styles.cardHeader}>
              <div>
                <h1 className={styles.clinicName}>{dummyClinic.name}</h1>
                <div className={styles.owner}>{dummyClinic.owner}</div>

                <div className={styles.statRow}>
                  <div className={styles.statItem}><Star size={14} color="#f59e0b" /> <strong>{dummyClinic.rating}</strong> Ratings</div>
                  <div className={styles.statItem}>🔖 <strong>{dummyClinic.saves}</strong> Saves</div>
                </div>
              </div>

              <div className={styles.headerActions}>
            <button className={styles.iconBtn}><MapPin size={20} /></button>
            <button className={`${styles.iconBtn} ${styles.savedBtn}`}><BookmarkX size={20} /></button>
          </div>
        </div>            <div className={styles.tabBar}>
              <button className={`${styles.tabBtn} ${tab === 'overview' ? styles.activeTab : ''}`} onClick={() => setTab('overview')}>Overview</button>
              <button className={`${styles.tabBtn} ${tab === 'services' ? styles.activeTab : ''}`} onClick={() => setTab('services')}>Services</button>
              <button className={`${styles.tabBtn} ${tab === 'reviews' ? styles.activeTab : ''}`} onClick={() => setTab('reviews')}>Reviews</button>
            </div>

            <div className={styles.tabContent}>
              {tab === 'overview' && (
                <div>
                  <p className={styles.overviewText}>{dummyClinic.description}</p>
                  
                  <div style={{
                    marginTop: '40px',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '0 24px'
                  }}>
                    <button
                      onClick={handleBookAppointment}
                      style={{
                        padding: '14px 40px',
                        background: '#06b6d4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(6, 182, 212, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        letterSpacing: '0.3px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#0891b2';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#06b6d4';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(6, 182, 212, 0.25)';
                      }}
                    >
                      <Calendar size={20} />
                      BOOK APPOINTMENT
                    </button>
                  </div>
                </div>
              )}

              {tab === 'services' && (
                <div className={styles.servicesList}>
                  {dummyClinic.services.map((service, index) => (
                    <div key={index} className={styles.serviceCard}>
                      <h4>{service.name}</h4>
                      <p>{service.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'reviews' && (
                <div className={styles.reviewsList}>
                  {dummyClinic.reviews.map((review, index) => (
                    <div key={index} className={styles.reviewItem}>
                      <div className={styles.avatar}>{review.avatar}</div>
                      <div className={styles.reviewContent}>
                        <div className={styles.reviewHeader}>
                          {review.name} <span className={styles.rating}><Star size={14} color="#f59e0b" /> {review.rating} Stars</span>
                        </div>
                        <p>{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
