// Spec: specs/hospital-clinic-map-search/spec.md — US-2
// Task: specs/hospital-clinic-map-search/tasks.md — Task 5

import { NextRequest, NextResponse } from 'next/server';
import { getDepartments } from '../../../services/department';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || undefined;

  if (category && !['western', 'tcm'].includes(category)) {
    return NextResponse.json(
      { error: 'category must be "western" or "tcm"' },
      { status: 400 }
    );
  }

  try {
    const result = await getDepartments(category);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Departments fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
