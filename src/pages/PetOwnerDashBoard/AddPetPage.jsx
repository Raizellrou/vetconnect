import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import TopBar from '../../components/layout/TopBar';
import { useAuth } from '../../contexts/AuthContext';
import AddPetModal from '../../components/AddPetModal';
import { useCollection } from '../../hooks/useCollection';
import { updatePet } from '../../lib/firebaseMutations';
import { where } from 'firebase/firestore';
import styles from '../../styles/Dashboard.module.css';

export default function AddPetPage() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [editingLoading, setEditingLoading] = useState(false);
  const [showVisitsFor, setShowVisitsFor] = useState(null); // pet object for incoming visits modal

  // realtime pets for current user
  const { docs: pets = [], loading: petsLoading } = useCollection(
    currentUser ? `users/${currentUser.uid}/pets` : null
  );

  // open schedule flow: navigate to map with petId in state (map page may use it)
  const handleSchedule = (pet) => {
    navigate('/map', { state: { petId: pet.id, petName: pet.name } });
  };

  // EDIT: opens inline modal fields (reuse AddPetModal for add; for edit we'll show a simple modal form)
  const handleEditSave = async (updates) => {
    if (!currentUser || !editingPet) return;
    setEditingLoading(true);
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
    } finally {
      setEditingLoading(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={userData?.fullName || userData?.displayName || userData?.email} />

        <main className={styles.mainContent}>
          <header className={styles.headerRow} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: 14 }}>
                  Pets <span style={{ margin: '0 8px' }}>•</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <h1 className={styles.welcomeTitle} style={{ marginTop: 8 }}>My Pets</h1>
              </div>

              <div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                  + Add Pet
                </button>
              </div>
            </div>
          </header>

          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
              <h2 className={styles.sectionTitle}>Your Pets</h2>

              {petsLoading ? (
                <div>Loading pets...</div>
              ) : pets.length === 0 ? (
                <div className="mt-4 text-sm text-gray-600">You have not added any pets yet. Click "Add Pet" to get started.</div>
              ) : (
                <div className="grid gap-4 mt-4">
                  {pets.map((pet) => (
                    <div key={pet.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, background: '#f8fafc' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                          {pet.avatarURL ? <img src={pet.avatarURL} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ fontWeight: 700 }}>{(pet.name || 'Pet').charAt(0)}</div>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16 }}>{pet.name || 'Unnamed'}</div>
                          <div style={{ fontSize: 13, color: '#475569' }}>{pet.species || 'Unknown'} · {pet.breed || 'Unknown breed'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEditingPet(pet); }} className="px-3 py-1 rounded bg-white border">Edit</button>
                        <button onClick={() => navigate(`/files`, { state: { petId: pet.id } })} className="px-3 py-1 rounded bg-white border">Medical History</button>
                        <button onClick={() => setShowVisitsFor(pet)} className="px-3 py-1 rounded bg-white border">Incoming Visits</button>
                        <button onClick={() => handleSchedule(pet)} className="px-3 py-1 rounded bg-indigo-600 text-white">Schedule Visit</button>
                        {/* Note: delete is intentionally omitted to preserve medical records */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add pet modal (existing component) */}
      <AddPetModal open={showAddModal} onClose={() => setShowAddModal(false)} />

      {/* Edit Pet Modal (inline simple modal) */}
      {editingPet && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', zIndex: 60 }}>
          <div style={{ width: 640, background: 'white', borderRadius: 8, padding: 20 }}>
            <h3 style={{ margin: 0, marginBottom: 12 }}>Edit Pet</h3>
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
              className="space-y-2"
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input name="name" defaultValue={editingPet.name || ''} placeholder="Name" className="border p-2 rounded w-full" required />
                <input name="species" defaultValue={editingPet.species || ''} placeholder="Species" className="border p-2 rounded w-full" required />
                <input name="breed" defaultValue={editingPet.breed || ''} placeholder="Breed" className="border p-2 rounded w-full" />
                <input
                  name="dob"
                  type="date"
                  defaultValue={
                    editingPet.dob
                      ? (editingPet.dob.toDate ? editingPet.dob.toDate().toISOString().slice(0, 10) : new Date(editingPet.dob).toISOString().slice(0, 10))
                      : ''
                  }
                  className="border p-2 rounded w-full"
                />
                <select name="gender" defaultValue={editingPet.gender || ''} className="border p-2 rounded w-full">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <input name="weightKg" type="number" step="0.1" defaultValue={editingPet.weightKg ?? ''} placeholder="Weight (kg)" className="border p-2 rounded w-full" />
              </div>

              <input name="avatarURL" placeholder="Avatar URL" defaultValue={editingPet.avatarURL || ''} className="border p-2 rounded w-full" />
              <textarea name="notes" placeholder="Notes" defaultValue={editingPet.notes || ''} className="border p-2 rounded w-full" rows={3} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setEditingPet(null)} className="px-4 py-2 rounded bg-gray-300">Cancel</button>
                <button type="submit" disabled={editingLoading} className="px-4 py-2 rounded bg-indigo-600 text-white">{editingLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Incoming visits modal: shows appointments for selected pet */}
      {showVisitsFor && (
        <IncomingVisitsModal pet={showVisitsFor} onClose={() => setShowVisitsFor(null)} ownerUid={currentUser?.uid} />
      )}

    </div>
  );
}

/* Inline component: queries appointments for a pet and shows them */
function IncomingVisitsModal({ pet, onClose, ownerUid }) {
  // useCollection with constraints
  const constraints = ownerUid && pet?.id ? [where('ownerId', '==', ownerUid), where('petId', '==', pet.id)] : [];
  const { docs: appts = [], loading } = useCollection(pet?.id ? 'appointments' : null, constraints);

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', zIndex: 70 }}>
      <div style={{ width: 720, background: 'white', borderRadius: 8, padding: 20, maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3>Incoming Visits — {pet.name}</h3>
          <button onClick={onClose} className="px-2 py-1 rounded bg-gray-200">Close</button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : appts.length === 0 ? (
          <div>No upcoming visits for this pet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {appts.map(a => (
              <div key={a.id} style={{ padding: 12, borderRadius: 8, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{a.petName} — {a.clinicName}</div>
                  <div style={{ color: '#475569', fontSize: 13 }}>{a.date} {a.time} — {a.status}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => window.alert('Open appointment details')} className="px-3 py-1 rounded bg-white border">View</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
