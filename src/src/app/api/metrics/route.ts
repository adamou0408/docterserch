// Spec: specs/hospital-clinic-map-search/spec.md — US-5
// Task: /monitor — Prometheus metrics endpoint

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Collect application metrics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = prisma as any;

    const [hospitalCount, deptCount, scheduleCount, doctorCount, crawlLogs] = await Promise.all([
      p.hospital.count(),
      p.department.count(),
      p.schedule.count(),
      p.doctor.count(),
      p.crawlLog.findMany({
        where: { completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 50,
      }),
    ]);

    // Calculate crawl stats
    const successCrawls = crawlLogs.filter((l: { status: string }) => l.status === 'success').length;
    const failedCrawls = crawlLogs.filter((l: { status: string }) => l.status === 'failed').length;
    const hospitalsWithSchedules = await p.hospital.count({ where: { schedules: { some: {} } } });
    const coverageRate = hospitalCount > 0 ? hospitalsWithSchedules / hospitalCount : 0;

    // DB health check
    let dbHealthy = 1;
    try {
      await p.$queryRawUnsafe('SELECT 1');
    } catch {
      dbHealthy = 0;
    }

    // Output Prometheus text format
    const metrics = [
      '# HELP docterserch_up Application health status',
      '# TYPE docterserch_up gauge',
      `docterserch_up 1`,
      '',
      '# HELP docterserch_db_up Database connection health',
      '# TYPE docterserch_db_up gauge',
      `docterserch_db_up ${dbHealthy}`,
      '',
      '# HELP docterserch_hospitals_total Total number of hospitals in database',
      '# TYPE docterserch_hospitals_total gauge',
      `docterserch_hospitals_total ${hospitalCount}`,
      '',
      '# HELP docterserch_departments_total Total number of departments',
      '# TYPE docterserch_departments_total gauge',
      `docterserch_departments_total ${deptCount}`,
      '',
      '# HELP docterserch_schedules_total Total schedule entries',
      '# TYPE docterserch_schedules_total gauge',
      `docterserch_schedules_total ${scheduleCount}`,
      '',
      '# HELP docterserch_doctors_total Total doctors in database',
      '# TYPE docterserch_doctors_total gauge',
      `docterserch_doctors_total ${doctorCount}`,
      '',
      '# HELP docterserch_data_coverage_ratio Hospital data coverage (0-1)',
      '# TYPE docterserch_data_coverage_ratio gauge',
      `docterserch_data_coverage_ratio ${coverageRate.toFixed(4)}`,
      '',
      '# HELP docterserch_crawl_success_total Recent successful crawls',
      '# TYPE docterserch_crawl_success_total gauge',
      `docterserch_crawl_success_total ${successCrawls}`,
      '',
      '# HELP docterserch_crawl_failed_total Recent failed crawls',
      '# TYPE docterserch_crawl_failed_total gauge',
      `docterserch_crawl_failed_total ${failedCrawls}`,
      '',
    ].join('\n');

    return new NextResponse(metrics, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    // Even if metrics collection fails, report app as degraded
    const fallback = [
      '# HELP docterserch_up Application health status',
      '# TYPE docterserch_up gauge',
      'docterserch_up 0',
      `# Error: ${error instanceof Error ? error.message : 'unknown'}`,
    ].join('\n');

    return new NextResponse(fallback, {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
