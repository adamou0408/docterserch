'use client';

// Spec: specs/hospital-clinic-map-search/spec.md — US-4
// Task: specs/hospital-clinic-map-search/tasks.md — Task 7

import type { HospitalResult } from '../types/api';

const DATA_SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  api: { label: '即時', color: 'bg-green-100 text-green-800' },
  crawled: { label: '爬取', color: 'bg-yellow-100 text-yellow-800' },
  nhi_only: { label: '基本', color: 'bg-gray-100 text-gray-600' },
};

interface ClinicListPanelProps {
  hospitals: HospitalResult[];
  selectedHospitalId?: string;
  onHospitalClick: (hospital: HospitalResult) => void;
  loading: boolean;
}

export default function ClinicListPanel({
  hospitals,
  selectedHospitalId,
  onHospitalClick,
  loading,
}: ClinicListPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        搜尋中...
      </div>
    );
  }

  if (hospitals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        請在地圖上選擇一個位置，或調整搜尋條件
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md divide-y max-h-[500px] overflow-y-auto">
      <div className="p-3 bg-gray-50 sticky top-0">
        <span className="text-sm text-gray-600">找到 {hospitals.length} 間醫療院所</span>
      </div>
      {hospitals.map((hospital) => {
        const source = DATA_SOURCE_LABELS[hospital.data_source] || DATA_SOURCE_LABELS.nhi_only;
        const isSelected = hospital.id === selectedHospitalId;

        return (
          <button
            key={hospital.id}
            onClick={() => onHospitalClick(hospital)}
            className={`w-full text-left p-4 hover:bg-blue-50 transition ${
              isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{hospital.address}</p>
                {hospital.phone && (
                  <p className="text-sm text-gray-500">{hospital.phone}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {hospital.departments.map((dept) => (
                    <span
                      key={dept.id}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                    >
                      {dept.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right ml-3 shrink-0">
                <span className="text-sm font-medium text-gray-700">
                  {hospital.distance_meters < 1000
                    ? `${hospital.distance_meters}m`
                    : `${(hospital.distance_meters / 1000).toFixed(1)}km`}
                </span>
                <div className="mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs ${source.color}`}>
                    {source.label}
                  </span>
                </div>
              </div>
            </div>
            {hospital.registration_url && (
              <a
                href={hospital.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-block mt-2 text-sm text-blue-600 hover:underline"
              >
                前往掛號 →
              </a>
            )}
          </button>
        );
      })}
    </div>
  );
}
