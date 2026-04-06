// Spec: specs/hospital-clinic-map-search/spec.md — Security requirements
// Task: specs/hospital-clinic-map-search/tasks.md — Task 8

import { NextRequest, NextResponse } from 'next/server';

export function authenticateAdmin(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken || token !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null; // authenticated
}
