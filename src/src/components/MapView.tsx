'use client';

// Spec: specs/hospital-clinic-map-search/spec.md — US-1
// Task: specs/hospital-clinic-map-search/tasks.md — Task 6

import { useEffect, useRef, useState, useCallback } from 'react';
import type { HospitalResult } from '../types/api';

// Default center: Taipei
const DEFAULT_CENTER = { lat: 25.033, lng: 121.565 };

interface MapViewProps {
  hospitals: HospitalResult[];
  radius: number;
  onLocationSelect: (lat: number, lng: number) => void;
  onHospitalClick: (hospital: HospitalResult) => void;
  selectedHospitalId?: string;
}

export default function MapView({
  hospitals,
  radius,
  onLocationSelect,
  onHospitalClick,
  selectedHospitalId,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  // Load Leaflet dynamically (SSR-safe)
  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default || leaflet);
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!L || !mapRef.current || mapInstanceRef.current) return;

    // Fix default icon issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map(mapRef.current).setView([center.lat, center.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    // Click to select location
    map.on('click', (e: L.LeafletMouseEvent) => {
      setCenter({ lat: e.latlng.lat, lng: e.latlng.lng });
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [L]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle geolocation
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter({ lat: latitude, lng: longitude });
        onLocationSelect(latitude, longitude);
        mapInstanceRef.current?.setView([latitude, longitude], 14);
      },
      (err) => console.warn('Geolocation error:', err)
    );
  }, [onLocationSelect]);

  // Update markers when hospitals change
  useEffect(() => {
    if (!L || !markersRef.current || !mapInstanceRef.current) return;

    markersRef.current.clearLayers();

    // Draw search radius circle
    if (circleRef.current) {
      circleRef.current.remove();
    }
    circleRef.current = L.circle([center.lat, center.lng], {
      radius,
      color: '#3b82f6',
      fillColor: '#3b82f680',
      fillOpacity: 0.1,
      weight: 2,
    }).addTo(mapInstanceRef.current);

    // Center marker
    L.circleMarker([center.lat, center.lng], {
      radius: 8,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 1,
    }).addTo(markersRef.current);

    // Hospital markers
    for (const hospital of hospitals) {
      const isSelected = hospital.id === selectedHospitalId;
      const marker = L.marker([hospital.location.lat, hospital.location.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background: ${isSelected ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">+</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      });

      marker.bindPopup(`
        <strong>${hospital.name}</strong><br/>
        距離：${hospital.distance_meters}m<br/>
        科別：${hospital.departments.map((d) => d.name).join('、')}
      `);

      marker.on('click', () => onHospitalClick(hospital));
      marker.addTo(markersRef.current!);
    }

    // Fit bounds if hospitals exist
    if (hospitals.length > 0) {
      const bounds = L.latLngBounds(
        hospitals.map((h) => [h.location.lat, h.location.lng] as [number, number])
      );
      bounds.extend([center.lat, center.lng]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [L, hospitals, center, radius, selectedHospitalId, onHospitalClick]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[500px] rounded-lg shadow-md" />
      <button
        onClick={handleGeolocate}
        className="absolute top-3 right-3 z-[1000] bg-white px-3 py-2 rounded-lg shadow-md hover:bg-gray-50 text-sm font-medium"
      >
        📍 我的位置
      </button>
    </div>
  );
}
