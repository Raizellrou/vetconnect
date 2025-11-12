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
        (position) => {
          setPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please enable location services.');
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
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
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
              <MapPin size={24} color="white" />
            </div>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'white',
                margin: 0
              }}>
                Pick Location on Map
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: 0
              }}>
                Search or click on the map to select your clinic location
              </p>
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
            <X size={24} color="white" />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '20px 24px', borderBottom: '2px solid #f3f4f6' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MapPin 
                size={20} 
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for a location (e.g., Angeles City, Pampanga)"
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
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
            <button
              onClick={handleSearch}
              disabled={isSearching}
              style={{
                padding: '14px 32px',
                background: isSearching ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isSearching) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSearching) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }
              }}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginTop: '12px',
            marginBottom: 0
          }}>
            💡 Click anywhere on the map to place a marker, or use the search bar above
          </p>
        </div>

        {/* Map Placeholder */}
        <div style={{ 
          flex: 1, 
          position: 'relative',
          background: 'linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {/* Grid pattern background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}></div>

          {/* Placeholder content */}
          <div style={{
            textAlign: 'center',
            zIndex: 1,
            padding: '32px'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              background: 'linear-gradient(135deg, #818cf8 0%, #3b82f6 100%)',
              borderRadius: '50%',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
            }}>
              <MapPin size={60} color="white" />
            </div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '12px'
            }}>
              Map Placeholder
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              maxWidth: '500px',
              margin: '0 auto 24px'
            }}>
              Interactive map will appear here. You'll be able to search locations, click to place markers, and select your clinic's exact position.
            </p>
            <div style={{
              display: 'inline-block',
              background: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              fontSize: '0.875rem'
            }}>
              <span style={{ fontWeight: '700', color: '#1f2937' }}>Current Position:</span>{' '}
              <span style={{ color: '#3b82f6', fontWeight: '600' }}>
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Coordinate selector buttons */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 1000
          }}>
            <button
              onClick={handleCurrentLocation}
              style={{
                padding: '14px 20px',
                background: 'white',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151'
              }}
              title="Use current location"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <Locate size={20} style={{ color: '#3b82f6' }} />
              Use My Location
            </button>
          </div>
        </div>

        {/* Footer with Confirm Button */}
        <div style={{
          padding: '20px 24px',
          borderTop: '2px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fafafa'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0
          }}>
            {position ? '✓ Location selected' : 'Click on the map to select a location'}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!position}
              style={{
                padding: '12px 32px',
                background: position 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9375rem',
                fontWeight: '700',
                cursor: position ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: position ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (position) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (position) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
