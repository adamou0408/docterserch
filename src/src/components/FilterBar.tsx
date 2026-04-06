'use client';

// Spec: specs/hospital-clinic-map-search/spec.md — US-2
// Task: specs/hospital-clinic-map-search/tasks.md — Task 7

import { useState, useEffect } from 'react';
import type { DepartmentGroup } from '../types/api';

const RADIUS_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 3000, label: '3 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
];

interface FilterBarProps {
  onFilterChange: (departments: string[], radius: number) => void;
  radius: number;
}

export default function FilterBar({ onFilterChange, radius }: FilterBarProps) {
  const [departmentGroups, setDepartmentGroups] = useState<DepartmentGroup[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());
  const [selectedRadius, setSelectedRadius] = useState(radius);

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => setDepartmentGroups(data.departments || []))
      .catch(console.error);
  }, []);

  const toggleDepartment = (deptId: string) => {
    const next = new Set(selectedDepts);
    if (next.has(deptId)) {
      next.delete(deptId);
    } else {
      next.add(deptId);
    }
    setSelectedDepts(next);
    onFilterChange(Array.from(next), selectedRadius);
  };

  const handleRadiusChange = (value: number) => {
    setSelectedRadius(value);
    onFilterChange(Array.from(selectedDepts), value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
      {/* Radius selector */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">搜尋範圍</h3>
        <div className="flex gap-2">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleRadiusChange(opt.value)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedRadius === opt.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Department filter */}
      {departmentGroups.map((group) => (
        <div key={group.category}>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{group.category_label}</h3>
          <div className="flex flex-wrap gap-2">
            {group.items.map((dept) => (
              <button
                key={dept.id}
                onClick={() => toggleDepartment(dept.id)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedDepts.has(dept.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
