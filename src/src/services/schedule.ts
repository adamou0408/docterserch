// Spec: specs/hospital-clinic-map-search/spec.md — US-3
// Task: specs/hospital-clinic-map-search/tasks.md — Task 11

import { prisma } from '../lib/prisma';
import { HospitalScheduleResponse, ConfidenceInfo, DaySchedule } from '../types/api';

const SESSION_LABELS: Record<string, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
};

function getConfidence(dataSource: string, lastUpdated: Date): ConfidenceInfo {
  const hoursAgo = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

  if (dataSource === 'api') {
    return { level: 'high', label: '即時資料', description: '此門診資料來自醫院 API，資訊即時可靠' };
  }
  if (dataSource === 'crawled') {
    const label = hoursAgo < 24
      ? `資料更新於 ${Math.round(hoursAgo)} 小時前`
      : `資料更新於 ${Math.round(hoursAgo / 24)} 天前`;
    return {
      level: hoursAgo < 48 ? 'medium' : 'low',
      label,
      description: '此門診資料來自網站爬取，可能與實際情況有出入',
    };
  }
  return {
    level: 'low',
    label: '僅有基本資訊',
    description: '僅有健保署基本資料，建議電話確認門診時間',
  };
}

export async function getHospitalSchedules(
  hospitalId: string,
  departmentId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<HospitalScheduleResponse | null> {
  const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
  if (!hospital) return null;

  const now = new Date();
  const from = dateFrom ? new Date(dateFrom) : now;
  const to = dateTo ? new Date(dateTo) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  void from; // reserved for future date range filtering
  void to;   // reserved for future date range filtering

  const schedules = await prisma.schedule.findMany({
    where: {
      hospitalId,
      ...(departmentId ? { departmentId } : {}),
    },
    include: {
      doctor: true,
      department: true,
    },
    orderBy: [{ dayOfWeek: 'asc' }, { session: 'asc' }],
  });

  // Group by day
  const dayMap = new Map<number, DaySchedule>();

  for (const s of schedules) {
    const dayKey = s.dayOfWeek;
    if (!dayMap.has(dayKey)) {
      // Calculate actual date for this day of week
      const daysUntil = ((dayKey - (now.getDay() || 7)) + 7) % 7;
      const date = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);
      dayMap.set(dayKey, {
        date: date.toISOString().split('T')[0],
        day_of_week: dayKey,
        sessions: [],
      });
    }

    dayMap.get(dayKey)!.sessions.push({
      session: s.session,
      session_label: SESSION_LABELS[s.session] || s.session,
      department: { id: s.department.id, name: s.department.name, category: s.department.category },
      doctor: s.doctor ? { id: s.doctor.id, name: s.doctor.name } : null,
      is_available: s.isAvailable,
      registration_url: hospital.registrationUrl,
    });
  }

  return {
    hospital_id: hospital.id,
    hospital_name: hospital.name,
    data_source: hospital.dataSource,
    last_updated_at: hospital.updatedAt.toISOString(),
    confidence: getConfidence(hospital.dataSource, hospital.updatedAt),
    schedules: Array.from(dayMap.values()).sort((a, b) => a.day_of_week - b.day_of_week),
  };
}
