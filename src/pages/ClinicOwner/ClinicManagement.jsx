import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, MapPin, Phone, Clock, Briefcase } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAllClinics,
  deleteClinic
} from '../../utils/clinicStorage';

export default function ClinicManagement() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = () => {
    const loadedClinics = getAllClinics();
    setClinics(loadedClinics);
  };

  const handleAddClinic = () => {
    navigate('/clinic/register');
  };

  const handleEditClinic = (clinic) => {
    navigate('/clinic/register', { state: { clinic } });
  };

  const handleDeleteClick = (clinic) => {
    setDeleteConfirm(clinic);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      try {
        deleteClinic(deleteConfirm.id);
        loadClinics();
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Error deleting clinic:', error);
        alert('Failed to delete clinic. Please try again.');
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <ClinicSidebar />
      
      <div style={{ flex: 1, marginLeft: '200px', display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        
        <main style={{ padding: '108px 32px 40px 32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          {/* Header with gradient background */}
          <div style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
            borderRadius: '20px',
            padding: '32px 40px',
            marginBottom: '32px',
            boxShadow: '0 8px 24px rgba(129, 140, 248, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <MapPin size={32} color="white" />
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Clinic Management
              </h1>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1rem', margin: 0 }}>
              Manage all your clinic branches and locations
            </p>
          </div>

          {/* Clinics List */}
          <div className="space-y-4">
            {clinics.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '64px 32px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px'
                }}>
                  <MapPin size={40} color="#818cf8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No clinics registered yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Add your first clinic to get started with VetConnect
                </p>
                <button
                  onClick={handleAddClinic}
                  style={{
                    padding: '14px 32px',
                    background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(129, 140, 248, 0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(129, 140, 248, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(129, 140, 248, 0.4)';
                  }}
                >
                  <Plus size={20} />
                  ADD CLINIC
                </button>
              </div>
            ) : (
                <>
                  {clinics.map((clinic) => (
                    <div
                      key={clinic.id}
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                        border: '1px solid #e5e7eb'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Clinic Name as Header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px',
                        paddingBottom: '16px',
                        borderBottom: '2px solid #eef2ff'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Briefcase size={24} color="white" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                            {clinic.clinicName}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Clinic Branch</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div style={{
                              width: '36px',
                              height: '36px',
                              background: '#eef2ff',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <MapPin size={18} color="#818cf8" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</p>
                              <p className="text-gray-800 break-words">{clinic.address}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div style={{
                              width: '36px',
                              height: '36px',
                              background: '#f0fdf4',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Phone size={18} color="#22c55e" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact</p>
                              <p className="text-gray-800 break-words font-medium">{clinic.contactNumber}</p>
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div style={{
                              width: '36px',
                              height: '36px',
                              background: '#fff7ed',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Clock size={18} color="#f97316" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Schedule</p>
                              <p className="text-gray-800 break-words">{clinic.openHours}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div style={{
                              width: '36px',
                              height: '36px',
                              background: '#fef2f2',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Briefcase size={18} color="#ef4444" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Services Offered</p>
                              <p className="text-gray-800 break-words">{clinic.services}</p>
                            </div>
                          </div>

                          {clinic.description && (
                            <div style={{
                              background: '#f9fafb',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                              <p className="text-gray-700 text-sm break-words">{clinic.description}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                        <button
                          onClick={() => handleEditClinic(clinic)}
                          style={{
                            padding: '10px 24px',
                            background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <Edit size={16} />
                          EDIT
                        </button>
                        <button
                          onClick={() => handleDeleteClick(clinic)}
                          style={{
                            padding: '10px 24px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <Trash2 size={16} />
                          DELETE
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Clinic Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleAddClinic}
                      style={{
                        width: '100%',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        boxShadow: '0 8px 24px rgba(129, 140, 248, 0.4)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(129, 140, 248, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(129, 140, 248, 0.4)';
                      }}
                    >
                      <Plus size={24} />
                      ADD CLINIC
                    </button>
                  </div>
                </>
              )}
            </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCancelDelete();
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            maxWidth: '480px',
            width: '100%',
            padding: '32px',
            animation: 'slideIn 0.3s ease',
            position: 'relative'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <Trash2 size={32} color="#ef4444" />
            </div>
            
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '12px'
            }}>
              Delete Clinic?
            </h3>
            
            <p style={{
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Are you sure you want to delete <span style={{ fontWeight: '700', color: '#1f2937' }}>{deleteConfirm.clinicName}</span>? 
              This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelDelete}
                style={{
                  padding: '12px 28px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Delete Clinic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
