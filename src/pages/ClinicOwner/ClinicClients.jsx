import React, { useState, useEffect } from 'react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Search, Phone, Mail, Calendar, Dog, FileText, Eye, Loader, MapPin, User } from 'lucide-react';
import styles from '../../styles/ClinicDashboard.module.css';
import { collection, getDocs, query as firestoreQuery, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ClinicClients() {
  const { userData, currentUser } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.clinicName || userData?.email;

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  // Fetch clients and their pets
  useEffect(() => {
    const fetchClientsAndPets = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);

        // Get all clinics owned by this user
        const clinicsQuery = firestoreQuery(
          collection(db, 'clinics'),
          where('ownerId', '==', currentUser.uid)
        );
        const clinicsSnapshot = await getDocs(clinicsQuery);
        const clinicIds = clinicsSnapshot.docs.map(doc => doc.id);

        if (clinicIds.length === 0) {
          setClients([]);
          setLoading(false);
          return;
        }

        // Get all appointments for these clinics
        const appointmentsQuery = firestoreQuery(
          collection(db, 'appointments'),
          where('clinicId', 'in', clinicIds)
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        
        // Group appointments by owner
        const ownerAppointments = {};
        appointmentsSnapshot.docs.forEach(doc => {
          const apt = { id: doc.id, ...doc.data() };
          const ownerId = apt.ownerId;
          if (!ownerAppointments[ownerId]) {
            ownerAppointments[ownerId] = [];
          }
          ownerAppointments[ownerId].push(apt);
        });

        // Fetch owner and pet details
        const clientsData = await Promise.all(
          Object.keys(ownerAppointments).map(async (ownerId) => {
            try {
              // Fetch owner details
              const ownerRef = doc(db, 'users', ownerId);
              const ownerSnap = await getDoc(ownerRef);
              
              if (!ownerSnap.exists()) {
                return null;
              }

              const ownerData = ownerSnap.data();
              const appointments = ownerAppointments[ownerId];

              // Fetch pets for this owner
              const petsQuery = firestoreQuery(
                collection(db, 'users', ownerId, 'pets')
              );
              const petsSnapshot = await getDocs(petsQuery);
              const pets = petsSnapshot.docs.map(petDoc => {
                const petData = petDoc.data();
                
                // Find appointments for this pet
                const petAppointments = appointments.filter(apt => apt.petId === petDoc.id);
                
                // Get last visit date
                let lastVisit = null;
                if (petAppointments.length > 0) {
                  const sortedApts = petAppointments
                    .filter(apt => apt.status === 'completed')
                    .sort((a, b) => {
                      const dateA = a.dateTime?.toDate ? a.dateTime.toDate() : new Date(a.dateTime);
                      const dateB = b.dateTime?.toDate ? b.dateTime.toDate() : new Date(b.dateTime);
                      return dateB - dateA;
                    });
                  
                  if (sortedApts.length > 0) {
                    lastVisit = sortedApts[0].dateTime?.toDate 
                      ? sortedApts[0].dateTime.toDate() 
                      : new Date(sortedApts[0].dateTime);
                  }
                }

                // Calculate age
                let age = 'Unknown';
                if (petData.dateOfBirth) {
                  const birthDate = petData.dateOfBirth.toDate 
                    ? petData.dateOfBirth.toDate() 
                    : new Date(petData.dateOfBirth);
                  const years = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
                  const months = Math.floor((new Date() - birthDate) / (30.44 * 24 * 60 * 60 * 1000)) % 12;
                  
                  if (years > 0) {
                    age = `${years} year${years !== 1 ? 's' : ''}`;
                    if (months > 0 && years < 3) {
                      age += ` ${months} month${months !== 1 ? 's' : ''}`;
                    }
                  } else if (months > 0) {
                    age = `${months} month${months !== 1 ? 's' : ''}`;
                  } else {
                    age = 'Less than a month';
                  }
                }

                return {
                  id: petDoc.id,
                  name: petData.name || 'Unknown',
                  species: petData.species || 'Unknown',
                  breed: petData.breed || 'Unknown',
                  age: age,
                  lastVisit: lastVisit
                };
              });

              // Calculate total visits (completed appointments)
              const totalVisits = appointments.filter(apt => apt.status === 'completed').length;

              // Get overall last visit
              const completedAppointments = appointments
                .filter(apt => apt.status === 'completed')
                .sort((a, b) => {
                  const dateA = a.dateTime?.toDate ? a.dateTime.toDate() : new Date(a.dateTime);
                  const dateB = b.dateTime?.toDate ? b.dateTime.toDate() : new Date(b.dateTime);
                  return dateB - dateA;
                });

              const lastVisit = completedAppointments.length > 0
                ? (completedAppointments[0].dateTime?.toDate 
                    ? completedAppointments[0].dateTime.toDate() 
                    : new Date(completedAppointments[0].dateTime))
                : null;

              // Get join date (first appointment date)
              const firstAppointment = [...appointments].sort((a, b) => {
                const dateA = a.dateTime?.toDate ? a.dateTime.toDate() : new Date(a.dateTime);
                const dateB = b.dateTime?.toDate ? b.dateTime.toDate() : new Date(b.dateTime);
                return dateA - dateB;
              })[0];

              const joinDate = firstAppointment?.dateTime?.toDate 
                ? firstAppointment.dateTime.toDate() 
                : new Date(firstAppointment?.dateTime || Date.now());

              return {
                id: ownerId,
                ownerName: ownerData.fullName || ownerData.displayName || ownerData.email || 'Unknown',
                email: ownerData.email || 'No email',
                phone: ownerData.phoneNumber || 'No phone',
                address: ownerData.address || 'No address provided',
                joinDate: joinDate,
                pets: pets,
                totalVisits: totalVisits,
                lastVisit: lastVisit
              };
            } catch (error) {
              console.error(`Error fetching data for owner ${ownerId}:`, error);
              return null;
            }
          })
        );

        // Filter out null values and set clients
        const validClients = clientsData.filter(client => client !== null);
        setClients(validClients);
        console.log('Fetched clients:', validClients);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientsAndPets();
  }, [currentUser]);

  const filteredClients = clients.filter(client =>
    client.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.pets.some(pet => pet.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <ClinicSidebar />
        <div className={styles.mainWrapper}>
          <TopBar username={displayName} />
          <main className={styles.mainContent}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
              <LoadingSpinner size="large" message="Loading clients..." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <ClinicSidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        
        <main className={styles.mainContent}>
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
                <Users size={28} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 700, 
                  color: 'white', 
                  margin: '0 0 4px 0',
                  letterSpacing: '-0.02em'
                }}>
                  Clients & Pet Records
                </h1>
                <p style={{ fontSize: '0.9375rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                  Manage client information and pet medical records
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            border: '2px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
          }}>
            <Search size={20} color="#6366f1" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Search by client name, email, or pet name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '0.9375rem',
                color: '#1e293b',
                background: 'transparent'
              }}
            />
          </div>

          {/* Clients Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px'
          }}>
            {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(99, 102, 241, 0.15)';
                    e.currentTarget.style.borderColor = '#6366f1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  {/* Client Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}>
                    {client.ownerName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '1.0625rem', 
                      fontWeight: 700,
                      color: '#1e293b'
                    }}>
                      {client.ownerName}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                      Member since {client.joinDate ? new Date(client.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                    </p>
                  </div>
                  </div>

                {/* Contact Info */}
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    fontSize: '0.8125rem',
                    color: '#64748b'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#ede9fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Mail size={16} color="#6366f1" strokeWidth={2.5} />
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    fontSize: '0.8125rem',
                    color: '#64748b'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#ede9fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Phone size={16} color="#6366f1" strokeWidth={2.5} />
                    </div>
                    <span>{client.phone}</span>
                  </div>
                </div>

                {/* Pets Section */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    borderRadius: '10px'
                  }}>
                    <Dog size={18} color="#1e40af" strokeWidth={2.5} />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e40af' }}>
                      {client.pets.length} {client.pets.length === 1 ? 'Pet' : 'Pets'}
                    </span>
                  </div>
                  {client.pets.map((pet, index) => (
                    <div 
                      key={index}
                      style={{
                        padding: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        marginBottom: index < client.pets.length - 1 ? '8px' : 0
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ 
                            margin: '0 0 4px 0', 
                            fontWeight: 700, 
                            fontSize: '0.875rem',
                            color: '#1e293b'
                          }}>
                            {pet.name}
                          </p>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '0.75rem', 
                            color: '#64748b',
                            fontWeight: 500
                          }}>
                            {pet.breed} • {pet.age}
                          </p>
                        </div>
                        <div style={{
                          padding: '5px 12px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          borderRadius: '999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                          flexShrink: 0
                        }}>
                          {pet.species}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)',
                    padding: '14px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #a78bfa'
                  }}>
                    <p style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '1.75rem', 
                      fontWeight: 700,
                      color: '#5b21b6',
                      lineHeight: 1
                    }}>
                      {client.totalVisits}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.6875rem', color: '#6b21a8', fontWeight: 600 }}>
                      Total Visits
                    </p>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
                    padding: '14px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid #fb923c'
                  }}>
                    <p style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '1.75rem', 
                      fontWeight: 700,
                      color: '#c2410c',
                      lineHeight: 1
                    }}>
                      {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.6875rem', color: '#7c2d12', fontWeight: 600 }}>
                      Last Visit
                    </p>
                  </div>
                </div>

                {/* View Details Button */}
                <button 
                  onClick={() => setSelectedClient(client)}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
                  }}
                >
                  <Eye size={18} strokeWidth={2.5} />
                  View Full Details
                </button>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredClients.length === 0 && (
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
                background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}>
                <Users size={48} color="#6366f1" strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                {clients.length === 0 ? 'No clients yet' : 'No clients found'}
              </h3>
              <p style={{ fontSize: '0.9375rem', color: '#64748b', margin: 0, maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                {clients.length === 0 
                  ? 'When pet owners book appointments at your clinic, they will appear here as clients.'
                  : 'Try adjusting your search terms to find the client you\'re looking for.'}
              </p>
            </div>
          )}

          {/* Client Details Modal */}
          {selectedClient && (
            <div className={styles.modalOverlay} onClick={() => setSelectedClient(null)}>
              <div className={`${styles.modalContent} ${styles.clientModal}`} onClick={(e) => e.stopPropagation()}>
                {/* Client Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--vc-border)'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--vc-primary) 0%, var(--vc-primary-hover) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.25rem',
                    fontWeight: 700
                  }}>
                    <User size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 2px 0', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                      {selectedClient.ownerName}
                    </h2>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>
                      Owner
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748b' }}>
                      Client since {selectedClient.joinDate ? new Date(selectedClient.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                    </p>
                  </div>
                </div>

                {/* Contact & Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  {/* Contact Information */}
                  <div>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--vc-text-dark)',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Mail size={16} color="var(--vc-primary)" />
                      Contact
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--vc-text-muted)' }}>
                        <strong style={{ color: 'var(--vc-text-dark)' }}>Email:</strong> {selectedClient.email}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--vc-text-muted)' }}>
                        <strong style={{ color: 'var(--vc-text-dark)' }}>Phone:</strong> {selectedClient.phone}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--vc-text-muted)' }}>
                        <strong style={{ color: 'var(--vc-text-dark)' }}>Address:</strong> {selectedClient.address}
                      </div>
                    </div>
                  </div>

                  {/* Client Stats */}
                  <div>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--vc-text-dark)',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Calendar size={16} color="var(--vc-primary)" />
                      Summary
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{
                        background: 'var(--vc-bg-card)',
                        padding: '8px 12px',
                        borderRadius: 'var(--vc-card-radius)',
                        border: '1px solid var(--vc-border)',
                        textAlign: 'center'
                      }}>
                        <p style={{ margin: '0 0 2px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--vc-primary)' }}>
                          {selectedClient.totalVisits}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--vc-text-muted)' }}>
                          Total Visits
                        </p>
                      </div>
                      <div style={{
                        background: 'var(--vc-bg-card)',
                        padding: '8px 12px',
                        borderRadius: 'var(--vc-card-radius)',
                        border: '1px solid var(--vc-border)',
                        textAlign: 'center'
                      }}>
                        <p style={{ margin: '0 0 2px 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--vc-text-dark)' }}>
                          {selectedClient.lastVisit ? new Date(selectedClient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--vc-text-muted)' }}>
                          Last Visit
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pets Section */}
                <div>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--vc-text-dark)',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Dog size={16} color="var(--vc-primary)" />
                    Pets ({selectedClient.pets.length})
                  </h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {selectedClient.pets.map((pet, index) => (
                      <div key={index} style={{
                        background: 'var(--vc-bg-card)',
                        padding: '12px',
                        borderRadius: 'var(--vc-card-radius)',
                        border: '1px solid var(--vc-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--vc-primary) 0%, var(--vc-primary-hover) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}>
                            <Dog size={16} />
                          </div>
                          <div>
                            <p style={{ margin: '0 0 2px 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--vc-text-dark)' }}>
                              {pet.name}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--vc-text-muted)' }}>
                              {pet.species} • {pet.breed} • {pet.age}
                            </p>
                          </div>
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--vc-text-muted)',
                          textAlign: 'right'
                        }}>
                          <p style={{ margin: 0, fontWeight: 500 }}>
                            Last: {pet.lastVisit ? new Date(pet.lastVisit).toLocaleDateString() : 'None'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                  <button onClick={() => setSelectedClient(null)} className={`${styles.vcPrimarySmall} ${styles.vcSmallBtn}`}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
