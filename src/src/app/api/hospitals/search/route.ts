// Spec: specs/hospital-clinic-map-search/spec.md — US-1, US-2
// Task: specs/hospital-clinic-map-search/tasks.md — Task 4

import { NextRequest, NextResponse } from 'next/server';
import { validateSearchParams } from '../../../../lib/validation';
import { searchHospitals } from '../../../../services/hospital';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const validation = validateSearchParams(searchParams);

  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 }
    );
  }

  const { lat, lng, radius, departments, sort, limit, offset } = validation.parsed!;

  try {
    const result = await searchHospitals({ lat, lng, radius, departments, sort, limit, offset });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Hospital search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
