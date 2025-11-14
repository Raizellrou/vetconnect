import React, { useState } from 'react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Search, Phone, Mail, Calendar, Dog, FileText, Eye } from 'lucide-react';
import styles from '../../styles/ClinicDashboard.module.css';

export default function ClinicClients() {
  const { userData } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.clinicName || userData?.email;

  // Dummy clients data
  const [clients] = useState([
    {
      id: 'client-1',
      ownerName: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 (555) 123-4567',
      address: '123 Oak Street, Springfield, IL',
      joinDate: '2024-01-15',
      pets: [
        {
          name: 'Max',
          species: 'Dog',
          breed: 'Golden Retriever',
          age: '3 years',
          lastVisit: '2024-11-14'
        }
      ],
      totalVisits: 12,
      lastVisit: '2024-11-14'
    },
    {
      id: 'client-2',
      ownerName: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 (555) 234-5678',
      address: '456 Maple Avenue, Springfield, IL',
      joinDate: '2024-03-20',
      pets: [
        {
          name: 'Bella',
          species: 'Cat',
          breed: 'Persian',
          age: '2 years',
          lastVisit: '2024-11-15'
        },
        {
          name: 'Luna',
          species: 'Cat',
          breed: 'Siamese',
          age: '4 years',
          lastVisit: '2024-10-28'
        }
      ],
      totalVisits: 8,
      lastVisit: '2024-11-15'
    },
    {
      id: 'client-3',
      ownerName: 'Mike Davis',
      email: 'mike.davis@email.com',
      phone: '+1 (555) 345-6789',
      address: '789 Pine Road, Springfield, IL',
      joinDate: '2024-06-10',
      pets: [
        {
          name: 'Charlie',
          species: 'Dog',
          breed: 'Beagle',
          age: '5 years',
          lastVisit: '2024-11-16'
        }
      ],
      totalVisits: 5,
      lastVisit: '2024-11-16'
    },
    {
      id: 'client-4',
      ownerName: 'Emily Brown',
      email: 'emily.brown@email.com',
      phone: '+1 (555) 456-7890',
      address: '321 Elm Street, Springfield, IL',
      joinDate: '2024-08-05',
      pets: [
        {
          name: 'Rocky',
          species: 'Dog',
          breed: 'German Shepherd',
          age: '1 year',
          lastVisit: '2024-11-10'
        },
        {
          name: 'Whiskers',
          species: 'Cat',
          breed: 'Maine Coon',
          age: '3 years',
          lastVisit: '2024-11-12'
        }
      ],
      totalVisits: 4,
      lastVisit: '2024-11-12'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const filteredClients = clients.filter(client =>
    client.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.pets.some(pet => pet.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                      Member since {new Date(client.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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
                      {new Date(client.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
              <h3 style={{ margin: '0 0 8px 0', color: '#64748b' }}>No clients found</h3>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                Try adjusting your search terms
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
                        <strong>Last Visit:</strong> {new Date(pet.lastVisit).toLocaleDateString()}
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
