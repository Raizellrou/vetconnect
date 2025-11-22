import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { X, MapPin, Locate, AlertCircle } from 'lucide-react';
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
function LocationMarker({ position, setPosition, setAddressName }) {
  const map = useMapEvents({
    async click(e) {
      const newPos = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      };
      setPosition(newPos);
      
      // Fetch address for the new position
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`
        );
        const data = await response.json();
        setAddressName(data.display_name || 'Unknown location');
      } catch (error) {
        console.error('Error fetching address:', error);
        setAddressName(`${newPos.lat.toFixed(6)}, ${newPos.lng.toFixed(6)}`);
      }
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
  const [addressName, setAddressName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // Debug log
  console.log('MapPicker loaded - Enhanced design v2.0');

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
      // Fetch address for initial position
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${initialPosition.lat}&lon=${initialPosition.lng}`)
        .then(res => res.json())
        .then(data => setAddressName(data.display_name || 'Unknown location'))
        .catch(() => setAddressName(`${initialPosition.lat.toFixed(6)}, ${initialPosition.lng.toFixed(6)}`));
    }
  }, [initialPosition]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError('');
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
        setAddressName(location.display_name || 'Unknown location');
      } else {
        setError('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setError('Error searching for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setError('');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          console.log('Got location:', pos.coords.latitude, pos.coords.longitude);
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setPosition(newPos);
          setError('');
          
          // Fetch address for current location
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPos.lat}&lon=${newPos.lng}`
            );
            const data = await response.json();
            setAddressName(data.display_name || 'Unknown location');
          } catch (error) {
            console.error('Error fetching address:', error);
            setAddressName(`${newPos.lat.toFixed(6)}, ${newPos.lng.toFixed(6)}`);
          }
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
          setError(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
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
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: 'var(--vc-radius-lg, 12px)',
          boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.3)',
          maxWidth: '520px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Compact Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="white" />
            <h2 style={{
              fontSize: '0.9375rem',
              fontWeight: '600',
              color: 'white',
              margin: 0
            }}>
              Select Location
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '4px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '6px',
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
            <X size={16} color="white" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            margin: '10px 12px 0',
            padding: '10px',
            background: '#fee2e2',
            border: '1px solid #f87171',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertCircle size={14} color="#ef4444" />
            <p style={{ margin: 0, color: '#991b1b', fontSize: '0.75rem', fontWeight: 500, flex: 1 }}>
              {error}
            </p>
            <button
              onClick={() => setError('')}
              style={{
                padding: '2px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <X size={12} color="#ef4444" />
            </button>
          </div>
        )}

        {/* Instruction */}
        <div style={{
          padding: '10px 12px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          borderBottom: '1px solid #93c5fd',
          fontSize: '0.75rem',
          color: '#1e40af',
          textAlign: 'center',
          fontWeight: 500
        }}>
          💡 Click anywhere on the map to set your clinic location
        </div>

        {/* Square Map Container */}
        <div style={{ 
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          background: '#f8fafc',
          overflow: 'hidden'
        }}>
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={13}
            style={{ 
              height: '100%', 
              width: '100%'
            }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} setAddressName={setAddressName} />
          </MapContainer>

          {/* Status Badge - Top Left */}
          {position && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '4px 10px',
              borderRadius: '999px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <MapPin size={12} color="white" />
              <span style={{ 
                color: 'white', 
                fontSize: '0.6875rem', 
                fontWeight: 600
              }}>
                SELECTED
              </span>
            </div>
          )}

          {/* Location Display - Bottom */}
          {position && (
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              right: '10px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              padding: '8px 12px',
              borderRadius: '8px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <MapPin size={12} color="#10b981" />
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#374151' }}>
                  Selected Location
                </span>
              </div>
              <p style={{ 
                fontSize: '0.6875rem', 
                color: '#6b7280', 
                margin: 0,
                lineHeight: '1.4',
                maxHeight: '2.8em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {addressName || 'Click on map to select location'}
              </p>
            </div>
          )}
        </div>

        {/* Compact Footer */}
        <div style={{
          padding: '12px',
          borderTop: '1px solid #e5e7eb',
          background: '#fafafa'
        }}>
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button
              onClick={handleCurrentLocation}
              className="vc-btn-secondary"
              style={{
                flex: 1,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.75rem'
              }}
            >
              <Locate size={14} />
              <span>Current Location</span>
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={!position}
              className="vc-btn-success"
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                opacity: position ? 1 : 0.5,
                cursor: position ? 'pointer' : 'not-allowed'
              }}
            >
              <span>✓</span>
              <span>Confirm</span>
            </button>
          </div>

          {/* Help Text */}
          <p style={{
            fontSize: '0.6875rem',
            color: '#6b7280',
            margin: 0,
            textAlign: 'center',
            lineHeight: '1.3'
          }}>
            Click on map to place marker
          </p>
        </div>
      </div>
    </div>
  );
}
