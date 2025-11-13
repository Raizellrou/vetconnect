import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Phone, Clock, Building2, FileText, ArrowRight, ArrowLeft, CheckSquare, Search, X } from 'lucide-react';
import { saveClinic, updateClinic } from '../../utils/clinicStorage';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

// Ensure Leaflet marker icons load with Vite
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

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

// Helper used inside the map to capture clicks
function ClickToSetMarker({ onSet }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onSet([lat, lng]);
    }
  });
  return null;
}

export default function ClinicRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingClinic = location.state?.clinic || null;
  const mode = editingClinic ? 'edit' : 'create';

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
  const [mapCenter, setMapCenter] = useState([18.1978, 120.5936]); // Laoag City fallback
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');

  useEffect(() => {
    if (editingClinic) {
      setFormData({
        clinicName: editingClinic.clinicName || '',
        address: editingClinic.address || '',
        coordinates: editingClinic.coordinates || null,
        contactNumber: editingClinic.contactNumber || '',
        openHours: editingClinic.openHours || '',
        services: editingClinic.services || '',
        description: editingClinic.description || ''
      });
      if (editingClinic.coordinates) {
        const coords = editingClinic.coordinates;
        setSelectedCoords(Array.isArray(coords) ? coords : [coords.latitude || coords.lat, coords.longitude || coords.lng]);
      }
      if (editingClinic.services) {
        const servicesArray = editingClinic.services.split(',').map(s => s.trim()).filter(Boolean);
        setSelectedServices(servicesArray);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingClinic]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isMapOpen || isServiceModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMapOpen, isServiceModalOpen]);

  // Close modals on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (isServiceModalOpen) setIsServiceModalOpen(false);
        else if (isMapOpen) setIsMapOpen(false);
        else navigate('/clinic/management');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMapOpen, isServiceModalOpen, navigate]);

  // Set initial map center based on user location (if available)
  useEffect(() => {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.clinicName.trim()) newErrors.clinicName = 'Clinic name is required';
    }
    if (step === 2) {
      if (!formData.address.trim()) newErrors.address = 'Location is required';
      if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
      else if (!/^[0-9\s\-+()]{7,20}$/.test(formData.contactNumber)) newErrors.contactNumber = 'Invalid contact number format';
    }
    if (step === 3) {
      if (!formData.openHours.trim()) newErrors.openHours = 'Open hours are required';
      if (selectedServices.length === 0) newErrors.services = 'Please select at least one service';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleOpenMap = () => setIsMapOpen(true);

  const handleUseMyLocation = () => {
    if (!navigator?.geolocation) {
      alert('Geolocation not available');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelectedCoords([lat, lng]);
        setMapCenter([lat, lng]);
        setFormData(prev => ({ ...prev, coordinates: { latitude: lat, longitude: lng } }));
        setIsMapOpen(false);
      },
      (err) => {
        console.warn('Geolocation error', err);
        alert('Unable to get current location.');
      },
      { timeout: 7000 }
    );
  };

  // When user selects in modal map, apply to formData and close modal
  const handleMapSelect = (coords) => {
    setSelectedCoords(coords);
    setFormData(prev => ({ ...prev, coordinates: { latitude: coords[0], longitude: coords[1] } }));
    setIsMapOpen(false);
    if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
  };

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]);
  };

  const handleSelectAllServices = () => setSelectedServices(getFilteredServices());
  const handleDeselectAllServices = () => setSelectedServices([]);
  const getFilteredServices = () => {
    if (!serviceSearch.trim()) return AVAILABLE_SERVICES;
    return AVAILABLE_SERVICES.filter(s => s.toLowerCase().includes(serviceSearch.toLowerCase()));
  };

  const handleConfirmServices = () => {
    const servicesString = selectedServices.join(', ');
    setFormData(prev => ({ ...prev, services: servicesString }));
    if (errors.services) setErrors(prev => ({ ...prev, services: '' }));
    setIsServiceModalOpen(false);
    setServiceSearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all steps
    if (!(validateStep(1) && validateStep(2) && validateStep(3))) return;

    const payload = {
      clinicName: formData.clinicName,
      address: formData.address || '',
      contactNumber: formData.contactNumber || '',
      openHours: formData.openHours || '',
      services: selectedServices.join(', '),
      description: formData.description || ''
    };

    // include coordinates if selected -- normalize to numbers and include several shapes
    if (formData.coordinates) {
      // support object { latitude, longitude } or array [lat, lng]
      const raw = formData.coordinates;
      let lat = null;
      let lng = null;

      if (Array.isArray(raw)) {
        lat = Number(raw[0]);
        lng = Number(raw[1]);
      } else if (raw && typeof raw === 'object') {
        lat = Number(raw.latitude ?? raw.lat ?? raw[0]);
        lng = Number(raw.longitude ?? raw.lng ?? raw[1]);
      }

      // if values are swapped (common bug) try to detect and fix:
      // lat must be within [-90,90]; lng within [-180,180]
      const inLatRange = (v) => !Number.isNaN(v) && v >= -90 && v <= 90;
      const inLngRange = (v) => !Number.isNaN(v) && v >= -180 && v <= 180;

      if (!(inLatRange(lat) && inLngRange(lng)) && inLatRange(lng) && inLngRange(lat)) {
        // swap
        const tmp = lat; lat = lng; lng = tmp;
      }

      if (inLatRange(lat) && inLngRange(lng)) {
        payload.latitude = lat;
        payload.longitude = lng;
        payload.location = { lat, lng };
        // also keep a coords array for backward compatibility
        payload.coords = [lat, lng];
      } else {
        // invalid coords — omit but warn
        console.warn('Invalid coordinates not saved:', formData.coordinates);
      }
    }

    try {
      if (mode === 'edit') {
        // keep existing local storage helper
        updateClinic(editingClinic.id, { ...payload });
        // optionally update Firestore here if you track docIds
      } else {
        // save locally (existing flow)
        saveClinic({ ...payload });
        // also attempt to add to Firestore so backend persists coordinates
        try {
          await addDoc(collection(db, 'clinics'), {
            ...payload,
            ownerId: /* attempt to pick owner id if available via editingClinic or userData */ (editingClinic?.ownerId || null)
          });
        } catch (err) {
          // non-critical: Firestore may not be set up; log but proceed
          console.warn('Firestore addDoc failed (non-fatal):', err);
        }
      }

      navigate('/clinic/management');
    } catch (err) {
      console.error('Failed to save clinic', err);
      alert('Failed to save clinic. See console for details.');
    }
  };

  const handleCancel = () => navigate('/clinic/management');

  const StepIcon = (() => {
    switch (currentStep) {
      case 1: return Building2;
      case 2: return MapPin;
      case 3: return Clock;
      case 4: return FileText;
      default: return Building2;
    }
  })();

  const StepTitle = (() => {
    switch (currentStep) {
      case 1: return 'Basic Information';
      case 2: return 'Location & Contact';
      case 3: return 'Services & Hours';
      case 4: return 'Additional Details';
      default: return '';
    }
  })();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Progress Header */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StepIcon size={36} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>{mode === 'edit' ? 'Edit Clinic' : 'Register New Clinic'}</h1>
              <p style={{ fontSize: '1.125rem', color: '#6b7280', marginTop: 4 }}>Step {currentStep} of {totalSteps}: {StepTitle}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            {[1,2,3,4].map(step => (
              <div key={step} style={{ flex: 1, height: 8, background: step <= currentStep ? 'linear-gradient(135deg,#818cf8 0%,#6366f1 100%)' : '#e5e7eb', borderRadius: 4 }} />
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div style={{ background: 'white', borderRadius: 20, padding: 48, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', minHeight: 500 }}>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                  <div style={{ width: 100, height: 100, background: 'linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Building2 size={48} color="#818cf8" />
                  </div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', marginBottom: 12 }}>Let's start with the basics</h3>
                  <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Tell us about your clinic</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '.9375rem', fontWeight: 700, color: '#374151', marginBottom: 12 }}>
                    Clinic Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" name="clinicName" value={formData.clinicName} onChange={handleChange} placeholder="Enter your clinic name" autoFocus
                    style={{ width: '100%', padding: '18px 20px', border: `2px solid ${errors.clinicName ? '#ef4444' : '#e5e7eb'}`, borderRadius: 14, fontSize: '1.0625rem' }} />
                  {errors.clinicName && <p style={{ color: '#ef4444', marginTop: 10 }}>{errors.clinicName}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Location & Contact */}
            {currentStep === 2 && (
              <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                  <div style={{ width: 100, height: 100, background: 'linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <MapPin size={48} color="#3b82f6" />
                  </div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', marginBottom: 12 }}>Where are you located?</h3>
                  <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Help pet owners find and contact you</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '.9375rem', fontWeight: 700, color: '#374151', marginBottom: 12 }}>
                      Clinic Location <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter address or pick on map"
                        style={{ flex: 1, padding: '18px 20px', border: `2px solid ${errors.address ? '#ef4444' : '#e5e7eb'}`, borderRadius: 14 }}
                      />
                      <button
                        type="button"
                        onClick={handleOpenMap}
                        style={{ padding: '18px 28px', background: 'linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)', color: 'white', borderRadius: 14 }}
                      >
                        <MapPin size={20} /> Pick on Map
                      </button>
                    </div>
                    {errors.address && <p style={{ color: '#ef4444', marginTop: 10 }}>{errors.address}</p>}
                    <div style={{ marginTop: 8, color: '#475569' }}>
                      {formData.coordinates ? (
                        <div>
                          Selected coordinates: <strong>{`${formData.coordinates.latitude?.toFixed?.(6) ?? formData.coordinates[0]?.toFixed?.(6) ?? ''}, ${formData.coordinates.longitude?.toFixed?.(6) ?? formData.coordinates[1]?.toFixed?.(6) ?? ''}`}</strong>
                        </div>
                      ) : (
                        <div>Click "Pick on Map" to set your clinic's location.</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '.9375rem', fontWeight: 700, color: '#374151', marginBottom: 12 }}>
                      Contact Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={22} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        placeholder="Enter contact number"
                        style={{ width: '100%', padding: '18px 20px 18px 56px', border: `2px solid ${errors.contactNumber ? '#ef4444' : '#e5e7eb'}`, borderRadius: 14 }}
                      />
                    </div>
                    {errors.contactNumber && <p style={{ color: '#ef4444', marginTop: 10 }}>{errors.contactNumber}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Services & Hours */}
            {currentStep === 3 && (
              <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                  <div style={{ width: 100, height: 100, background: 'linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Clock size={48} color="#f59e0b" />
                  </div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 12 }}>Services and availability</h3>
                  <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>What services do you offer and when are you open?</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: 12 }}>Services Offered <span style={{ color: '#ef4444' }}>*</span></label>
                    <button type="button" onClick={() => setIsServiceModalOpen(true)} style={{ width: '100%', padding: 20, borderRadius: 14, border: `2px solid ${errors.services ? '#ef4444' : (selectedServices.length > 0 ? '#818cf8' : '#e5e7eb')}`, textAlign: 'left' }}>
                      {selectedServices.length > 0 ? `${selectedServices.length} selected` : 'Click to select services'}
                    </button>
                    {errors.services && <p style={{ color: '#ef4444', marginTop: 10 }}>{errors.services}</p>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: 12 }}>Open Hours <span style={{ color: '#ef4444' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <Clock size={22} style={{ position: 'absolute', left: 20, top: 20, color: '#9ca3af' }} />
                      <input type="text" name="openHours" value={formData.openHours} onChange={handleChange} placeholder="e.g., Mon-Fri: 8AM-6PM"
                        style={{ width: '100%', padding: '18px 20px 18px 56px', border: `2px solid ${errors.openHours ? '#ef4444' : '#e5e7eb'}`, borderRadius: 14 }} />
                    </div>
                    {errors.openHours && <p style={{ color: '#ef4444', marginTop: 10 }}>{errors.openHours}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Additional Details */}
            {currentStep === 4 && (
              <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                  <div style={{ width: 100, height: 100, background: 'linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <FileText size={48} color="#10b981" />
                  </div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 12 }}>Tell us more (Optional)</h3>
                  <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Add any additional information about your clinic</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 12 }}>Brief Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows="10" placeholder="Describe your clinic..."
                    style={{ width: '100%', padding: 20, border: '2px solid #e5e7eb', borderRadius: 14, fontSize: '1.0625rem' }} />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Navigation Footer */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" onClick={currentStep === 1 ? handleCancel : handlePrevious} style={{ padding: '16px 32px', background: 'white', borderRadius: 14 }}>
            <ArrowLeft size={20} /> {currentStep === 1 ? 'Cancel' : 'Previous'}
          </button>

          {currentStep < totalSteps ? (
            <button type="button" onClick={handleNext} style={{ padding: '16px 40px', background: 'linear-gradient(135deg,#818cf8 0%,#6366f1 100%)', color: 'white', borderRadius: 14 }}>
              Next Step <ArrowRight size={20} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} style={{ padding: '16px 40px', background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)', color: 'white', borderRadius: 14 }}>
              <CheckSquare size={20} /> {mode === 'edit' ? 'Update Clinic' : 'Save Clinic'}
            </button>
          )}
        </div>
      </div>

      {/* Map Modal */}
      {isMapOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
             onClick={(e) => { if (e.target === e.currentTarget) setIsMapOpen(false); }}>
          <div style={{ width: '92%', maxWidth: 920, background: 'white', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid #eee' }}>
              <h3 style={{ margin: 0 }}>Pick Clinic Location</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleUseMyLocation} style={{ padding: '8px 12px', background: '#eef2ff', borderRadius: 8 }}>Use my current location</button>
                <button onClick={() => setIsMapOpen(false)} style={{ padding: 8, borderRadius: 8, background: 'transparent' }}><X /></button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 320, height: 420 }}>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                  <ClickToSetMarker onSet={(coords) => { setSelectedCoords(coords); }} />
                  {selectedCoords && <Marker position={selectedCoords} />}
                </MapContainer>
              </div>

              <div style={{ width: 360, padding: 16, boxSizing: 'border-box' }}>
                <p style={{ marginTop: 0, color: '#475569' }}>
                  Click anywhere on the map to place a marker for your clinic. After selecting, coordinates will be saved with your clinic record.
                </p>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 700 }}>Selected Coordinates</div>
                  <div style={{ marginTop: 8, color: '#111827' }}>
                    {selectedCoords ? (
                      <>
                        <div>Latitude: {selectedCoords[0].toFixed(6)}</div>
                        <div>Longitude: {selectedCoords[1].toFixed(6)}</div>
                        <div style={{ marginTop: 12 }}>
                          <button onClick={() => handleMapSelect(selectedCoords)} className="px-4 py-2 rounded bg-indigo-600 text-white">Use this location</button>
                        </div>
                      </>
                    ) : (
                      <div style={{ color: '#6b7280' }}>No location selected yet.</div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 700 }}>Tips</div>
                  <ul style={{ color: '#6b7280', marginTop: 8 }}>
                    <li>Zoom/pan the map to refine placement.</li>
                    <li>Use "Use my current location" for quick placement.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Selection Modal */}
      {isServiceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
             onClick={(e) => { if (e.target === e.currentTarget) setIsServiceModalOpen(false); }}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(135deg,#818cf8 0%,#a78bfa 100%)', padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckSquare size={24} color="white" />
                </div>
                <div>
                  <h3 style={{ color: 'white', margin: 0 }}>Select Services</h3>
                  <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>Choose the services your clinic offers</p>
                </div>
              </div>
              <button onClick={() => setIsServiceModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}><X /></button>
            </div>

            <div style={{ padding: 20, borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} placeholder="Search services..." style={{ width: '100%', padding: '12px 12px 12px 44px', border: '2px solid #e5e7eb', borderRadius: 10 }} />
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button type="button" onClick={handleSelectAllServices} style={{ padding: '6px 16px', background: '#eef2ff', borderRadius: 6 }}>Select All</button>
                <button type="button" onClick={handleDeselectAllServices} style={{ padding: '6px 16px', background: '#f3f4f6', borderRadius: 6 }}>Deselect All</button>
                {selectedServices.length > 0 && <div style={{ marginLeft: 'auto', padding: '6px 12px', background: 'linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%)', borderRadius: 6 }}>{selectedServices.length} selected</div>}
              </div>
            </div>

            <div style={{ maxHeight: '50vh', overflowY: 'auto', padding: 16 }}>
              {getFilteredServices().map(service => {
                const isSelected = selectedServices.includes(service);
                return (
                  <label key={service} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: isSelected ? '#eef2ff' : '#f9fafb', marginBottom: 8, border: `2px solid ${isSelected ? '#818cf8' : '#e5e7eb'}` }}>
                    <input type="checkbox" checked={isSelected} onChange={() => handleServiceToggle(service)} />
                    <span style={{ fontWeight: isSelected ? 700 : 500 }}>{service}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #e5e7eb' }}>
              <button onClick={() => { setIsServiceModalOpen(false); setServiceSearch(''); }} style={{ padding: '12px 24px', background: '#f3f4f6', borderRadius: 10 }}>Cancel</button>
              <button onClick={handleConfirmServices} style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#818cf8 0%,#6366f1 100%)', color: 'white', borderRadius: 10 }}>Confirm Selection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function addClinicToFirestore(input) {
  // minimal defensive cloning
  const data = { ...(input || {}) };

  // normalize and validate string fields
  const name = data.name ? String(data.name).trim() : '';
  const locationStr = data.location ? String(data.location).trim() : (data.address ? String(data.address).trim() : '');
  const contact = data.contact ? String(data.contact).trim() : (data.contactNumber ? String(data.contactNumber).trim() : '');
  const email = data.email ? String(data.email).trim() : (data.ownerEmail ? String(data.ownerEmail).trim() : '');
  const ownerId = data.ownerId ? String(data.ownerId).trim() : (data.owner || '');

  if (!name) throw new Error('Clinic name is required');
  if (!locationStr) throw new Error('Clinic location (address) is required');
  if (!contact) throw new Error('Contact is required');
  if (!ownerId) throw new Error('ownerId is required');

  // services -> array of non-empty strings
  let services = [];
  if (Array.isArray(data.services)) {
    services = data.services.map(String).map(s => s.trim()).filter(Boolean);
  } else if (typeof data.services === 'string') {
    services = data.services.split(',').map(s => String(s).trim()).filter(Boolean);
  }

  // coordinates normalization: accept {latitude,longitude} or {lat,lng} or [lat,lng] or top-level latitude/longitude
  let lat = NaN, lng = NaN;
  const tryNum = (v) => {
    if (v === undefined || v === null) return NaN;
    if (typeof v === 'number') return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  };

  if (Array.isArray(data.coordinates) && data.coordinates.length >= 2) {
    lat = tryNum(data.coordinates[0]);
    lng = tryNum(data.coordinates[1]);
  } else if (data.coordinates && typeof data.coordinates === 'object') {
    lat = tryNum(data.coordinates.latitude ?? data.coordinates.lat ?? data.coordinates[0]);
    lng = tryNum(data.coordinates.longitude ?? data.coordinates.lng ?? data.coordinates[1]);
  } else {
    lat = tryNum(data.latitude ?? data.lat);
    lng = tryNum(data.longitude ?? data.lng);
  }

  // validate ranges and attempt auto-swap if needed
  const inLat = (v) => !Number.isNaN(v) && v >= -90 && v <= 90;
  const inLng = (v) => !Number.isNaN(v) && v >= -180 && v <= 180;

  if (!(inLat(lat) && inLng(lng)) && (inLat(lng) && inLng(lat))) {
    // swapped -> swap
    const tmp = lat; lat = lng; lng = tmp;
  }

  // If still invalid, throw
  if (!inLat(lat) || !inLng(lng)) {
    throw new Error('Invalid coordinates. Please provide valid latitude and longitude.');
  }

  // build document following desired shape
  const doc = {
    name,
    location: locationStr,
    contact,
    email: email || '',
    ownerId,
    services,
    coordinates: {
      latitude: Number(lat),
      longitude: Number(lng)
    },
    createdAt: null // placeholder; will be set to serverTimestamp below
  };

  try {
    // dynamic import serverTimestamp in case not imported at file top
    const { serverTimestamp } = await import('firebase/firestore');
    doc.createdAt = serverTimestamp();

    // use db from file scope if available, otherwise getFirestore()
    let firestoreDb = (typeof db !== 'undefined' && db) ? db : (await import('../../firebase/firebase')).db;
    // ensure collection/addDoc available (they may already be imported in file scope)
    const { collection, addDoc } = await import('firebase/firestore');

    const ref = await addDoc(collection(firestoreDb, 'clinics'), doc);
    return ref.id;
  } catch (err) {
    console.error('addClinicToFirestore error:', err);
    throw new Error('Failed to save clinic to Firestore: ' + (err?.message || String(err)));
  }
}
