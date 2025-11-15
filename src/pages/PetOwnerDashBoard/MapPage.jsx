import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Phone, Clock, Star, ChevronRight, Search, Bookmark, BookmarkCheck } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
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
        // show friendly alert
        try { alert('Failed to load clinics. Please try again later.'); } catch {}
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
      alert(`Failed to ${isBookmarked ? 'remove' : 'add'} bookmark. Please try again.`);
    } finally {
      setBookmarkLoading(prev => ({ ...prev, [clinicId]: false }));
    }
  };

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
          <header className={styles.headerRow}>
            <h2 className={styles.title}>Map</h2>
            <div className={styles.subtitle}>Nearby Clinics</div>
          </header>

          <section className={styles.mapCard}>
            {/* Search Bar */}
            <div style={{
              marginBottom: '16px',
              position: 'relative'
            }}>
              <div style={{
                position: 'relative',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                <Search 
                  size={20} 
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}
                />
                <input
                  type="text"
                  placeholder="Search clinics by name, location, or services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 48px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '6px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                      borderRadius: '6px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.color = '#1f2937';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              {searchQuery && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '8px',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  Found {clinicMarkers.length} clinic{clinicMarkers.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div style={{ width: '100%', height: 500, borderRadius: 12, overflow: 'hidden' }}>
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
    </div>
  );
}
