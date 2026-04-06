// Spec: specs/hospital-clinic-map-search/spec.md
// Task: deploy health check endpoint

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const status: Record<string, string> = {
    app: 'ok',
    db: 'unknown',
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).$queryRawUnsafe('SELECT 1');
    status.db = 'ok';
  } catch {
    status.db = 'error';
  }

  const healthy = Object.values(status).every((s) => s === 'ok');

  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks: status, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
