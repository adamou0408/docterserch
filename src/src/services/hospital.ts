// Spec: specs/hospital-clinic-map-search/spec.md — US-1, US-2, US-4
// Task: specs/hospital-clinic-map-search/tasks.md — Task 4

import { prisma } from '../lib/prisma';
import { HospitalResult } from '../types/api';

interface SearchOptions {
  lat: number;
  lng: number;
  radius: number;         // meters
  departments: string[];  // department IDs
  sort: 'distance' | 'next_available';
  limit: number;
  offset: number;
}

export async function searchHospitals(options: SearchOptions): Promise<{
  total: number;
  results: HospitalResult[];
}> {
  const { lat, lng, radius, departments, limit, offset } = options;
  void options.sort; // reserved for next_available sort implementation

  // Build WHERE clause for department filter
  let departmentFilter = '';
  // Haversine: params are $1=lat, $2=lng, $3=radius(meters)
  const queryParams: (number | string)[] = [lat, lng, radius];

  if (departments.length > 0) {
    const placeholders = departments.map((_, i) => `$${i + 4}`).join(', ');
    departmentFilter = `AND h.id IN (
      SELECT hd.hospital_id FROM hospital_departments hd
      WHERE hd.department_id IN (${placeholders})
    )`;
    queryParams.push(...departments);
  }

  // Parameterize LIMIT and OFFSET
  const limitParamIndex = queryParams.length + 1;
  const offsetParamIndex = queryParams.length + 2;
  const searchQueryParams = [...queryParams, limit, offset];

  // Haversine distance formula (pure SQL, no PostGIS required)
  // Returns distance in meters between two lat/lng points
  const haversineExpr = `
    (6371000 * acos(
      cos(radians($1)) * cos(radians(h.latitude)) *
      cos(radians(h.longitude) - radians($2)) +
      sin(radians($1)) * sin(radians(h.latitude))
    ))
  `;

  const countQuery = `
    SELECT COUNT(*)::int as total
    FROM hospitals h
    WHERE ${haversineExpr} <= $3
    ${departmentFilter}
  `;

  const searchQuery = `
    SELECT
      h.id,
      h.name,
      h.address,
      h.phone,
      h.latitude,
      h.longitude,
      h.type,
      h.website_url,
      h.registration_url,
      h.data_source,
      h.updated_at,
      ${haversineExpr}::int as distance_meters
    FROM hospitals h
    WHERE ${haversineExpr} <= $3
    ${departmentFilter}
    ORDER BY distance_meters ASC
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;

  type CountRow = { total: number };
  type HospitalRow = {
    id: string;
    name: string;
    address: string;
    phone: string | null;
    latitude: number;
    longitude: number;
    type: string;
    website_url: string | null;
    registration_url: string | null;
    data_source: string;
    updated_at: Date;
    distance_meters: number;
  };

  const [countResult, hospitalRows] = await Promise.all([
    prisma.$queryRawUnsafe(countQuery, ...queryParams) as Promise<CountRow[]>,
    prisma.$queryRawUnsafe(searchQuery, ...searchQueryParams) as Promise<HospitalRow[]>,
  ]);

  const total = countResult[0]?.total ?? 0;

  // Fetch departments for each hospital
  const hospitalIds = hospitalRows.map((h) => h.id);
  const hospitalDepts = hospitalIds.length > 0
    ? await prisma.hospitalDepartment.findMany({
        where: { hospitalId: { in: hospitalIds } },
        include: { department: true },
      })
    : [];

  const deptsByHospital = new Map<string, { id: string; name: string; category: string }[]>();
  for (const hd of hospitalDepts) {
    const list = deptsByHospital.get(hd.hospitalId) || [];
    list.push({
      id: hd.department.id,
      name: hd.department.name,
      category: hd.department.category,
    });
    deptsByHospital.set(hd.hospitalId, list);
  }

  const results: HospitalResult[] = hospitalRows.map((h) => ({
    id: h.id,
    name: h.name,
    address: h.address,
    phone: h.phone,
    distance_meters: h.distance_meters,
    location: { lat: h.latitude, lng: h.longitude },
    type: h.type,
    website_url: h.website_url,
    registration_url: h.registration_url,
    data_source: h.data_source,
    departments: deptsByHospital.get(h.id) || [],
    next_available_session: null, // Phase 2
    last_updated_at: h.updated_at.toISOString(),
  }));

  return { total, results };
}
