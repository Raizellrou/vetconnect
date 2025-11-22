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
            <div className={styles.vcCardLarge}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building2 size={28} color="white" />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                    Create New Clinic
                  </h1>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                    Step {currentStep} of 4: {steps[currentStep - 1].title}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginTop: '24px'
              }}>
                {steps.map((step) => (
                  <div
                    key={step.number}
                    style={{
                      flex: 1,
                      height: '8px',
                      borderRadius: '4px',
                      background: step.number <= currentStep 
                        ? 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)'
                        : '#e5e7eb',
                      transition: 'all 0.3s'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fee2e2',
                border: '2px solid #f87171',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                color: '#991b1b',
                fontWeight: 600
              }}>
                {error}
              </div>
            )}

            {/* Form Steps */}
            <div className={styles.vcCardLarge}>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <Building2 size={40} color="#818cf8" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
                      Let's start with the basics
                    </h2>
                    <p style={{ color: '#64748b' }}>Tell us about your clinic</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
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
                          padding: '14px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '1rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                        Complete Address <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Street, City, Province/State, Postal Code, Country"
                          rows={3}
                          style={{
                            flex: 1,
                            padding: '14px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        style={{
                          padding: '12px 20px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        <Map size={18} />
                        Pick Location on Map
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
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
                            padding: '14px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '1rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
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
                            padding: '14px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '1rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                          Latitude (Optional)
                        </label>
                        <input
                          type="text"
                          name="latitude"
                          value={formData.latitude}
                          onChange={handleInputChange}
                          placeholder="e.g., 14.5995"
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '1rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                          Longitude (Optional)
                        </label>
                        <input
                          type="text"
                          name="longitude"
                          value={formData.longitude}
                          onChange={handleInputChange}
                          placeholder="e.g., 120.9842"
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '1rem'
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
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <Clock size={40} color="#f59e0b" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
                      Services & Operating Hours
                    </h2>
                    <p style={{ color: '#64748b' }}>What services do you offer?</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
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
                          padding: '14px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '1rem',
                          resize: 'vertical'
                        }}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                        Separate services with commas
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
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
                          padding: '14px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '1rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
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
                          padding: '14px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '1rem',
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
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <Plus size={40} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
                      Add Your Veterinarians
                    </h2>
                    <p style={{ color: '#64748b' }}>List the veterinarians working at your clinic</p>
                  </div>

                  {/* Existing Veterinarians */}
                  {veterinarians.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
                        Added Veterinarians ({veterinarians.length})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {veterinarians.map((vet) => (
                          <div
                            key={vet.id}
                            style={{
                              padding: '16px',
                              background: '#f8fafc',
                              borderRadius: '10px',
                              border: '1px solid #e5e7eb',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#1e293b' }}>
                                Dr. {vet.name}
                              </p>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                                {vet.specialization}
                                {vet.yearsOfExperience && ` • ${vet.yearsOfExperience} years experience`}
                              </p>
                              {vet.licenseNumber && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                                  License: {vet.licenseNumber}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeVeterinarian(vet.id)}
                              style={{
                                padding: '8px',
                                background: '#fee2e2',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#ef4444'
                              }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Veterinarian Form */}
                  <div style={{ 
                    padding: '24px', 
                    background: '#f8fafc', 
                    borderRadius: '12px',
                    border: '2px dashed #cbd5e1'
                  }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
                      Add New Veterinarian
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            Full Name <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={newVet.name}
                            onChange={(e) => setNewVet(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., John Smith"
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            Specialization <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={newVet.specialization}
                            onChange={(e) => setNewVet(prev => ({ ...prev, specialization: e.target.value }))}
                            placeholder="e.g., Small Animal Surgery"
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            License Number
                          </label>
                          <input
                            type="text"
                            value={newVet.licenseNumber}
                            onChange={(e) => setNewVet(prev => ({ ...prev, licenseNumber: e.target.value }))}
                            placeholder="e.g., VET-12345"
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            Years of Experience
                          </label>
                          <input
                            type="number"
                            value={newVet.yearsOfExperience}
                            onChange={(e) => setNewVet(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                            placeholder="e.g., 5"
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            Email
                          </label>
                          <input
                            type="email"
                            value={newVet.email}
                            onChange={(e) => setNewVet(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="vet@example.com"
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={newVet.phone}
                            onChange={(e) => setNewVet(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+1 (555) 123-4567"
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '0.875rem'
                            }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleAddVeterinarian}
                        style={{
                          padding: '12px 24px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Plus size={18} />
                        Add Veterinarian
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Photos */}
              {currentStep === 4 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <Camera size={40} color="#0ea5e9" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
                      Add Photos
                    </h2>
                    <p style={{ color: '#64748b' }}>Show pet owners your clinic</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Profile Picture */}
                    <div>
                      <ImageUploader
                        onUpload={handleProfilePictureUpload}
                        currentImage={profilePicturePreview}
                        label="Upload Clinic Profile Picture"
                        aspectRatio="1/1"
                      />
                    </div>

                    {/* Gallery Photos */}
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
                        Gallery Photos (Max 6)
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' }}>
                        Upload photos of your clinic facilities, equipment, and team
                      </p>

                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                        marginBottom: '16px'
                      }}>
                        {galleryPreviews.map((preview, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <img
                              src={preview}
                              alt={`Gallery ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover',
                                borderRadius: '12px',
                                border: '2px solid #e5e7eb'
                              }}
                            />
                            <button
                              onClick={() => removeGalleryPhoto(index)}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                padding: '6px',
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: 'white'
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}

                        {galleryPhotos.length < 6 && (
                          <label style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '150px',
                            border: '2px dashed #cbd5e1',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            background: '#f8fafc'
                          }}>
                            <Upload size={24} color="#94a3b8" />
                            <span style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
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

            {/* Navigation Buttons */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              gap: '16px'
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
                style={{
                  padding: '14px 32px',
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1
                }}
              >
                {currentStep === 1 ? 'Cancel' : 'Previous'}
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  style={{
                    padding: '14px 40px',
                    background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(129, 140, 248, 0.4)'
                  }}
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    padding: '14px 40px',
                    background: isSubmitting 
                      ? '#9ca3af' 
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="small" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
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
