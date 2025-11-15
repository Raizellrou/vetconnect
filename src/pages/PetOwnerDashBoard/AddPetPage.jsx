import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Plus, Edit, Calendar, Weight, User } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import TopBar from '../../components/layout/TopBar';
import { useAuth } from '../../contexts/AuthContext';
import AddPetModal from '../../components/AddPetModal';
import { useCollection } from '../../hooks/useCollection';
import { updatePet } from '../../lib/firebaseMutations';
import styles from '../../styles/Dashboard.module.css';

export default function AddPetPage() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [editingLoading, setEditingLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Real-time pets listener
  const { docs: pets = [], loading: petsLoading } = useCollection(
    currentUser ? `users/${currentUser.uid}/pets` : null
  );

  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  const handleEditSave = async (updates) => {
    if (!currentUser || !editingPet) return;
    
    setEditingLoading(true);
    setEditError('');
    
    try {
      const payload = {
        name: updates.name,
        species: updates.species,
        breed: updates.breed,
        dob: updates.dob ? new Date(updates.dob) : null,
        gender: updates.gender,
        weightKg: updates.weightKg !== '' && updates.weightKg !== null ? Number(updates.weightKg) : null,
        notes: updates.notes || '',
        avatarURL: updates.avatarURL || ''
      };
      
      await updatePet(currentUser.uid, editingPet.id, payload);
      setEditingPet(null);
    } catch (err) {
      console.error('Failed to update pet', err);
      setEditError(err.message || 'Failed to update pet');
    } finally {
      setEditingLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'P';
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const formatDate = (dob) => {
    if (!dob) return 'Unknown';
    try {
      const date = dob.toDate ? dob.toDate() : new Date(dob);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

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
              <span className={styles.bulletPoint}>•</span>
              <span className={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 className={styles.welcomeTitle}>My Pets</h1>
                <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '1rem' }}>
                  Manage your furry friends and their information
                </p>
              </div>
              
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 16px rgba(236, 72, 153, 0.4)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(236, 72, 153, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(236, 72, 153, 0.4)';
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
                borderTopColor: '#ec4899',
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
              borderRadius: '20px', 
              padding: '80px 40px', 
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', 
                borderRadius: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 24px' 
              }}>
                <PawPrint size={56} color="#ec4899" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>
                No pets yet
              </h3>
              <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '28px', maxWidth: '400px', margin: '0 auto 28px' }}>
                Add your first pet to start managing their appointments and medical records
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '16px 36px',
                  background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '1.0625rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 20px rgba(236, 72, 153, 0.4)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(236, 72, 153, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(236, 72, 153, 0.4)';
                }}
              >
                <Plus size={22} strokeWidth={2.5} />
                Add Your First Pet
              </button>
            </div>
          )}

          {/* Pets Grid */}
          {!petsLoading && pets.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
              gap: '24px' 
            }}>
              {pets.map((pet) => (
                <div 
                  key={pet.id} 
                  style={{ 
                    background: 'white', 
                    borderRadius: '16px', 
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: '2px solid #f3f4f6',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#ec4899';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#f3f4f6';
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '16px', 
                      background: pet.avatarURL ? '#fff' : 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(236, 72, 153, 0.2)',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {pet.avatarURL ? (
                        <img 
                          src={pet.avatarURL} 
                          alt={pet.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <span style={{ fontSize: '2rem', fontWeight: 700, color: 'white' }}>
                          {getInitials(pet.name)}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ 
                        fontSize: '1.375rem', 
                        fontWeight: 700, 
                        color: '#1f2937', 
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {pet.name}
                      </h3>
                      <p style={{ 
                        fontSize: '0.9375rem', 
                        color: '#6b7280', 
                        margin: 0,
                        fontWeight: 600
                      }}>
                        {pet.species} {pet.breed && `• ${pet.breed}`}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                    {pet.gender && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          background: '#f0f9ff', 
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <User size={16} color="#3b82f6" />
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gender</p>
                          <p style={{ fontSize: '0.9375rem', color: '#1f2937', margin: 0, fontWeight: 600 }}>{pet.gender}</p>
                        </div>
                      </div>
                    )}
                    
                    {pet.dob && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          background: '#fef3c7', 
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Calendar size={16} color="#f59e0b" />
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date of Birth</p>
                          <p style={{ fontSize: '0.9375rem', color: '#1f2937', margin: 0, fontWeight: 600 }}>{formatDate(pet.dob)}</p>
                        </div>
                      </div>
                    )}
                    
                    {pet.weightKg && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          background: '#dcfce7', 
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Weight size={16} color="#22c55e" />
                        </div>
                        <div>
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Weight</p>
                          <p style={{ fontSize: '0.9375rem', color: '#1f2937', margin: 0, fontWeight: 600 }}>{pet.weightKg} kg</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {pet.notes && (
                    <div style={{ 
                      background: '#f9fafb', 
                      padding: '14px', 
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      marginBottom: '16px'
                    }}>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 6px 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</p>
                      <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, lineHeight: '1.5' }}>
                        {pet.notes}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '2px solid #f3f4f6' }}>
                    <button
                      onClick={() => setEditingPet(pet)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Edit size={16} strokeWidth={2.5} />
                      Edit
                    </button>
                    <button
                      onClick={() => navigate('/map')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Calendar size={16} strokeWidth={2.5} />
                      Find Clinic
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add Pet Modal */}
      <AddPetModal open={showAddModal} onClose={() => setShowAddModal(false)} />

      {/* Edit Pet Modal */}
      {editingPet && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 9999,
          padding: '16px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !editingLoading) setEditingPet(null);
        }}>
          <div style={{ 
            width: '100%', 
            maxWidth: '640px', 
            background: 'white', 
            borderRadius: '20px', 
            padding: '32px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>Edit Pet</h3>
            
            {editError && (
              <div style={{
                marginBottom: '20px',
                padding: '14px 18px',
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                border: '2px solid #f87171',
                borderRadius: '10px',
                color: '#991b1b',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {editError}
              </div>
            )}
            
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const upd = {
                  name: fd.get('name'),
                  species: fd.get('species'),
                  breed: fd.get('breed'),
                  dob: fd.get('dob'),
                  gender: fd.get('gender'),
                  weightKg: fd.get('weightKg'),
                  notes: fd.get('notes'),
                  avatarURL: fd.get('avatarURL')
                };
                await handleEditSave(upd);
              }}
              style={{ display: 'grid', gap: '20px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input 
                  name="name" 
                  defaultValue={editingPet.name || ''} 
                  placeholder="Name" 
                  required
                  style={{ padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem' }} 
                />
                <input 
                  name="species" 
                  defaultValue={editingPet.species || ''} 
                  placeholder="Species" 
                  required
                  style={{ padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem' }} 
                />
                <input 
                  name="breed" 
                  defaultValue={editingPet.breed || ''} 
                  placeholder="Breed" 
                  style={{ padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem' }} 
                />
                <input
                  name="dob"
                  type="date"
                  defaultValue={
                    editingPet.dob
                      ? (editingPet.dob.toDate ? editingPet.dob.toDate().toISOString().slice(0, 10) : new Date(editingPet.dob).toISOString().slice(0, 10))
                      : ''
                  }
                  style={{ padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem' }}
                />
                <select 
                  name="gender" 
                  defaultValue={editingPet.gender || ''} 
                  style={{ padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem' }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <input 
                  name="weightKg" 
                  type="number" 
                  step="0.1" 
                  defaultValue={editingPet.weightKg ?? ''} 
                  placeholder="Weight (kg)" 
                  style={{ padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem' }} 
                />
              </div>

              <input 
                name="avatarURL" 
                placeholder="Avatar URL" 
                defaultValue={editingPet.avatarURL || ''} 
                style={{ padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem', width: '100%' }} 
              />
              
              <textarea 
                name="notes" 
                placeholder="Notes" 
                defaultValue={editingPet.notes || ''} 
                rows={4}
                style={{ padding: '14px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '1rem', width: '100%', resize: 'vertical' }} 
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => !editingLoading && setEditingPet(null)} 
                  disabled={editingLoading}
                  style={{ 
                    padding: '12px 28px', 
                    borderRadius: '10px', 
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '2px solid #e5e7eb',
                    cursor: editingLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: editingLoading ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={editingLoading} 
                  style={{ 
                    padding: '12px 32px', 
                    borderRadius: '10px', 
                    background: editingLoading ? '#9ca3af' : 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: editingLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    boxShadow: editingLoading ? 'none' : '0 4px 12px rgba(236, 72, 153, 0.3)'
                  }}
                >
                  {editingLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
