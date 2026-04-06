'use client';

// Spec: specs/hospital-clinic-map-search/spec.md — US-1, US-2, US-3, US-4
// Task: specs/hospital-clinic-map-search/tasks.md — Task 6, 7

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import FilterBar from '../components/FilterBar';
import ClinicListPanel from '../components/ClinicListPanel';
import SchedulePanel from '../components/SchedulePanel';
import type { HospitalResult } from '../types/api';

// Load MapView dynamically to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('../components/MapView'), { ssr: false });

export default function Home() {
  const [hospitals, setHospitals] = useState<HospitalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<HospitalResult | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(3000);
  const [departments, setDepartments] = useState<string[]>([]);

  const searchHospitals = useCallback(
    async (lat: number, lng: number, depts: string[], rad: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          lat: lat.toString(),
          lng: lng.toString(),
          radius: rad.toString(),
        });
        if (depts.length > 0) {
          params.set('departments', depts.join(','));
        }

        const res = await fetch(`/api/hospitals/search?${params}`);
        const data = await res.json();
        setHospitals(data.results || []);
      } catch (error) {
        console.error('Search failed:', error);
        setHospitals([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      setLocation({ lat, lng });
      setSelectedHospital(null);
      searchHospitals(lat, lng, departments, radius);
    },
    [departments, radius, searchHospitals]
  );

  const handleFilterChange = useCallback(
    (depts: string[], rad: number) => {
      setDepartments(depts);
      setRadius(rad);
      if (location) {
        searchHospitals(location.lat, location.lng, depts, rad);
      }
    },
    [location, searchHospitals]
  );

  const handleHospitalClick = useCallback((hospital: HospitalResult) => {
    setSelectedHospital(hospital);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">醫院門診搜尋</h1>
          <p className="text-sm text-gray-500 mt-1">
            在地圖上選擇位置，搜尋周邊醫院的門診時間與掛號資訊
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter bar */}
        <div className="mb-4">
          <FilterBar onFilterChange={handleFilterChange} radius={radius} />
        </div>

        {/* Map + Results layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map */}
          <div className="lg:col-span-2">
            <MapView
              hospitals={hospitals}
              radius={radius}
              onLocationSelect={handleLocationSelect}
              onHospitalClick={handleHospitalClick}
              selectedHospitalId={selectedHospital?.id}
            />
          </div>

          {/* Right panel: Results or Schedule */}
          <div className="space-y-4">
            {selectedHospital ? (
              <SchedulePanel
                hospitalId={selectedHospital.id}
                hospitalName={selectedHospital.name}
                registrationUrl={selectedHospital.registration_url}
                onClose={() => setSelectedHospital(null)}
              />
            ) : (
              <ClinicListPanel
                hospitals={hospitals}
                selectedHospitalId={undefined}
                onHospitalClick={handleHospitalClick}
                loading={loading}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
