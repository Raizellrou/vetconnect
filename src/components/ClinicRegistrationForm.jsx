import React, { useState, useEffect } from 'react';
import { MapPin, Save, X, CheckSquare, Search, ArrowRight, ArrowLeft, Check, Building2, Phone, Clock, FileText } from 'lucide-react';
import MapPicker from './MapPicker';

// Available veterinary services
const AVAILABLE_SERVICES = [
  'Vaccination',
  'Surgery',
  'Grooming',
  'Dental Care',
  'Checkups/Consultation',
  'Emergency Care',
  'Laboratory Tests',
  'Deworming',
  'Spay/Neuter',
  'Pet Boarding',
  'X-Ray/Imaging',
  'Microchipping'
];

export default function ClinicRegistrationForm({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null,
  mode = 'create' // 'create' or 'edit'
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [formData, setFormData] = useState({
    clinicName: '',
    address: '',
    coordinates: null,
    contactNumber: '',
    openHours: '',
    services: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        clinicName: initialData.clinicName || '',
        address: initialData.address || '',
        coordinates: initialData.coordinates || null,
        contactNumber: initialData.contactNumber || '',
        openHours: initialData.openHours || '',
        services: initialData.services || '',
        description: initialData.description || ''
      });
      // Parse services from comma-separated string to array
      if (initialData.services) {
        const servicesArray = initialData.services.split(',').map(s => s.trim()).filter(s => s);
        setSelectedServices(servicesArray);
      }
    }
  }, [initialData]);

  // Reset to step 1 when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen || isMapOpen || isServiceModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isMapOpen, isServiceModalOpen]);

  // Close modals on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (isServiceModalOpen) setIsServiceModalOpen(false);
        else if (isMapOpen) setIsMapOpen(false);
        else if (isOpen) handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isMapOpen, isServiceModalOpen]);

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.clinicName.trim()) {
        newErrors.clinicName = 'Clinic name is required';
      }
    }

    if (step === 2) {
      if (!formData.address.trim()) {
        newErrors.address = 'Location is required';
      }
      if (!formData.contactNumber.trim()) {
        newErrors.contactNumber = 'Contact number is required';
      } else if (!/^[0-9\s\-+()]{7,20}$/.test(formData.contactNumber)) {
        newErrors.contactNumber = 'Invalid contact number format';
      }
    }

    if (step === 3) {
      if (!formData.openHours.trim()) {
        newErrors.openHours = 'Open hours are required';
      }
      if (selectedServices.length === 0) {
        newErrors.services = 'Please select at least one service';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    return validateStep(1) && validateStep(2) && validateStep(3);
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleMapSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      address: locationData.address,
      coordinates: locationData.coordinates
    }));
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: '' }));
    }
  };

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) {
        return prev.filter(s => s !== service);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleSelectAllServices = () => {
    const filtered = getFilteredServices();
    setSelectedServices(filtered);
  };

  const handleDeselectAllServices = () => {
    setSelectedServices([]);
  };

  const handleConfirmServices = () => {
    const servicesString = selectedServices.join(', ');
    setFormData(prev => ({
      ...prev,
      services: servicesString
    }));
    if (errors.services) {
      setErrors(prev => ({ ...prev, services: '' }));
    }
    setIsServiceModalOpen(false);
    setServiceSearch('');
  };

  const handleOpenServiceModal = () => {
    setIsServiceModalOpen(true);
  };

  const getFilteredServices = () => {
    if (!serviceSearch.trim()) return AVAILABLE_SERVICES;
    return AVAILABLE_SERVICES.filter(service =>
      service.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  };

  const removeService = (serviceToRemove) => {
    const updated = selectedServices.filter(s => s !== serviceToRemove);
    setSelectedServices(updated);
    setFormData(prev => ({
      ...prev,
      services: updated.join(', ')
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      clinicName: '',
      address: '',
      coordinates: null,
      contactNumber: '',
      openHours: '',
      services: '',
      description: ''
    });
    setErrors({});
    setSelectedServices([]);
    setServiceSearch('');
    setCurrentStep(1);
    onClose();
  };

  const getStepIcon = (step) => {
    switch(step) {
      case 1: return Building2;
      case 2: return MapPin;
      case 3: return Clock;
      case 4: return FileText;
      default: return Building2;
    }
  };

  const getStepTitle = (step) => {
    switch(step) {
      case 1: return 'Basic Information';
      case 2: return 'Location & Contact';
      case 3: return 'Services & Hours';
      case 4: return 'Additional Details';
      default: return '';
    }
  };

  if (!isOpen) return null;

  if (!isOpen) return null;

  const StepIcon = getStepIcon(currentStep);

  return (
    <>
      <style>
        {`
          form::-webkit-scrollbar,
          div[style*="overflowY"]::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          style={{
            animation: 'slideIn 0.3s ease'
          }}
        >
          {/* Progress Header */}
          <div style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
            padding: '32px 32px 24px',
            position: 'relative'
          }}>
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <X size={24} color="white" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <StepIcon size={32} color="white" />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.875rem',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0
                }}>
                  {mode === 'edit' ? 'Edit Clinic' : 'Add New Clinic'}
                </h2>
                <p style={{
                  fontSize: '1rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: '4px 0 0 0'
                }}>
                  Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{
              display: 'flex',
              gap: '8px',
              width: '100%'
            }}>
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  style={{
                    flex: 1,
                    height: '6px',
                    background: step <= currentStep ? 'white' : 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '3px',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} style={{
            flex: 1,
            overflow: 'auto',
            padding: '40px',
            minHeight: '400px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div style={{
                animation: 'fadeIn 0.3s ease',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '40px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <Building2 size={40} color="#818cf8" />
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    Let's start with the basics
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    color: '#6b7280'
                  }}>
                    Tell us about your clinic
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Clinic Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleChange}
                    placeholder="Enter your clinic name"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: `2px solid ${errors.clinicName ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      if (!errors.clinicName) {
                        e.target.style.borderColor = '#818cf8';
                        e.target.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.1)';
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.clinicName ? '#ef4444' : '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {errors.clinicName && (
                    <p style={{
                      color: '#ef4444',
                      fontSize: '0.875rem',
                      marginTop: '8px',
                      fontWeight: '500'
                    }}>
                      {errors.clinicName}
                    </p>
                  )}
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginTop: '8px'
                  }}>
                    This is how pet owners will find your clinic
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Location & Contact */}
            {currentStep === 2 && (
              <div style={{
                animation: 'fadeIn 0.3s ease',
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '40px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <MapPin size={40} color="#3b82f6" />
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    Where are you located?
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    color: '#6b7280'
                  }}>
                    Help pet owners find and contact you
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Clinic Location <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter address or pick on map"
                        style={{
                          flex: 1,
                          padding: '16px',
                          border: `2px solid ${errors.address ? '#ef4444' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          fontSize: '1rem',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                          if (!errors.address) {
                            e.target.style.borderColor = '#818cf8';
                            e.target.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.1)';
                          }
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.address ? '#ef4444' : '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setIsMapOpen(true)}
                        style={{
                          padding: '16px 24px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <MapPin size={18} />
                        Pick on Map
                      </button>
                    </div>
                    {errors.address && (
                      <p style={{
                        color: '#ef4444',
                        fontSize: '0.875rem',
                        marginTop: '8px',
                        fontWeight: '500'
                      }}>
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Contact Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={20} style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af'
                      }} />
                      <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        placeholder="Enter contact number"
                        style={{
                          width: '100%',
                          padding: '16px 16px 16px 48px',
                          border: `2px solid ${errors.contactNumber ? '#ef4444' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          fontSize: '1rem',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                          if (!errors.contactNumber) {
                            e.target.style.borderColor = '#818cf8';
                            e.target.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.1)';
                          }
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.contactNumber ? '#ef4444' : '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    {errors.contactNumber && (
                      <p style={{
                        color: '#ef4444',
                        fontSize: '0.875rem',
                        marginTop: '8px',
                        fontWeight: '500'
                      }}>
                        {errors.contactNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Services & Hours */}
            {currentStep === 3 && (
              <div style={{
                animation: 'fadeIn 0.3s ease',
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '40px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <Clock size={40} color="#f59e0b" />
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    Services and availability
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    color: '#6b7280'
                  }}>
                    What services do you offer and when are you open?
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Services Offered <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenServiceModal}
                      style={{
                        width: '100%',
                        padding: '16px',
                        background: selectedServices.length > 0 ? '#eef2ff' : 'white',
                        border: `2px solid ${errors.services ? '#ef4444' : selectedServices.length > 0 ? '#818cf8' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!errors.services) {
                          e.currentTarget.style.borderColor = '#818cf8';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!errors.services) {
                          e.currentTarget.style.borderColor = selectedServices.length > 0 ? '#818cf8' : '#e5e7eb';
                        }
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {selectedServices.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {selectedServices.slice(0, 3).map((service, index) => (
                              <span
                                key={index}
                                style={{
                                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                  color: '#1e40af',
                                  padding: '4px 12px',
                                  borderRadius: '16px',
                                  fontSize: '0.875rem',
                                  fontWeight: '600'
                                }}
                              >
                                {service}
                              </span>
                            ))}
                            {selectedServices.length > 3 && (
                              <span style={{
                                background: '#818cf8',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '16px',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}>
                                +{selectedServices.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Click to select services</span>
                        )}
                      </div>
                      <CheckSquare size={20} color={selectedServices.length > 0 ? '#818cf8' : '#9ca3af'} />
                    </button>
                    {selectedServices.length > 0 && (
                      <p style={{
                        color: '#3b82f6',
                        fontSize: '0.875rem',
                        marginTop: '8px',
                        fontWeight: '600'
                      }}>
                        {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                    {errors.services && (
                      <p style={{
                        color: '#ef4444',
                        fontSize: '0.875rem',
                        marginTop: '8px',
                        fontWeight: '500'
                      }}>
                        {errors.services}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      Open Hours <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Clock size={20} style={{
                        position: 'absolute',
                        left: '16px',
                        top: '16px',
                        color: '#9ca3af'
                      }} />
                      <input
                        type="text"
                        name="openHours"
                        value={formData.openHours}
                        onChange={handleChange}
                        placeholder="e.g., Mon-Fri: 8AM-6PM, Sat: 9AM-5PM"
                        style={{
                          width: '100%',
                          padding: '16px 16px 16px 48px',
                          border: `2px solid ${errors.openHours ? '#ef4444' : '#e5e7eb'}`,
                          borderRadius: '12px',
                          fontSize: '1rem',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => {
                          if (!errors.openHours) {
                            e.target.style.borderColor = '#818cf8';
                            e.target.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.1)';
                          }
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.openHours ? '#ef4444' : '#e5e7eb';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    {errors.openHours && (
                      <p style={{
                        color: '#ef4444',
                        fontSize: '0.875rem',
                        marginTop: '8px',
                        fontWeight: '500'
                      }}>
                        {errors.openHours}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Additional Details */}
            {currentStep === 4 && (
              <div style={{
                animation: 'fadeIn 0.3s ease',
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '40px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <FileText size={40} color="#10b981" />
                  </div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '8px'
                  }}>
                    Tell us more (Optional)
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    color: '#6b7280'
                  }}>
                    Add any additional information about your clinic
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Brief Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell pet owners what makes your clinic special, your areas of expertise, or any other information you'd like to share..."
                    rows="8"
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#818cf8';
                      e.target.style.boxShadow = '0 0 0 3px rgba(129, 140, 248, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginTop: '8px'
                  }}>
                    This description will help pet owners learn more about your clinic
                  </p>
                </div>
              </div>
            )}
          </form>

          {/* Navigation Footer */}
          <div style={{
            padding: '24px 40px',
            borderTop: '2px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'white'
          }}>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              style={{
                padding: '12px 24px',
                background: currentStep === 1 ? '#f3f4f6' : 'white',
                color: currentStep === 1 ? '#9ca3af' : '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                fontWeight: '600',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentStep !== 1) {
                  e.currentTarget.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (currentStep !== 1) {
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              <ArrowLeft size={18} />
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(129, 140, 248, 0.4)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(129, 140, 248, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(129, 140, 248, 0.4)';
                }}
              >
                Next
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                }}
              >
                <Check size={18} />
                {mode === 'edit' ? 'Update Clinic' : 'Save Clinic'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map Picker Modal */}
      <MapPicker
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleMapSelect}
        initialPosition={formData.coordinates}
      />

      {/* Service Selection Modal */}
      {isServiceModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsServiceModalOpen(false);
              setServiceSearch('');
            }
          }}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideIn 0.3s ease'
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
              padding: '24px',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckSquare size={24} color="white" />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'white',
                    margin: 0
                  }}>
                    Select Services
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    margin: 0
                  }}>
                    Choose the services your clinic offers
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsServiceModalOpen(false);
                  setServiceSearch('');
                }}
                style={{
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <X size={24} color="white" />
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ position: 'relative' }}>
                <Search 
                  size={20} 
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 44px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#818cf8';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                />
              </div>
              
              {/* Select/Deselect All */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleSelectAllServices}
                  style={{
                    padding: '6px 16px',
                    background: '#eef2ff',
                    color: '#4f46e5',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e0e7ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#eef2ff';
                  }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllServices}
                  style={{
                    padding: '6px 16px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                >
                  Deselect All
                </button>
                {selectedServices.length > 0 && (
                  <span style={{
                    padding: '6px 12px',
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    color: '#1e40af',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    marginLeft: 'auto'
                  }}>
                    {selectedServices.length} selected
                  </span>
                )}
              </div>
            </div>

            {/* Services List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 24px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {getFilteredServices().length > 0 ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {getFilteredServices().map((service) => {
                    const isSelected = selectedServices.includes(service);
                    return (
                      <label
                        key={service}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '14px 16px',
                          background: isSelected ? '#eef2ff' : '#f9fafb',
                          border: `2px solid ${isSelected ? '#818cf8' : '#e5e7eb'}`,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleServiceToggle(service)}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: '#818cf8'
                          }}
                        />
                        <span style={{
                          fontSize: '0.9375rem',
                          fontWeight: isSelected ? '600' : '500',
                          color: isSelected ? '#4f46e5' : '#374151'
                        }}>
                          {service}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#9ca3af'
                }}>
                  <p style={{ fontSize: '0.9375rem' }}>No services found matching "{serviceSearch}"</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={() => {
                  setIsServiceModalOpen(false);
                  setServiceSearch('');
                }}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
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
                type="button"
                onClick={handleConfirmServices}
                style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(129, 140, 248, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(129, 140, 248, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(129, 140, 248, 0.4)';
                }}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
