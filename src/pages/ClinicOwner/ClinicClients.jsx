import React, { useState, useEffect } from 'react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Search, Phone, Mail, Calendar, Dog, FileText, Eye, Loader } from 'lucide-react';
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
          <header style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', margin: '0 0 8px 0' }}>
              Clients & Pet Records
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              Manage client information and pet medical records
            </p>
          </header>

          {/* Search Bar */}
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '16px 20px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Search size={20} color="#64748b" />
            <input
              type="text"
              placeholder="Search by client name, email, or pet name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '1rem',
                color: '#1e293b'
              }}
            />
          </div>

          {/* Clients Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '24px'
          }}>
            {filteredClients.map((client) => (
              <div 
                key={client.id}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid #f1f5f9',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => setSelectedClient(client)}
              >
                {/* Client Header */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #f1f5f9'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 700
                  }}>
                    {client.ownerName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '1.125rem', 
                      fontWeight: 600,
                      color: '#1e293b'
                    }}>
                      {client.ownerName}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                      Member since {client.joinDate ? new Date(client.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                    </p>
                  </div>
                </div>

                {/* Contact Info */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '0.875rem',
                    color: '#64748b'
                  }}>
                    <Mail size={16} />
                    <span>{client.email}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '0.875rem',
                    color: '#64748b'
                  }}>
                    <Phone size={16} />
                    <span>{client.phone}</span>
                  </div>
                </div>

                {/* Pets Section */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <Dog size={18} color="#3b82f6" />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                      Pets ({client.pets.length})
                    </span>
                  </div>
                  {client.pets.map((pet, index) => (
                    <div 
                      key={index}
                      style={{
                        padding: '10px 12px',
                        background: 'white',
                        borderRadius: '8px',
                        marginBottom: index < client.pets.length - 1 ? '8px' : 0
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <p style={{ 
                            margin: '0 0 2px 0', 
                            fontWeight: 600, 
                            fontSize: '0.875rem',
                            color: '#1e293b'
                          }}>
                            {pet.name}
                          </p>
                          <p style={{ 
                            margin: 0, 
                            fontSize: '0.75rem', 
                            color: '#64748b' 
                          }}>
                            {pet.breed} • {pet.age}
                          </p>
                        </div>
                        <div style={{
                          padding: '4px 10px',
                          background: '#eff6ff',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#3b82f6'
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
                  gap: '12px'
                }}>
                  <div style={{
                    background: '#f0fdf4',
                    padding: '12px',
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <p style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '1.5rem', 
                      fontWeight: 700,
                      color: '#22c55e'
                    }}>
                      {client.totalVisits}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                      Total Visits
                    </p>
                  </div>
                  <div style={{
                    background: '#fef3c7',
                    padding: '12px',
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}>
                    <p style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '0.875rem', 
                      fontWeight: 600,
                      color: '#f59e0b'
                    }}>
                      {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                      Last Visit
                    </p>
                  </div>
                </div>

                {/* View Details Button */}
                <button style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                >
                  <Eye size={16} />
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
              padding: '60px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <Users size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', color: '#64748b' }}>
                {clients.length === 0 ? 'No clients yet' : 'No clients found'}
              </h3>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                {clients.length === 0 
                  ? 'When pet owners book appointments at your clinic, they will appear here as clients.'
                  : 'Try adjusting your search terms'}
              </p>
            </div>
          )}

          {/* Client Details Modal (Simple) */}
          {selectedClient && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px'
              }}
              onClick={() => setSelectedClient(null)}
            >
              <div 
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  maxWidth: '600px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflow: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 700 }}>
                  {selectedClient.ownerName}
                </h2>
                
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>
                    CONTACT INFORMATION
                  </h3>
                  <p style={{ margin: '0 0 8px 0' }}><strong>Email:</strong> {selectedClient.email}</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>Phone:</strong> {selectedClient.phone}</p>
                  <p style={{ margin: 0 }}><strong>Address:</strong> {selectedClient.address}</p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>
                    PETS
                  </h3>
                  {selectedClient.pets.map((pet, index) => (
                    <div key={index} style={{
                      padding: '16px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      marginBottom: '12px'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600 }}>
                        {pet.name}
                      </h4>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#64748b' }}>
                        <strong>Species:</strong> {pet.species}
                      </p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#64748b' }}>
                        <strong>Breed:</strong> {pet.breed}
                      </p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#64748b' }}>
                        <strong>Age:</strong> {pet.age}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                        <strong>Last Visit:</strong> {pet.lastVisit ? new Date(pet.lastVisit).toLocaleDateString() : 'No visits yet'}
                      </p>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setSelectedClient(null)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#64748b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
