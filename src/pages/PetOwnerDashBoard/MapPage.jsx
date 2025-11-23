import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Phone, Clock, Star, ChevronRight, Search, Bookmark, BookmarkCheck } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import Toast from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/MapPage.module.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { addBookmark, removeBookmark } from '../../firebase/firestoreHelpers';
import { useCollection } from '../../hooks/useCollection';

// Helper component: fit map to bounds when clinics change
function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !bounds || bounds.length === 0) return;
    try {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } catch (err) {
      // ignore
    }
  }, [map, bounds]);
  return null;
}

// Helper component: fly to selected clinic smoothly
function FlyToSelected({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !position) return;
    try {
      map.flyTo(position, 15, { duration: 0.8 });
    } catch (err) {
      // ignore
    }
  }, [map, position]);
  return null;
}

export default function MapPage() {
  const { userData, currentUser } = useAuth();
  const displayName = userData?.fullName || userData?.displayName || userData?.email;
  const navigate = useNavigate();

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkLoading, setBookmarkLoading] = useState({});
  const [toast, setToast] = useState(null);
  const [findingNearest, setFindingNearest] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const searchInputRef = React.useRef(null);
  const dropdownRef = React.useRef(null);

  // Real-time bookmarks listener
  const {
    docs: bookmarks = [],
    loading: bookmarksLoading
  } = useCollection(
    currentUser?.uid ? `users/${currentUser.uid}/bookmarks` : null
  );

  // Create a Set of bookmarked clinic IDs for fast lookup
  const bookmarkedClinicIds = useMemo(() => {
    return new Set(bookmarks.map(b => b.clinicId));
  }, [bookmarks]);

  // default Laoag City
  const defaultCenter = { lat: 18.1978, lng: 120.5936 };
  const mapCenter = userLocation || defaultCenter;

  // Fetch clinics once using getDocs
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const colRef = collection(db, 'clinics');
        const snap = await getDocs(colRef);
        if (!mounted) return;
        const arr = [];
        snap.forEach((d) => {
          arr.push({ id: d.id, ...d.data() });
        });
        setClinics(arr);
      } catch (err) {
        console.error('Failed to load clinics', err);
        setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // browser geolocation (one-shot)
  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // ignore error, keep default
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle selecting a clinic from dropdown
  const handleSelectClinic = (clinic) => {
    setSelectedClinicId(clinic.id);
    setSearchQuery(clinic.name || clinic.clinicName || '');
    setShowDropdown(false);
    setToast({ 
      type: 'success', 
      message: `Selected: ${clinic.name || clinic.clinicName}` 
    });
  };

  // Handle Find Nearest Clinic
  const handleFindNearest = () => {
    if (!navigator.geolocation) {
      setToast({ type: 'error', message: 'Geolocation is not supported by your browser' });
      return;
    }

    setFindingNearest(true);
    setToast({ 
      type: 'info', 
      message: 'Getting your location...' 
    });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        setUserLocation({ lat: userLat, lng: userLng });
        
        // Helper function to parse coordinates
        const tryNum = (v) => {
          if (v === undefined || v === null) return NaN;
          const n = typeof v === 'number' ? v : Number(v);
          return Number.isFinite(n) ? n : NaN;
        };

        const inLat = (v) => !Number.isNaN(v) && v >= -90 && v <= 90;
        const inLng = (v) => !Number.isNaN(v) && v >= -180 && v <= 180;
        
        // Calculate distances and sort clinics
        const clinicsWithDistance = clinics
          .map(clinic => {
            // Try multiple coordinate formats
            let lat = tryNum(clinic.latitude ?? clinic.lat);
            let lng = tryNum(clinic.longitude ?? clinic.lng);

            // Check nested 'location' object
            if ((Number.isNaN(lat) || Number.isNaN(lng)) && clinic.location) {
              lat = tryNum(clinic.location.lat ?? clinic.location.latitude ?? clinic.location._lat);
              lng = tryNum(clinic.location.lng ?? clinic.location.longitude ?? clinic.location._long);
            }

            // Check 'coords' array [lat, lng]
            if ((Number.isNaN(lat) || Number.isNaN(lng)) && Array.isArray(clinic.coords)) {
              lat = tryNum(clinic.coords[0]);
              lng = tryNum(clinic.coords[1]);
            }

            // Check 'coordinates' field
            if ((Number.isNaN(lat) || Number.isNaN(lng)) && clinic.coordinates) {
              if (Array.isArray(clinic.coordinates)) {
                lat = tryNum(clinic.coordinates[0]);
                lng = tryNum(clinic.coordinates[1]);
              } else {
                lat = tryNum(clinic.coordinates.latitude ?? clinic.coordinates.lat ?? clinic.coordinates._lat);
                lng = tryNum(clinic.coordinates.longitude ?? clinic.coordinates.lng ?? clinic.coordinates._long);
              }
            }

            // Detect and fix swapped lat/lng values
            if (!inLat(lat) && inLat(lng) && inLng(lat)) {
              const tmp = lat;
              lat = lng;
              lng = tmp;
            }

            // Validate coordinates
            if (!inLat(lat) || !inLng(lng)) {
              return null;
            }
            
            // Calculate distance using Haversine formula
            const R = 6371; // Earth's radius in km
            const dLat = (lat - userLat) * Math.PI / 180;
            const dLng = (lng - userLng) * Math.PI / 180;
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            
            return { 
              ...clinic, 
              distance,
              parsedLat: lat,
              parsedLng: lng
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.distance - b.distance);
        
        // Comprehensive debug logging
        console.log('=== FIND NEAREST CLINIC DEBUG ===');
        console.log('Your location:', { lat: userLat, lng: userLng });
        console.log('Total clinics in database:', clinics.length);
        console.log('Clinics with valid coordinates:', clinicsWithDistance.length);
        
        if (clinicsWithDistance.length > 0) {
          console.log('Top 5 nearest clinics:', clinicsWithDistance.slice(0, 5).map(c => ({
            name: c.name || c.clinicName,
            distance: c.distance.toFixed(2) + ' km',
            location: { lat: c.parsedLat, lng: c.parsedLng },
            address: c.address
          })));
          
          const nearest = clinicsWithDistance[0];
          
          setSelectedClinicId(nearest.id);
          setSearchQuery(''); // Clear search to show all markers
          setToast({ 
            type: 'success', 
            message: `Nearest: ${nearest.name || nearest.clinicName} - ${nearest.distance.toFixed(1)} km away` 
          });
        } else {
          console.error('No clinics with valid coordinates found!');
          console.log('Sample clinic data:', clinics.slice(0, 2));
          setToast({ type: 'error', message: 'No clinics with valid locations found. Please try again.' });
        }
        
        setFindingNearest(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
        }
        
        setToast({ type: 'error', message: errorMessage });
        setFindingNearest(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async (clinic, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (!currentUser?.uid) {
      alert('Please log in to bookmark clinics');
      return;
    }

    const clinicId = clinic.id;
    const isBookmarked = bookmarkedClinicIds.has(clinicId);

    // Optimistic UI update
    setBookmarkLoading(prev => ({ ...prev, [clinicId]: true }));

    try {
      if (isBookmarked) {
        await removeBookmark(currentUser.uid, clinicId);
      } else {
        await addBookmark(currentUser.uid, clinicId, {
          clinicName: clinic.name || clinic.clinicName,
          address: clinic.address
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setToast({ 
        type: 'error', 
        message: `Failed to ${isBookmarked ? 'remove' : 'add'} bookmark. Please try again.` 
      });
    } finally {
      setBookmarkLoading(prev => ({ ...prev, [clinicId]: false }));
    }
  };

  // Filter clinics for dropdown suggestions
  const filteredClinicsForDropdown = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return clinics
      .filter(c => {
        const name = (c.name || c.clinicName || '').toLowerCase();
        const address = (c.address || '').toLowerCase();
        const services = Array.isArray(c.services) 
          ? c.services.join(' ').toLowerCase() 
          : '';
        return name.includes(query) || address.includes(query) || services.includes(query);
      })
      .slice(0, 5); // Limit to 5 suggestions
  }, [clinics, searchQuery]);

  // prepare markers (only those with numeric lat & lng)
  const clinicMarkers = useMemo(() => {
    const filtered = searchQuery.trim()
      ? clinics.filter(c => {
          const query = searchQuery.toLowerCase();
          const name = (c.name || c.clinicName || '').toLowerCase();
          const address = (c.address || '').toLowerCase();
          const services = Array.isArray(c.services) 
            ? c.services.join(' ').toLowerCase() 
            : '';
          return name.includes(query) || address.includes(query) || services.includes(query);
        })
      : clinics;

    return filtered
      .map((c) => {
        // try multiple locations shapes and coerce to numbers
        const tryNum = (v) => {
          if (v === undefined || v === null) return NaN;
          const n = typeof v === 'number' ? v : Number(v);
          return Number.isFinite(n) ? n : NaN;
        };

        let lat = tryNum(c.latitude ?? c.lat);
        let lng = tryNum(c.longitude ?? c.lng);

        // check nested 'location' object with either { lat, lng } or { latitude, longitude }
        if ((Number.isNaN(lat) || Number.isNaN(lng)) && c.location) {
          lat = tryNum(c.location.lat ?? c.location.latitude ?? c.location._lat);
          lng = tryNum(c.location.lng ?? c.location.longitude ?? c.location._long);
        }

        // check alternate 'coords' array [lat,lng]
        if ((Number.isNaN(lat) || Number.isNaN(lng)) && Array.isArray(c.coords)) {
          lat = tryNum(c.coords[0]);
          lng = tryNum(c.coords[1]);
        }

        // last resort: some local storage may have coordinates under 'coordinates'
        if ((Number.isNaN(lat) || Number.isNaN(lng)) && c.coordinates) {
          lat = tryNum(c.coordinates.latitude ?? c.coordinates.lat ?? c.coordinates[0]);
          lng = tryNum(c.coordinates.longitude ?? c.coordinates.lng ?? c.coordinates[1]);
        }

        // Detect swapped values: lat must be within -90..90, lng within -180..180
        const inLat = (v) => !Number.isNaN(v) && v >= -90 && v <= 90;
        const inLng = (v) => !Number.isNaN(v) && v >= -180 && v <= 180;

        if (!inLat(lat) && inLat(lng) && inLng(lat)) {
          // looks swapped, correct it
          const tmp = lat;
          lat = lng;
          lng = tmp;
        }

        if (!inLat(lat) || !inLng(lng)) {
          // invalid coordinates — skip this clinic
          return null;
        }

        return {
          id: c.id,
          name: c.name || c.clinicName || 'Clinic',
          address: c.address || '',
          services: c.services || [],
          phone: c.phone || c.contact || '',
          rating: c.rating ?? null,
          position: [lat, lng],
          raw: c
        };
      })
      .filter(Boolean);
  }, [clinics, searchQuery]);

  const bounds = useMemo(() => {
    if (!clinicMarkers || clinicMarkers.length === 0) return [];
    return clinicMarkers.map((m) => m.position);
  }, [clinicMarkers]);

  const makeIcon = (isSelected) =>
    L.divIcon({
      html: `<div class="clinic-marker ${isSelected ? 'selected' : ''}">🐾</div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

  const selectedPosition = clinicMarkers.find((m) => m.id === selectedClinicId)?.position || null;

  return (
    <div className={styles.pageRoot}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <TopBar username={displayName} />

        <main className={styles.content}>
          {/* Enhanced Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '24px 28px',
            marginBottom: '24px',
            color: 'white',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <MapPin size={24} color="white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 style={{ 
                    fontSize: '1.375rem', 
                    fontWeight: 700, 
                    margin: '0 0 4px 0',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    Find Veterinary Clinics
                  </h1>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.875rem', 
                    opacity: 0.95,
                    fontWeight: 500
                  }}>
                    Discover nearby clinics and book appointments
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstructions(true)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                How to Use Map
              </button>
            </div>
          </div>

          <section className={styles.mapCard}>
            {/* Search Bar and Find Button Container */}
            <div style={{
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              justifyContent: 'center'
            }}>
              {/* Search Bar */}
              <div style={{
                position: 'relative',
                flex: '1',
                maxWidth: '600px'
              }}>
                <Search 
                  size={22} 
                  style={{
                    position: 'absolute',
                    left: '18px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#667eea',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search clinics by name, location, or services..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setShowDropdown(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '16px 52px 16px 52px',
                    border: '2px solid #e0e7ff',
                    borderRadius: showDropdown && filteredClinicsForDropdown.length > 0 ? '14px 14px 0 0' : '14px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: 'white',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)',
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#c7d2fe';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e7ff';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.1)';
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowDropdown(false);
                      setSelectedClinicId(null);
                    }}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '32px',
                      height: '32px',
                      background: '#f1f5f9',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      fontSize: '1.125rem',
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#667eea';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.color = '#64748b';
                    }}
                  >
                    ✕
                  </button>
                )}

                {/* Dropdown Menu */}
                {showDropdown && filteredClinicsForDropdown.length > 0 && (
                  <div
                    ref={dropdownRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '2px solid #e0e7ff',
                      borderTop: 'none',
                      borderRadius: '0 0 14px 14px',
                      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)',
                      maxHeight: '320px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 #f1f5f9'
                    }}
                  >
                    {filteredClinicsForDropdown.map((clinic, index) => (
                      <div
                        key={clinic.id || index}
                        onClick={() => handleSelectClinic(clinic)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: index < filteredClinicsForDropdown.length - 1 ? '1px solid #f3f4f6' : 'none',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <MapPin size={20} color="white" strokeWidth={2.5} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '0.9375rem',
                              fontWeight: 700,
                              color: '#1e293b',
                              marginBottom: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {clinic.name || clinic.clinicName || 'Unnamed Clinic'}
                            </div>
                            {clinic.address && (
                              <div style={{
                                fontSize: '0.8125rem',
                                color: '#6b7280',
                                marginBottom: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                📍 {clinic.address}
                              </div>
                            )}
                            {clinic.services && clinic.services.length > 0 && (
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#9ca3af',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {Array.isArray(clinic.services) 
                                  ? clinic.services.slice(0, 3).join(', ') 
                                  : clinic.services}
                                {clinic.services.length > 3 && '...'}
                              </div>
                            )}
                          </div>
                          <ChevronRight size={20} color="#9ca3af" style={{ flexShrink: 0 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Find Nearest Clinic Button */}
              <button
                onClick={handleFindNearest}
                disabled={findingNearest}
                style={{
                  padding: '16px 24px',
                  background: findingNearest 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: findingNearest ? 'not-allowed' : 'pointer',
                  boxShadow: findingNearest 
                    ? '0 2px 8px rgba(0, 0, 0, 0.1)' 
                    : '0 4px 16px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  opacity: findingNearest ? 0.7 : 1,
                  whiteSpace: 'nowrap',
                  height: '56px',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  if (!findingNearest) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.45)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!findingNearest) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.35)';
                  }
                }}
              >
                <MapPin size={20} strokeWidth={2.5} />
                {findingNearest ? 'Locating...' : 'Find Nearest'}
              </button>
            </div>

            {/* Results Counter */}
            {searchQuery && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1e40af',
                  border: '2px solid #bfdbfe'
                }}>
                  <Search size={16} />
                  <span>Found {clinicMarkers.length} clinic{clinicMarkers.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}

            {/* Map Container */}
            <div style={{ 
              width: '100%', 
              height: 550, 
              borderRadius: 16, 
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              border: '3px solid #e0e7ff'
            }}>
              <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitBounds bounds={bounds} />
                <FlyToSelected position={selectedPosition} />

                {userLocation && (
                  <Marker
                    position={[userLocation.lat, userLocation.lng]}
                    icon={L.divIcon({ html: '<div class="user-marker"></div>', className: '', iconSize: [12, 12], iconAnchor: [6, 6] })}
                  />
                )}

                {clinicMarkers.map((m) => {
                  const isBookmarked = bookmarkedClinicIds.has(m.id);
                  const isLoading = bookmarkLoading[m.id];

                  return (
                    <Marker
                      key={m.id}
                      position={m.position}
                      icon={makeIcon(selectedClinicId === m.id)}
                      eventHandlers={{
                        click: () => {
                          setSelectedClinicId(m.id);
                        }
                      }}
                    >
                      <Popup 
                        onClose={() => setSelectedClinicId(null)} 
                        closeButton={false}
                        className="custom-popup"
                      >
                        <div style={{
                          minWidth: '280px',
                          background: 'white',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
                        }}>
                          {/* Header with gradient and bookmark */}
                          <div style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            padding: '16px',
                            color: 'white',
                            position: 'relative'
                          }}>
                            {/* Bookmark button in header */}
                            <button
                              onClick={(e) => handleBookmarkToggle(m.raw, e)}
                              disabled={isLoading}
                              style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                width: '36px',
                                height: '36px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                opacity: isLoading ? 0.5 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!isLoading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                              }}
                              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                            >
                              {isBookmarked ? (
                                <BookmarkCheck size={18} color="white" strokeWidth={2.5} />
                              ) : (
                                <Bookmark size={18} color="white" strokeWidth={2} />
                              )}
                            </button>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '4px',
                              paddingRight: '40px'
                            }}>
                              <MapPin size={18} />
                              <h3 style={{
                                margin: 0,
                                fontSize: '1.125rem',
                                fontWeight: '700'
                              }}>
                                {m.name}
                              </h3>
                            </div>
                            {m.rating !== null && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.875rem',
                                marginTop: '6px'
                              }}>
                                <Star size={14} fill="white" />
                                <span>{m.rating}</span>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div style={{ padding: '16px' }}>
                            {/* Address */}
                            {m.address && (
                              <div style={{
                                display: 'flex',
                                gap: '8px',
                                marginBottom: '12px',
                                fontSize: '0.875rem',
                                color: '#64748b'
                              }}>
                                <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#3b82f6' }} />
                                <span>{m.address}</span>
                              </div>
                            )}

                            {/* Phone */}
                            {(m.phone || m.raw?.contactNumber) && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '12px',
                                fontSize: '0.875rem',
                                color: '#64748b'
                              }}>
                                <Phone size={16} style={{ color: '#10b981' }} />
                                <span>{m.phone || m.raw?.contactNumber}</span>
                              </div>
                            )}

                            {/* Hours */}
                            {m.raw?.openHours && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '12px',
                                fontSize: '0.875rem',
                                color: '#64748b'
                              }}>
                                <Clock size={16} style={{ color: '#f59e0b' }} />
                                <span>{m.raw.openHours}</span>
                              </div>
                            )}

                            {/* Services */}
                            {m.services && m.services.length > 0 && (
                              <div style={{
                                marginTop: '12px',
                                paddingTop: '12px',
                                borderTop: '1px solid #e5e7eb'
                              }}>
                                <div style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  color: '#6b7280',
                                  marginBottom: '6px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  Services
                                </div>
                                <div style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '6px'
                                }}>
                                  {(Array.isArray(m.services) ? m.services.slice(0, 3) : [m.services]).map((service, idx) => (
                                    <span
                                      key={idx}
                                      style={{
                                        fontSize: '0.75rem',
                                        padding: '4px 10px',
                                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                        color: '#1e40af',
                                        borderRadius: '12px',
                                        fontWeight: '500'
                                      }}
                                    >
                                      {service}
                                    </span>
                                  ))}
                                  {Array.isArray(m.services) && m.services.length > 3 && (
                                    <span style={{
                                      fontSize: '0.75rem',
                                      padding: '4px 10px',
                                      color: '#6b7280'
                                    }}>
                                      +{m.services.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* View Clinic Button */}
                            <button
                              onClick={() => navigate(`/saved/${m.id}`)}
                              style={{
                                width: '100%',
                                marginTop: '16px',
                                padding: '12px 16px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.9375rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
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
                              View Clinic
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </section>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <>
          <style>
            {`
              .instructions-modal-content::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={() => setShowInstructions(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '16px',
                maxWidth: '600px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                animation: 'slideUp 0.3s ease-out'
              }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '24px 28px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>💡</span>
                </div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: 0,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  How to Use the Map
                </h2>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 600
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div 
              className="instructions-modal-content"
              style={{
                padding: '28px 32px 32px',
                maxHeight: '400px',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Instruction 1 */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.5rem'
                  }}>
                    🔍
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      margin: '0 0 8px 0'
                    }}>
                      Search for Clinics
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      Use the search bar to find clinics by name, location, or services offered. As you type, matching clinics will appear in the dropdown menu below the search field.
                    </p>
                  </div>
                </div>

                {/* Instruction 2 */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.5rem'
                  }}>
                    📍
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      margin: '0 0 8px 0'
                    }}>
                      Find Nearest Clinic
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      Click the "Find Nearest" button beside the search bar to automatically locate the veterinary clinic closest to your current location.
                    </p>
                  </div>
                </div>

                {/* Instruction 3 */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.5rem'
                  }}>
                    🗺️
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      margin: '0 0 8px 0'
                    }}>
                      Explore the Map
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      Click on any map marker to view clinic details including address, contact information, and services. Use the bookmark icon to save your favorite clinics.
                    </p>
                  </div>
                </div>

                {/* Instruction 4 */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.5rem'
                  }}>
                    🐾
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#1e293b',
                      margin: '0 0 8px 0'
                    }}>
                      View Clinic Details
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      Click the "View Clinic" button in the popup to see full details, operating hours, and available services. You can book appointments directly from the clinic page.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              borderTop: '1px solid #e5e7eb',
              padding: '16px 28px',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowInstructions(false)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
