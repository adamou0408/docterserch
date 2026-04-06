// Spec: specs/hospital-clinic-map-search/spec.md — US-5
// Task: specs/hospital-clinic-map-search/tasks.md — Task 8, 12

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  const authError = authenticateAdmin(request);
  if (authError) return authError;

  try {
    const [totalHospitals, hospitalsWithSchedules, lastNhiLog, lastCrawlLog, recentLogs] =
      await Promise.all([
        prisma.hospital.count(),
        prisma.hospital.count({
          where: { schedules: { some: {} } },
        }),
        prisma.crawlLog.findFirst({
          where: { source: 'nhi' },
          orderBy: { completedAt: 'desc' },
        }),
        prisma.crawlLog.findFirst({
          where: { source: { not: 'nhi' } },
          orderBy: { completedAt: 'desc' },
        }),
        prisma.crawlLog.findMany({
          take: 20,
          orderBy: { startedAt: 'desc' },
          include: { hospital: { select: { name: true } } },
        }),
      ]);

    return NextResponse.json({
      summary: {
        total_hospitals: totalHospitals,
        hospitals_with_schedules: hospitalsWithSchedules,
        coverage_rate: totalHospitals > 0 ? hospitalsWithSchedules / totalHospitals : 0,
        last_nhi_import: lastNhiLog?.completedAt?.toISOString() ?? null,
        last_crawl_run: lastCrawlLog?.completedAt?.toISOString() ?? null,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recent_crawl_logs: recentLogs.map((log: any) => ({
        id: log.id,
        hospital_name: log.hospital?.name ?? null,
        source: log.source,
        status: log.status,
        records_updated: log.recordsUpdated,
        error_message: log.errorMessage,
        completed_at: log.completedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error('Crawl status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
