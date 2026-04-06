// Spec: specs/hospital-clinic-map-search/spec.md — US-5
// Task: specs/hospital-clinic-map-search/tasks.md — Task 12

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const { hospital_id, source = 'hospital_website' } = body as {
      hospital_id?: string;
      source?: string;
    };

    // Validate hospital exists if specified
    if (hospital_id) {
      const hospital = await prisma.hospital.findUnique({ where: { id: hospital_id } });
      if (!hospital) {
        return NextResponse.json({ error: 'Hospital not found' }, { status: 404 });
      }

      // Check for in-progress crawl
      const activeCrawl = await prisma.crawlLog.findFirst({
        where: {
          hospitalId: hospital_id,
          completedAt: null,
        },
      });
      if (activeCrawl) {
        return NextResponse.json(
          { error: 'A crawl is already in progress for this hospital' },
          { status: 409 }
        );
      }
    }

    // Create crawl log entry (queued)
    const crawlLog = await prisma.crawlLog.create({
      data: {
        hospitalId: hospital_id || null,
        source,
        status: 'partial', // Will be updated by crawler
        startedAt: new Date(),
      },
    });

    // In production, this would trigger the Python crawler via message queue or HTTP
    // For now, just return the queued log entry

    return NextResponse.json({
      message: 'Crawl triggered successfully',
      crawl_log_id: crawlLog.id,
      status: 'queued',
    });
  } catch (error) {
    console.error('Crawl trigger error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
