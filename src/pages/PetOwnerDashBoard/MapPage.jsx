import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TopBar from '../../components/layout/TopBar';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/MapPage.module.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

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

  // prepare markers (only those with numeric lat & lng)
  const clinicMarkers = useMemo(() => {
    return clinics
      .map((c) => {
        const lat = (typeof c.latitude === 'number') ? c.latitude : (c.location?.lat ?? c.location?.latitude);
        const lng = (typeof c.longitude === 'number') ? c.longitude : (c.location?.lng ?? c.location?.longitude);
        if (typeof lat !== 'number' || typeof lng !== 'number') return null;
        return {
          id: c.id,
          name: c.name || c.clinicName || 'Clinic',
          address: c.address || '',
          services: c.services || [],
          contact: c.contact || c.phone || '',
          rating: c.rating ?? null,
          position: [lat, lng],
          raw: c
        };
      })
      .filter(Boolean);
  }, [clinics]);

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
            <div style={{ marginBottom: 12 }}>
              {loading ? (
                <div style={{ padding: 12, background: 'white', borderRadius: 8 }}>Loading clinics...</div>
              ) : error ? (
                <div style={{ padding: 12, background: 'white', borderRadius: 8, color: '#b91c1c' }}>Failed to load clinics.</div>
              ) : clinicMarkers.length === 0 ? (
                <div style={{ padding: 12, background: 'white', borderRadius: 8 }}>No clinics available yet.</div>
              ) : null}
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

                {clinicMarkers.map((m) => (
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
                    <Popup onClose={() => setSelectedClinicId(null)} closeButton>
                      <div style={{ minWidth: 220 }}>
                        <h3 style={{ margin: '0 0 6px 0' }}>{m.name}</h3>
                        <div style={{ color: '#4b5563', fontSize: 13 }}>{m.address}</div>
                        {m.contact && <div style={{ marginTop: 6, fontSize: 13 }}>📞 {m.contact}</div>}
                        {m.services && m.services.length > 0 && (
                          <div style={{ marginTop: 8, fontSize: 13 }}>
                            <strong>Services:</strong> {Array.isArray(m.services) ? m.services.slice(0,3).join(', ') : String(m.services)}
                            {Array.isArray(m.services) && m.services.length > 3 ? '...' : ''}
                          </div>
                        )}
                        {m.rating !== null && <div style={{ marginTop: 6, fontSize: 13 }}>⭐ {m.rating}</div>}
                        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => navigate(`/clinic/${m.id}`)}
                            className="px-3 py-1 rounded bg-indigo-600 text-white"
                          >
                            View Clinic
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
