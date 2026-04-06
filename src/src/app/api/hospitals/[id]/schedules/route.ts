// Spec: specs/hospital-clinic-map-search/spec.md — US-3
// Task: specs/hospital-clinic-map-search/tasks.md — Task 11

import { NextRequest, NextResponse } from 'next/server';
import { getHospitalSchedules } from '../../../../../services/schedule';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { searchParams } = new URL(request.url);

  const departmentId = searchParams.get('department_id') || undefined;
  const dateFrom = searchParams.get('date_from') || undefined;
  const dateTo = searchParams.get('date_to') || undefined;

  // Validate date format if provided
  if (dateFrom && isNaN(Date.parse(dateFrom))) {
    return NextResponse.json(
      { error: 'Invalid date_from format. Use YYYY-MM-DD' },
      { status: 400 }
    );
  }
  if (dateTo && isNaN(Date.parse(dateTo))) {
    return NextResponse.json(
      { error: 'Invalid date_to format. Use YYYY-MM-DD' },
      { status: 400 }
    );
  }

  try {
    const result = await getHospitalSchedules(id, departmentId, dateFrom, dateTo);

    if (!result) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Schedule fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
