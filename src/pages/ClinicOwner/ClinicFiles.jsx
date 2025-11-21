import React, { useState, useEffect } from 'react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Download, Dog, User, Loader, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { collection, getDocs, query as firestoreQuery, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import styles from '../../styles/ClinicDashboard.module.css';

export default function ClinicFiles() {
  const { userData, currentUser } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.clinicName || userData?.email;

  const [clientsWithPets, setClientsWithPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPets, setExpandedPets] = useState({});

  // Fetch clients and their pets with files
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        setError(null);

        // Get clinics owned by current user
        const clinicsQuery = firestoreQuery(
          collection(db, 'clinics'),
          where('ownerId', '==', currentUser.uid)
        );
        const clinicsSnapshot = await getDocs(clinicsQuery);
        
        if (clinicsSnapshot.empty) {
          setClientsWithPets([]);
          setLoading(false);
          return;
        }

        const clinicIds = clinicsSnapshot.docs.map(doc => doc.id);

        // Get appointments for these clinics
        const appointmentsQuery = firestoreQuery(
          collection(db, 'appointments'),
          where('clinicId', 'in', clinicIds)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);

        // Get unique owner IDs
        const ownerIds = [...new Set(
          appointmentsSnapshot.docs.map(doc => doc.data().ownerId).filter(Boolean)
        )];

        if (ownerIds.length === 0) {
          setClientsWithPets([]);
          setLoading(false);
          return;
        }

        // Fetch each client's data and their pets with files
        const clientsData = await Promise.all(
          ownerIds.map(async (ownerId) => {
            try {
              // Get owner data
              const ownerDoc = await getDoc(doc(db, 'users', ownerId));
              const ownerData = ownerDoc.exists() ? ownerDoc.data() : null;

              // Get pets for this owner
              const petsSnapshot = await getDocs(
                collection(db, 'users', ownerId, 'pets')
              );

              // Get files for each pet
              const petsWithFiles = await Promise.all(
                petsSnapshot.docs.map(async (petDoc) => {
                  const petData = { id: petDoc.id, ...petDoc.data() };
                  
                  // Get files for this pet
                  const filesSnapshot = await getDocs(
                    collection(db, 'users', ownerId, 'pets', petDoc.id, 'files')
                  );
                  
                  const files = filesSnapshot.docs.map(fileDoc => ({
                    id: fileDoc.id,
                    ...fileDoc.data()
                  }));

                  return {
                    ...petData,
                    files
                  };
                })
              );

              return {
                ownerId,
                ownerName: ownerData?.fullName || ownerData?.displayName || ownerData?.email || 'Unknown',
                ownerEmail: ownerData?.email || '',
                pets: petsWithFiles
              };
            } catch (err) {
              console.error(`Error fetching data for owner ${ownerId}:`, err);
              return null;
            }
          })
        );

        setClientsWithPets(clientsData.filter(Boolean));
      } catch (err) {
        console.error('Error fetching files:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const togglePetExpanded = (petId) => {
    setExpandedPets(prev => ({
      ...prev,
      [petId]: !prev[petId]
    }));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className={styles.dashboard}>
      <ClinicSidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        
        <main className={`${styles.mainContent} ${styles.pageTopLanding}`}>
          <header className={styles.noSectionTop}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
              Client Pet Files
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              View medical records and files uploaded by pet owners for their pets
            </p>
          </header>

          {/* Loading State */}
          {loading && (
            <div className={`${styles.vcCardLarge} ${styles.centeredLarge}`}>
              <Loader size={40} color="#3b82f6" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} strokeWidth={2.5} />
              <p className={styles.stepDescription} style={{ marginTop: '12px' }}>Loading client files...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={`${styles.vcCard} ${styles.vcErrorCard}`}>
              <AlertCircle size={20} color="#ef4444" strokeWidth={2.5} />
              <div>
                <h3 className={styles.stepTitle}>Error Loading Files</h3>
                <p className={styles.stepDescription}>{error}</p>
              </div>
            </div>
          )}

          {/* Clients List */}
          {!loading && !error && (
            <>
                {clientsWithPets.length === 0 ? (
                <div className={`${styles.vcCardLarge} ${styles.centerText}`}>
                  <FileText size={48} color="#d1d5db" style={{ margin: '0 auto 12px' }} strokeWidth={2.5} />
                  <h3 className={styles.stepTitle}>No Files Yet</h3>
                  <p className={styles.stepDescription}>
                    Files uploaded by your clients will appear here
                  </p>
                </div>
              ) : (
                <div className={styles.stack}>
                  {clientsWithPets.map((client) => (
                    <div key={client.ownerId} className={styles.vcCard}>
                      {/* Client Header */}
                      <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={18} color="#667eea" strokeWidth={2.5} />
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                            {client.ownerName}
                          </h3>
                        </div>
                        {client.ownerEmail && (
                          <p style={{ margin: '4px 0 0 28px', fontSize: '0.875rem', color: '#64748b' }}>
                            {client.ownerEmail}
                          </p>
                        )}
                      </div>

                      {/* Pets List */}
                      {client.pets.length === 0 ? (
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                          No pets registered yet
                        </p>
                      ) : (
                        <div className={styles.stack}>
                          {client.pets.map((pet) => (
                            <div key={pet.id} className={styles.petCard}>
                              {/* Pet Header - Clickable */}
                              <div
                                onClick={() => togglePetExpanded(pet.id)}
                                className={styles.petHeader}
                                style={{ background: expandedPets[pet.id] ? '#f1f5f9' : undefined }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <Dog size={20} color="#3b82f6" />
                                  <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                                      {pet.name || pet.pet_name}
                                    </h4>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                                      {pet.species} • {pet.breed || 'Mixed'} • {pet.gender}
                                    </p>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{
                                    padding: '4px 12px',
                                    background: pet.files && pet.files.length > 0 ? '#dbeafe' : '#f3f4f6',
                                    color: pet.files && pet.files.length > 0 ? '#1e40af' : '#6b7280',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                  }}>
                                    {pet.files?.length || 0} {pet.files?.length === 1 ? 'file' : 'files'}
                                  </span>
                                  {expandedPets[pet.id] ? (
                                    <ChevronUp size={20} color="#6b7280" />
                                  ) : (
                                    <ChevronDown size={20} color="#6b7280" />
                                  )}
                                </div>
                              </div>

                              {/* Pet Files - Expandable */}
                              {expandedPets[pet.id] && (
                                <div className={styles.petFilesContainer}>
                                  {!pet.files || pet.files.length === 0 ? (
                                    <p className={styles.centerText} style={{ color: '#64748b', fontSize: '0.875rem', padding: '20px' }}>
                                      No files uploaded for this pet yet
                                    </p>
                                  ) : (
                                    <div className={styles.stack}>
                                      {pet.files.map((file) => (
                                        <div key={file.id} className={styles.uploadItem}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                            <FileText size={20} color="#3b82f6" />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <p style={{
                                                margin: '0 0 4px 0',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                color: '#1e293b',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                              }}>
                                                {file.name}
                                              </p>
                                              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                                                {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                                              </p>
                                            </div>
                                          </div>
                                          <a
                                            href={file.downloadURL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.downloadBtn}
                                            title="View file"
                                          >
                                            <Download size={16} />
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
