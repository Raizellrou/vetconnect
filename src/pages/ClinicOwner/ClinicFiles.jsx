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
          {/* Enhanced Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '24px 28px',
            marginBottom: '24px',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                <FileText size={28} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 700, 
                  color: 'white', 
                  margin: '0 0 4px 0',
                  letterSpacing: '-0.02em'
                }}>
                  Client Pet Files
                </h1>
                <p style={{ fontSize: '0.9375rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                  View medical records and files uploaded by pet owners for their pets
                </p>
              </div>
            </div>
          </div>

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
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '60px 40px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <FileText size={48} color="#a855f7" strokeWidth={2} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    No Files Yet
                  </h3>
                  <p style={{ fontSize: '0.9375rem', color: '#64748b', margin: 0, maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Files uploaded by your clients will appear here. Encourage pet owners to upload medical records for better care.
                  </p>
                </div>
              ) : (
                <div className={styles.stack}>
                  {clientsWithPets.map((client) => (
                    <div key={client.ownerId} style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.15)';
                      e.currentTarget.style.borderColor = '#667eea';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}>
                      {/* Client Header */}
                      <div style={{ 
                        marginBottom: '16px', 
                        paddingBottom: '16px', 
                        borderBottom: '2px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <User size={22} color="white" strokeWidth={2.5} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.0625rem', fontWeight: 700, color: '#1e293b' }}>
                            {client.ownerName}
                          </h3>
                          {client.ownerEmail && (
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {client.ownerEmail}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Pets List */}
                      {client.pets.length === 0 ? (
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                          No pets registered yet
                        </p>
                      ) : (
                        <div className={styles.stack}>
                          {client.pets.map((pet) => (
                            <div key={pet.id} style={{
                              background: '#f8fafc',
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              overflow: 'hidden',
                              transition: 'all 0.2s'
                            }}>
                              {/* Pet Header - Clickable */}
                              <div
                                onClick={() => togglePetExpanded(pet.id)}
                                style={{
                                  padding: '14px 16px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  background: expandedPets[pet.id] ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' : 'transparent',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  if (!expandedPets[pet.id]) {
                                    e.currentTarget.style.background = '#f1f5f9';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!expandedPets[pet.id]) {
                                    e.currentTarget.style.background = 'transparent';
                                  }
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}>
                                    <Dog size={20} color="white" strokeWidth={2.5} />
                                  </div>
                                  <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b' }}>
                                      {pet.name || pet.pet_name}
                                    </h4>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                                      {pet.species} • {pet.breed || 'Mixed'} • {pet.gender}
                                    </p>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{
                                    padding: '5px 12px',
                                    background: pet.files && pet.files.length > 0 
                                      ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' 
                                      : '#f3f4f6',
                                    color: pet.files && pet.files.length > 0 ? '#1e40af' : '#6b7280',
                                    borderRadius: '999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    border: pet.files && pet.files.length > 0 ? '1px solid #93c5fd' : '1px solid #e5e7eb'
                                  }}>
                                    {pet.files?.length || 0} {pet.files?.length === 1 ? 'file' : 'files'}
                                  </span>
                                  {expandedPets[pet.id] ? (
                                    <ChevronUp size={20} color="#64748b" strokeWidth={2.5} />
                                  ) : (
                                    <ChevronDown size={20} color="#64748b" strokeWidth={2.5} />
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
