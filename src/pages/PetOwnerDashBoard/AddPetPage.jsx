import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Plus } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import TopBar from '../../components/layout/TopBar';
import { useAuth } from '../../contexts/AuthContext';
import AddPetModal from '../../components/AddPetModal';
import PetCard from '../../components/PetCard';
import { useCollection } from '../../hooks/useCollection';
import styles from '../../styles/Dashboard.module.css';

export default function AddPetPage() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  // Real-time pets listener
  const { docs: pets = [], loading: petsLoading } = useCollection(
    currentUser ? `users/${currentUser.uid}/pets` : null
  );

  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />

        <main className={styles.mainContent}>
          {/* Header */}
          <div className={styles.welcomeBanner}>
            <div className={styles.bannerMeta}>
              <span>Pets</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 className={styles.welcomeTitle}>My Pets</h1>
                <p style={{ color: 'white', marginTop: '4px', fontSize: '1rem', fontWeight: 500 }}>
                  Manage your furry friends and their information
                </p>
              </div>
              
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.35)';
                }}
              >
                <Plus size={20} strokeWidth={2.5} />
                Add Pet
              </button>
            </div>
          </div>

          {/* Loading State */}
          {petsLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                border: '4px solid #e5e7eb',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ fontSize: '1rem', color: '#6b7280' }}>Loading your pets...</p>
            </div>
          )}

          {/* Empty State */}
          {!petsLoading && pets.length === 0 && (
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '40px 24px', 
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 20px' 
              }}>
                <PawPrint size={40} color="#3b82f6" strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>
                No pets yet
              </h3>
              <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                Add your first pet to start managing their appointments and medical records
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.35)';
                }}
              >
                <Plus size={20} strokeWidth={2.5} />
                Add Your First Pet
              </button>
            </div>
          )}

          {/* Pets Grid */}
          {!petsLoading && pets.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
              gap: '16px' 
            }}>
              {pets.map((pet) => (
                <PetCard 
                  key={pet.id} 
                  pet={pet} 
                  userId={currentUser?.uid} 
                  onEdit={setEditingPet}
                  canUpload={false}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Pet Modal */}
      <AddPetModal open={showAddModal} onClose={() => setShowAddModal(false)} />

      {/* Edit Pet Modal */}
      {editingPet && (
        <AddPetModal
          open={!!editingPet}
          onClose={() => setEditingPet(null)}
          petId={editingPet.id}
          initialData={editingPet}
        />
      )}
    </div>
  );
}

