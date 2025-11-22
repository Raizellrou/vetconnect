import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import ImageUploader from '../../components/ImageUploader';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, MapPin, Phone, Clock, Upload, X, Plus, Trash2, Check, Camera, Map } from 'lucide-react';
import MapPicker from '../../components/MapPicker';
import styles from '../../styles/ClinicDashboard.module.css';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { uploadMultipleImagesToCloudinary } from '../../utils/uploadImage';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/designSystem.css';

export default function CreateClinic() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    clinicName: '',
    address: '',
    contactNumber: '',
    email: '',
    openHours: '',
    services: '',
    description: '',
    latitude: '',
    longitude: ''
  });

  // Profile picture
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // Gallery photos (max 6)
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // Veterinarians
  const [veterinarians, setVeterinarians] = useState([]);
  const [newVet, setNewVet] = useState({
    name: '',
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleMapSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      address: locationData.address,
      latitude: locationData.coordinates.lat.toString(),
      longitude: locationData.coordinates.lng.toString()
    }));
  };

  const handleProfilePictureUpload = (cloudinaryUrl) => {
    setProfilePicturePreview(cloudinaryUrl);
    setError('');
  };

  const handleGalleryPhotosChange = (e) => {
    const files = Array.from(e.target.files || []);
    
    if (galleryPhotos.length + files.length > 6) {
      setError('Maximum 6 gallery photos allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each photo must be less than 5MB');
        return;
      }
    });

    setGalleryPhotos(prev => [...prev, ...files]);
    setGalleryPreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
  };

  const removeGalleryPhoto = (index) => {
    setGalleryPhotos(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddVeterinarian = () => {
    if (!newVet.name || !newVet.specialization) {
      setError('Please fill in veterinarian name and specialization');
      return;
    }

    setVeterinarians(prev => [...prev, { ...newVet, id: Date.now() }]);
    setNewVet({
      name: '',
      specialization: '',
      licenseNumber: '',
      yearsOfExperience: '',
      email: '',
      phone: ''
    });
    setError('');
  };

  const removeVeterinarian = (id) => {
    setVeterinarians(prev => prev.filter(vet => vet.id !== id));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.clinicName.trim()) {
          setError('Clinic name is required');
          return false;
        }
        if (!formData.address.trim()) {
          setError('Address is required');
          return false;
        }
        if (!formData.contactNumber.trim()) {
          setError('Contact number is required');
          return false;
        }
        break;
      case 2:
        if (!formData.services.trim()) {
          setError('Please provide at least one service');
          return false;
        }
        if (!formData.openHours.trim()) {
          setError('Opening hours are required');
          return false;
        }
        break;
      case 3:
        // Veterinarians are optional but encouraged
        break;
      case 4:
        // Photos are optional
        break;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setError('');

    try {
      // profilePicturePreview is already uploaded to Cloudinary
      let profilePictureURL = profilePicturePreview || '';
      let galleryPhotoURLs = [];

      // Upload gallery photos to Cloudinary
      if (galleryPhotos.length > 0) {
        galleryPhotoURLs = await uploadMultipleImagesToCloudinary(galleryPhotos);
      }

      // Create clinic document
      const clinicData = {
        ...formData,
        ownerId: currentUser.uid,
        ownerName: userData.fullName || userData.displayName || userData.email,
        profilePicture: profilePictureURL,
        galleryPhotos: galleryPhotoURLs,
        veterinarians: veterinarians,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        rating: 0,
        reviewCount: 0
      };

      const docRef = await addDoc(collection(db, 'clinics'), clinicData);
      console.log('Clinic created successfully:', docRef.id);

      // Navigate to clinics management page
      navigate('/clinic/management', {
        state: { message: 'Clinic created successfully!' }
      });
    } catch (err) {
      console.error('Error creating clinic:', err);
      setError(err.message || 'Failed to create clinic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Information' },
    { number: 2, title: 'Services & Hours' },
    { number: 3, title: 'Veterinarians' },
    { number: 4, title: 'Photos & Media' }
  ];

  return (
    <div className={styles.dashboard}>
      <ClinicSidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />
        
        <main className={styles.mainContent}>
          <div className={styles.formContainer}>
            {/* Header */}
            <div className={styles.vcCardLarge} style={{ padding: '16px 20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--vc-radius-lg)',
                  background: 'linear-gradient(135deg, var(--vc-primary) 0%, var(--vc-primary-hover) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(129, 140, 248, 0.3)'
                }}>
                  <Building2 size={24} color="white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--vc-text-dark)', margin: '0 0 4px 0' }}>
                    Create New Clinic
                  </h1>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--vc-text-muted)', margin: 0, fontWeight: 500 }}>
                    Step {currentStep} of 4: {steps[currentStep - 1].title}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ 
                display: 'flex', 
                gap: '6px'
              }}>
                {steps.map((step) => (
                  <div
                    key={step.number}
                    style={{
                      flex: 1,
                      height: '6px',
                      borderRadius: 'var(--vc-radius-sm)',
                      background: step.number <= currentStep 
                        ? 'linear-gradient(135deg, var(--vc-primary) 0%, var(--vc-primary-hover) 100%)'
                        : '#e5e7eb',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: 'var(--vc-radius-lg)',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#991b1b',
                fontWeight: 500,
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <X size={16} color="#ef4444" strokeWidth={2} />
                <span>{error}</span>
              </div>
            )}

            {/* Form Steps */}
            <div className={styles.vcCardLarge} style={{ padding: '20px' }}>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px'
                    }}>
                      <Building2 size={32} color="#818cf8" />
                    </div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '4px' }}>
                      Let's start with the basics
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Tell us about your clinic</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        Clinic Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="clinicName"
                        value={formData.clinicName}
                        onChange={handleInputChange}
                        placeholder="e.g., Happy Paws Veterinary Clinic"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        Complete Address <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Street, City, Province/State, Postal Code, Country"
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          resize: 'vertical',
                          marginBottom: '8px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="vc-btn-primary"
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.8125rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Map size={16} />
                        Pick Location on Map
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                          Contact Number <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="tel"
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 123-4567"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="clinic@example.com"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Services & Hours */}
              {currentStep === 2 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px'
                    }}>
                      <Clock size={32} color="#f59e0b" strokeWidth={2.5} />
                    </div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '4px' }}>
                      Services & Operating Hours
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>What services do you offer?</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        Services Offered <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <textarea
                        name="services"
                        value={formData.services}
                        onChange={handleInputChange}
                        placeholder="e.g., Vaccination, Surgery, Dental Care, Emergency Care, Pet Grooming"
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          resize: 'vertical'
                        }}
                      />
                      <p style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: '4px' }}>
                        Separate services with commas
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        Opening Hours <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="openHours"
                        value={formData.openHours}
                        onChange={handleInputChange}
                        placeholder="e.g., Mon-Fri: 8:00 AM - 6:00 PM, Sat: 9:00 AM - 3:00 PM"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        About Your Clinic
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Tell pet owners about your clinic, facilities, and what makes you special..."
                        rows={5}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Veterinarians */}
              {currentStep === 3 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px'
                    }}>
                      <Plus size={32} color="var(--vc-success)" strokeWidth={2.5} />
                    </div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '4px' }}>
                      Add Your Veterinarians
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>List the veterinarians working at your clinic</p>
                  </div>

                  {/* Existing Veterinarians */}
                  {veterinarians.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>
                        Added Veterinarians ({veterinarians.length})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {veterinarians.map((vet) => (
                          <div
                            key={vet.id}
                            style={{
                              padding: '12px',
                              background: '#f8fafc',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>
                                Dr. {vet.name}
                              </p>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                                {vet.specialization}
                                {vet.yearsOfExperience && ` • ${vet.yearsOfExperience} years experience`}
                              </p>
                              {vet.licenseNumber && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.6875rem', color: '#94a3b8' }}>
                                  License: {vet.licenseNumber}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeVeterinarian(vet.id)}
                              style={{
                                padding: '6px',
                                background: '#fee2e2',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#ef4444'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Veterinarian Form */}
                  <div style={{ 
                    padding: '16px', 
                    background: '#f8fafc', 
                    borderRadius: '10px',
                    border: '2px dashed #cbd5e1'
                  }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>
                      Add New Veterinarian
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                            Full Name <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={newVet.name}
                            onChange={(e) => setNewVet(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., John Smith"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.8125rem'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                            Specialization <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={newVet.specialization}
                            onChange={(e) => setNewVet(prev => ({ ...prev, specialization: e.target.value }))}
                            placeholder="e.g., Small Animal Surgery"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.8125rem'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                            License Number
                          </label>
                          <input
                            type="text"
                            value={newVet.licenseNumber}
                            onChange={(e) => setNewVet(prev => ({ ...prev, licenseNumber: e.target.value }))}
                            placeholder="e.g., VET-12345"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.8125rem'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                            Years of Experience
                          </label>
                          <input
                            type="number"
                            value={newVet.yearsOfExperience}
                            onChange={(e) => setNewVet(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                            placeholder="e.g., 5"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.8125rem'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                            Email
                          </label>
                          <input
                            type="email"
                            value={newVet.email}
                            onChange={(e) => setNewVet(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="vet@example.com"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.8125rem'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={newVet.phone}
                            onChange={(e) => setNewVet(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+1 (555) 123-4567"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.8125rem'
                            }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleAddVeterinarian}
                        className="vc-btn-success"
                        style={{
                          padding: '10px 20px',
                          fontSize: '0.8125rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%'
                        }}
                      >
                        <Plus size={16} />
                        Add Veterinarian
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Photos */}
              {currentStep === 4 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px'
                    }}>
                      <Camera size={32} color="#0ea5e9" />
                    </div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '4px' }}>
                      Add Photos
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Show pet owners your clinic</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Profile Picture */}
                    <div style={{ maxWidth: '240px', margin: '0 auto' }}>
                      <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '10px', textAlign: 'center' }}>
                        Profile Picture
                      </h3>
                      <ImageUploader
                        onUpload={handleProfilePictureUpload}
                        currentImage={profilePicturePreview}
                        label="Upload Clinic Profile Picture"
                        aspectRatio="1/1"
                      />
                    </div>

                    {/* Gallery Photos */}
                    <div>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                        Gallery Photos (Max 6)
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px' }}>
                        Upload photos of your clinic facilities, equipment, and team
                      </p>

                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '10px',
                        marginBottom: '12px'
                      }}>
                        {galleryPreviews.map((preview, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <img
                              src={preview}
                              alt={`Gallery ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                              }}
                            />
                            <button
                              onClick={() => removeGalleryPhoto(index)}
                              style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                padding: '4px',
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: 'white'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}

                        {galleryPhotos.length < 6 && (
                          <label style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '120px',
                            border: '2px dashed #cbd5e1',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: '#f8fafc'
                          }}>
                            <Upload size={20} color="#94a3b8" />
                            <span style={{ marginTop: '6px', fontSize: '0.6875rem', color: '#64748b' }}>
                              Add photo
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleGalleryPhotosChange}
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons - Arrow Style */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => {
                  if (currentStep === 1) {
                    navigate('/clinic/management');
                  } else {
                    prevStep();
                  }
                }}
                disabled={isSubmitting}
                className="vc-btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  opacity: isSubmitting ? 0.5 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {currentStep > 1 && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="vc-btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="vc-btn-success"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    opacity: isSubmitting ? 0.6 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="small" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Create Clinic
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Map Picker Modal */}
      <MapPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelectLocation={handleMapSelect}
        initialPosition={
          formData.latitude && formData.longitude
            ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) }
            : null
        }
      />
    </div>
  );
}
