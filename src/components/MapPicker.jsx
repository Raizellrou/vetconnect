import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { X, MapPin, Locate } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React Leaflet  
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={[position.lat, position.lng]} />
  );
}

export default function MapPicker({ isOpen, onClose, onSelectLocation, initialPosition }) {
  const defaultCenter = { lat: 15.1450, lng: 120.5887 }; // Angeles City, Central Luzon
  const [position, setPosition] = useState(initialPosition || defaultCenter);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debug log
  console.log('MapPicker loaded - Enhanced design v2.0');

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Using Nominatim (OpenStreetMap) geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        setPosition({
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon)
        });
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Error searching for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('Got location:', pos.coords.latitude, pos.coords.longitude);
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Unable to get your current location. ';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Please enable location permissions for this site.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage += 'The request to get your location timed out.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
          }
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleConfirm = async () => {
    if (!position) return;

    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`
      );
      const data = await response.json();
      
      const address = data.display_name || `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
      
      onSelectLocation({
        coordinates: position,
        address: address
      });
      onClose();
    } catch (error) {
      console.error('Error getting address:', error);
      // Fallback to coordinates if reverse geocoding fails
      onSelectLocation({
        coordinates: position,
        address: `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxWidth: '1200px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideIn 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MapPin size={20} color="white" />
            </div>
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'white',
                margin: 0
              }}>
                Pick Clinic Location
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
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
            <X size={20} color="white" />
          </button>
        </div>

        {/* Enhanced Top Action Bar with Blue Gradient */}
        <div style={{ 
          padding: '24px', 
          background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)', 
          borderBottom: '2px solid #e0e7ff'
        }}>
          <button
            onClick={handleCurrentLocation}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontSize: '1rem',
              fontWeight: '700',
              color: 'white',
              marginBottom: '16px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.4)';
            }}
          >
            <Locate size={22} strokeWidth={2.5} />
            <span>Use my current location</span>
          </button>
          
          <div style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '2px solid #93c5fd',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#1e40af',
              margin: 0,
              lineHeight: '1.6',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <span style={{ fontSize: '1.25rem' }}>💡</span>
              <span><strong>Quick Tip:</strong> Click anywhere on the map below to place a marker for your clinic location. Your coordinates will be automatically saved.</span>
            </p>
          </div>
        </div>

        {/* Map Container */}
        <div style={{ 
          flex: 1, 
          position: 'relative',
          background: '#f8fafc',
          overflow: 'hidden'
        }}>
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={13}
            style={{ 
              height: '100%', 
              width: '100%',
              borderRadius: '0'
            }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>

          {/* Enhanced Coordinates Display Card */}
          <div style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
            padding: '20px 24px',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(59, 130, 246, 0.1)',
            border: '2px solid #93c5fd',
            backdropFilter: 'blur(12px)',
            zIndex: 1000,
            minWidth: '260px'
          }}>
            <div style={{ 
              color: '#2563eb', 
              marginBottom: '12px', 
              fontSize: '0.875rem', 
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MapPin size={18} strokeWidth={2.5} />
              SELECTED LOCATION
            </div>
            <div style={{ 
              color: '#1f2937',
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Latitude:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>{position.lat.toFixed(6)}</span>
            </div>
            <div style={{ 
              color: '#1f2937',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Longitude:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>{position.lng.toFixed(6)}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Footer Section */}
        <div style={{
          padding: '24px',
          borderTop: '2px solid #e0e7ff',
          background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)'
        }}>
          {/* Yellow Tips Box */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              padding: '18px 22px',
              borderRadius: '14px',
              border: '2px solid #fbbf24',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)'
            }}>
              <h4 style={{ 
                fontSize: '0.9375rem', 
                fontWeight: '800', 
                color: '#92400e', 
                margin: '0 0 10px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '0.02em'
              }}>
                <span style={{ fontSize: '1.25rem' }}>💡</span>
                QUICK TIPS
              </h4>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '24px',
                fontSize: '0.875rem',
                color: '#78350f',
                lineHeight: '1.8',
                fontWeight: 500
              }}>
                <li>Use the <strong>zoom controls (+/-)</strong> on the left to adjust your view</li>
                <li>Click the blue <strong>"Use my current location"</strong> button above for instant placement</li>
                <li><strong>Click anywhere on the map</strong> to manually pin your clinic's exact location</li>
              </ul>
            </div>
          </div>
          
          {/* Action Buttons Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ 
              fontSize: '0.875rem', 
              color: position ? '#10b981' : '#6b7280', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {position ? (
                <>
                  <span style={{ fontSize: '1.125rem' }}>✓</span>
                  <span>Location selected and ready to use</span>
                </>
              ) : (
                <span>Please select a location on the map</span>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '14px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '14px 28px',
                  background: 'white',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirm}
                disabled={!position}
                style={{
                  padding: '14px 32px',
                  background: position 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                    : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '800',
                  cursor: position ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: position ? '0 4px 16px rgba(16, 185, 129, 0.4)' : 'none',
                  letterSpacing: '0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (position) {
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (position) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
                  }
                }}
              >
                <span style={{ fontSize: '1.125rem' }}>✓</span>
                <span>Use this location</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
