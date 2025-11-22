import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import ClinicSidebar from '../../components/layout/ClinicSidebar';
import WorkingHoursModal from '../../components/modals/WorkingHoursModal';
import ImageUploader from '../../components/ImageUploader';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, MapPin, Phone, Clock, Upload, X, Plus, Trash2, Check, Camera, Save, Map, Settings } from 'lucide-react';
import MapPicker from '../../components/MapPicker';
import styles from '../../styles/ClinicDashboard.module.css';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { fetchWorkingHours } from '../../firebase/firestoreHelpers';
import { uploadMultipleImagesToCloudinary } from '../../utils/uploadImage';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/designSystem.css';

export default function EditClinic() {
  const { clinicId } = useParams();
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const displayName = userData?.fullName || userData?.displayName || userData?.email;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [workingHours, setWorkingHours] = useState(null);

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
  const [existingProfilePicture, setExistingProfilePicture] = useState('');

  // Gallery photos (max 6)
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [existingGalleryPhotos, setExistingGalleryPhotos] = useState([]);

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

  // Fetch clinic data
  useEffect(() => {
    const fetchClinic = async () => {
      if (!clinicId) {
        setError('No clinic ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const clinicRef = doc(db, 'clinics', clinicId);
        const clinicSnap = await getDoc(clinicRef);

        if (!clinicSnap.exists()) {
          setError('Clinic not found');
          setLoading(false);
          return;
        }

        const data = clinicSnap.data();

        // Check ownership
        if (data.ownerId !== currentUser.uid) {
          setError('You do not have permission to edit this clinic');
          setLoading(false);
          return;
        }

        setFormData({
          clinicName: data.clinicName || '',
          address: data.address || '',
          contactNumber: data.contactNumber || '',
          email: data.email || '',
          openHours: data.openHours || '',
          services: data.services || '',
          description: data.description || '',
          latitude: data.latitude || '',
          longitude: data.longitude || ''
        });

        setExistingProfilePicture(data.profilePicture || '');
        setProfilePicturePreview(data.profilePicture || '');
        setExistingGalleryPhotos(data.galleryPhotos || []);
        setGalleryPreviews(data.galleryPhotos || []);
        setVeterinarians(data.veterinarians || []);
        
        // Fetch working hours
        try {
          const hours = await fetchWorkingHours(clinicId);
          setWorkingHours(hours);
        } catch (err) {
          console.error('Error fetching working hours:', err);
        }
      } catch (err) {
        console.error('Error fetching clinic:', err);
        setError('Failed to load clinic data');
      } finally {
        setLoading(false);
      }
    };

    fetchClinic();
  }, [clinicId, currentUser]);

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
    
    const totalPhotos = existingGalleryPhotos.length + galleryPhotos.length + files.length;
    if (totalPhotos > 6) {
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
    if (index < existingGalleryPhotos.length) {
      // Remove from existing photos
      setExistingGalleryPhotos(prev => prev.filter((_, i) => i !== index));
      setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove from new photos
      const newIndex = index - existingGalleryPhotos.length;
      setGalleryPhotos(prev => prev.filter((_, i) => i !== newIndex));
      setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    }
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
      // profilePicturePreview is already uploaded to Cloudinary by ImageUploader
      let profilePictureURL = profilePicturePreview || existingProfilePicture;
      let galleryPhotoURLs = [...existingGalleryPhotos];

      // Upload new gallery photos to Cloudinary
      if (galleryPhotos.length > 0) {
        const newGalleryURLs = await uploadMultipleImagesToCloudinary(galleryPhotos);
        galleryPhotoURLs.push(...newGalleryURLs);
      }

      // Update clinic document
      const clinicRef = doc(db, 'clinics', clinicId);
      await updateDoc(clinicRef, {
        ...formData,
        profilePicture: profilePictureURL,
        galleryPhotos: galleryPhotoURLs,
        veterinarians: veterinarians,
        updatedAt: serverTimestamp()
      });

      console.log('Clinic updated successfully');

      // Navigate back to management page
      navigate('/clinic/management', {
        state: { message: 'Clinic updated successfully!' }
      });
    } catch (err) {
      console.error('Error updating clinic:', err);
      setError(err.message || 'Failed to update clinic. Please try again.');
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

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <ClinicSidebar />
        <div className={styles.mainWrapper}>
          <TopBar username={displayName} />
          <main className={styles.mainContent}>
            <div className={styles.centeredLarge}>
              <LoadingSpinner size="large" message="Loading clinic data..." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && !formData.clinicName) {
    return (
      <div className={styles.dashboard}>
        <ClinicSidebar />
        <div className={styles.mainWrapper}>
          <TopBar username={displayName} />
          <main className={styles.mainContent}>
            <div className={styles.vcErrorCard}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#991b1b', marginBottom: '12px' }}>
                {error}
              </h3>
              <button
                onClick={() => navigate('/clinic/management')}
                className={styles.vcDangerBtn}
                style={{ padding: '12px 24px', borderRadius: '10px', fontWeight: 600, marginLeft: '12px' }}
              >
                Back to Management
              </button>
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
          <div className={styles.formContainer}>
            {/* Header */}
            <div className={styles.vcCardLarge} style={{ padding: '16px 20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--vc-radius-lg)',
                    background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(129, 140, 248, 0.3)'
                  }}>
                    <Building2 size={24} color="white" />
                  </div>
                  <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>
                      Edit Clinic
                    </h1>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                      Step {currentStep} of 4: {steps[currentStep - 1].title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWorkingHoursModal(true)}
                  className="vc-btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    fontSize: '0.75rem'
                  }}
                >
                  <Clock size={14} />
                  Hours {workingHours && `(${workingHours.start}-${workingHours.end})`}
                </button>
              </div>

              {/* Progress Bar */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {steps.map((step) => (
                  <div
                    key={step.number}
                    style={{
                      flex: 1,
                      height: '6px',
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
              <div className={styles.vcErrorCard}>{error}</div>
            )}

            {/* Form Steps */}
            <div className={styles.vcCard} style={{ padding: '20px' }}>
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
                      Update basic information
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Edit your clinic details</p>
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
                    <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Update your services and hours</p>
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

              {/* Step 3: Manage Veterinarians */}
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
                      <Plus size={32} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '4px' }}>
                      Manage Veterinarians
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Update your team of veterinarians</p>
                  </div>

                  {/* Existing Veterinarians */}
                  {veterinarians.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>
                        Current Veterinarians ({veterinarians.length})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {veterinarians.map((vet) => (
                          <div key={vet.id} className={styles.vetItem}>
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
                              className={`${styles.vcSmallBtn} ${styles.vcDangerBtn}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Veterinarian Form - Same as Create */}
                  <div className={styles.dashedBox}>
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
                            className={styles.formInput}
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
                            className={styles.formInput}
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
                            className={styles.formInput}
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
                            className={styles.formInput}
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
                            className={styles.formInput}
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
                            className={styles.formInput}
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleAddVeterinarian}
                        className={`${styles.vcPrimarySmall} ${styles.vcSmallBtn}`}
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
                      Update Photos
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Update your clinic photos</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Profile Picture */}
                    <div style={{ maxWidth: '240px', margin: '0 auto' }}>
                      <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '10px', textAlign: 'center' }}>
                        Profile Picture
                      </h3>
                      <ImageUploader
                        onUpload={handleProfilePictureUpload}
                        currentImage={profilePicturePreview || existingProfilePicture}
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
                        Photos of your clinic facilities, equipment, and team
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

                        {galleryPreviews.length < 6 && (
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
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

      {/* Working Hours Modal */}
      <WorkingHoursModal
        isOpen={showWorkingHoursModal}
        onClose={() => {
          setShowWorkingHoursModal(false);
          // Refresh working hours after closing
          if (clinicId) {
            fetchWorkingHours(clinicId).then(hours => setWorkingHours(hours));
          }
        }}
        clinicId={clinicId}
        clinicName={formData.clinicName}
      />
    </div>
  );
}
