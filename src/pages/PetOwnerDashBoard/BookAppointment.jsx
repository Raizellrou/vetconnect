import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, PawPrint, AlertCircle, X, ChevronLeft } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/Dashboard.module.css';

export default function BookAppointment() {
  const { userData, currentUser } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.email;
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get clinic info from navigation state if available
  const clinicInfo = location.state?.clinic || { name: 'Selected Clinic' };

  const [formData, setFormData] = useState({
    petName: '',
    petBreed: '',
    petSpecies: '',
    symptoms: '',
    appointmentDate: '',
    appointmentTime: '',
    additionalNotes: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.petName.trim()) {
      newErrors.petName = 'Pet name is required';
    }
    
    if (!formData.petSpecies.trim()) {
      newErrors.petSpecies = 'Pet species is required';
    }
    
    if (!formData.symptoms.trim()) {
      newErrors.symptoms = 'Please describe the symptoms';
    }
    
    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'Appointment date is required';
    }
    
    if (!formData.appointmentTime) {
      newErrors.appointmentTime = 'Appointment time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // TODO: Submit appointment to backend
    console.log('Appointment data:', {
      ...formData,
      clinicId: clinicInfo.id,
      userId: currentUser?.uid
    });

    // Show success message and navigate
    alert('Appointment request submitted successfully!');
    navigate('/owner-dashboard');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />

        <main className={styles.mainContent}>
          <div style={{
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {/* Header */}
            <div style={{
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '10px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                color: '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: 0,
                marginBottom: '4px'
              }}>
                Book Appointment
              </h1>
              <p style={{
                color: '#64748b',
                fontSize: '0.875rem',
                margin: 0
              }}>
                Schedule a visit to {clinicInfo.name}
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            maxWidth: '900px',
            margin: '0 auto',
            border: '1px solid #f3f4f6'
          }}>
            <form onSubmit={handleSubmit}>
              {/* Pet Information Section */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    background: '#f0f9ff',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PawPrint size={22} color="#0ea5e9" />
                  </div>
                  <h2 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0
                  }}>
                    Pet Information
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Pet Name */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Pet Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="petName"
                      value={formData.petName}
                      onChange={handleChange}
                      placeholder="e.g., Max, Bella"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: `2px solid ${errors.petName ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '10px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        if (!errors.petName) {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.petName) {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    />
                    {errors.petName && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '4px',
                        color: '#ef4444',
                        fontSize: '0.75rem'
                      }}>
                        <AlertCircle size={12} />
                        {errors.petName}
                      </div>
                    )}
                  </div>

                  {/* Pet Species */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Species <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="petSpecies"
                      value={formData.petSpecies}
                      onChange={handleChange}
                      placeholder="e.g., Dog, Cat, Bird"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: `2px solid ${errors.petSpecies ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '10px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        if (!errors.petSpecies) {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.petSpecies) {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    />
                    {errors.petSpecies && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '4px',
                        color: '#ef4444',
                        fontSize: '0.75rem'
                      }}>
                        <AlertCircle size={12} />
                        {errors.petSpecies}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pet Breed */}
                <div style={{ marginTop: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Breed (Optional)
                  </label>
                  <input
                    type="text"
                    name="petBreed"
                    value={formData.petBreed}
                    onChange={handleChange}
                    placeholder="e.g., Labrador, Persian, Parakeet"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Symptoms */}
                <div style={{ marginTop: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Symptoms / Reason for Visit <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    placeholder="Please describe your pet's symptoms or reason for the visit..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: `2px solid ${errors.symptoms ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '10px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      if (!errors.symptoms) {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.symptoms) {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                  {errors.symptoms && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '4px',
                      color: '#ef4444',
                      fontSize: '0.75rem'
                    }}>
                      <AlertCircle size={12} />
                      {errors.symptoms}
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Schedule Section */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    background: '#eff6ff',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Calendar size={22} color="#3b82f6" />
                  </div>
                  <h2 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0
                  }}>
                    Schedule
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Date */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Preferred Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      name="appointmentDate"
                      value={formData.appointmentDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: `2px solid ${errors.appointmentDate ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '10px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        if (!errors.appointmentDate) {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.appointmentDate) {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    />
                    {errors.appointmentDate && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '4px',
                        color: '#ef4444',
                        fontSize: '0.75rem'
                      }}>
                        <AlertCircle size={12} />
                        {errors.appointmentDate}
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Preferred Time <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="time"
                      name="appointmentTime"
                      value={formData.appointmentTime}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: `2px solid ${errors.appointmentTime ? '#ef4444' : '#e5e7eb'}`,
                        borderRadius: '10px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => {
                        if (!errors.appointmentTime) {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.appointmentTime) {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    />
                    {errors.appointmentTime && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '4px',
                        color: '#ef4444',
                        fontSize: '0.75rem'
                      }}>
                        <AlertCircle size={12} />
                        {errors.appointmentTime}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Notes */}
                <div style={{ marginTop: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    placeholder="Any additional information you'd like to share..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '32px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '12px 28px',
                    background: 'white',
                    color: '#64748b',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.color = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 32px',
                    background: '#06b6d4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(6, 182, 212, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0891b2';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(6, 182, 212, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#06b6d4';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(6, 182, 212, 0.2)';
                  }}
                >
                  Book Appointment
                </button>
              </div>
            </form>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
