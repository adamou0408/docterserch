// Spec: specs/hospital-clinic-map-search/spec.md — US-1
// Task: specs/hospital-clinic-map-search/tasks.md — Task 4

export interface ValidationError {
  field: string;
  message: string;
}

export function validateSearchParams(params: URLSearchParams): {
  valid: boolean;
  errors: ValidationError[];
  parsed: {
    lat: number;
    lng: number;
    radius: number;
    departments: string[];
    sort: 'distance' | 'next_available';
    limit: number;
    offset: number;
  } | null;
} {
  const errors: ValidationError[] = [];

  const latStr = params.get('lat');
  const lngStr = params.get('lng');

  if (!latStr) errors.push({ field: 'lat', message: 'lat is required' });
  if (!lngStr) errors.push({ field: 'lng', message: 'lng is required' });

  const lat = parseFloat(latStr || '');
  const lng = parseFloat(lngStr || '');

  if (latStr && (isNaN(lat) || lat < 21.5 || lat > 25.5)) {
    errors.push({ field: 'lat', message: 'lat must be between 21.5 and 25.5 (Taiwan)' });
  }
  if (lngStr && (isNaN(lng) || lng < 119.0 || lng > 122.5)) {
    errors.push({ field: 'lng', message: 'lng must be between 119.0 and 122.5 (Taiwan)' });
  }

  const radiusStr = params.get('radius');
  const radius = radiusStr ? parseInt(radiusStr) : 3000;
  if (radiusStr && (isNaN(radius) || radius < 100 || radius > 50000)) {
    errors.push({ field: 'radius', message: 'radius must be between 100 and 50000 meters' });
  }

  const deptStr = params.get('departments');
  const departments = deptStr ? deptStr.split(',').filter(Boolean) : [];

  const sortStr = params.get('sort') || 'distance';
  if (!['distance', 'next_available'].includes(sortStr)) {
    errors.push({ field: 'sort', message: 'sort must be "distance" or "next_available"' });
  }

  const limitStr = params.get('limit');
  const limit = limitStr ? parseInt(limitStr) : 50;
  if (limitStr && (isNaN(limit) || limit < 1 || limit > 200)) {
    errors.push({ field: 'limit', message: 'limit must be between 1 and 200' });
  }

  const offsetStr = params.get('offset');
  const offset = offsetStr ? parseInt(offsetStr) : 0;
  if (offsetStr && (isNaN(offset) || offset < 0)) {
    errors.push({ field: 'offset', message: 'offset must be >= 0' });
  }

  if (errors.length > 0) {
    return { valid: false, errors, parsed: null };
  }

  return {
    valid: true,
    errors: [],
    parsed: {
      lat,
      lng,
      radius,
      departments,
      sort: sortStr as 'distance' | 'next_available',
      limit,
      offset,
    },
  };
}
