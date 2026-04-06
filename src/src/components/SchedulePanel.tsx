'use client';

// Spec: specs/hospital-clinic-map-search/spec.md — US-3
// Task: specs/hospital-clinic-map-search/tasks.md — Task 11

import { useEffect, useState } from 'react';
import type { HospitalScheduleResponse } from '../types/api';

const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-red-100 text-red-800 border-red-300',
};

interface SchedulePanelProps {
  hospitalId: string;
  hospitalName: string;
  registrationUrl: string | null;
  onClose: () => void;
}

export default function SchedulePanel({
  hospitalId,
  hospitalName,
  registrationUrl,
  onClose,
}: SchedulePanelProps) {
  const [schedule, setSchedule] = useState<HospitalScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/hospitals/${hospitalId}/schedules`)
      .then((res) => res.json())
      .then((data) => setSchedule(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hospitalId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        載入門診資訊中...
      </div>
    );
  }

  if (!schedule || !schedule.schedules) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{hospitalName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-gray-500">暫無門診資料</p>
      </div>
    );
  }

  const confidenceColor = CONFIDENCE_COLORS[schedule.confidence.level];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">{hospitalName}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>

      {/* Confidence indicator */}
      <div className={`p-3 rounded-lg border mb-4 ${confidenceColor}`}>
        <p className="text-sm font-medium">{schedule.confidence.label}</p>
        <p className="text-xs mt-1">{schedule.confidence.description}</p>
      </div>

      {/* Schedule table */}
      <div className="space-y-4">
        {schedule.schedules.map((day) => (
          <div key={day.date}>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {day.date}（{['', '一', '二', '三', '四', '五', '六', '日'][day.day_of_week]}）
            </h3>
            <div className="space-y-1">
              {day.sessions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium w-12">{s.session_label}</span>
                    <span className="text-blue-600">{s.department.name}</span>
                    {s.doctor && <span className="text-gray-600">{s.doctor.name}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {s.is_available !== null && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          s.is_available
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {s.is_available ? '可掛號' : '已額滿'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Registration link */}
      {registrationUrl && (
        <a
          href={registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-4 text-center bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
        >
          前往掛號
        </a>
      )}
    </div>
  );
}
