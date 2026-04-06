// Spec: specs/hospital-clinic-map-search/spec.md — US-2
// Task: specs/hospital-clinic-map-search/tasks.md — Task 5

import { prisma } from '../lib/prisma';
import { DepartmentsResponse } from '../types/api';

const CATEGORY_LABELS: Record<string, string> = {
  western: '西醫',
  tcm: '中醫',
};

export async function getDepartments(category?: string): Promise<DepartmentsResponse> {
  const where = category ? { category: category as 'western' | 'tcm' } : {};

  const departments = await prisma.department.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  const grouped = new Map<string, { id: string; name: string; category: string }[]>();

  for (const dept of departments) {
    const list = grouped.get(dept.category) || [];
    list.push({ id: dept.id, name: dept.name, category: dept.category });
    grouped.set(dept.category, list);
  }

  return {
    departments: Array.from(grouped.entries()).map(([cat, items]) => ({
      category: cat,
      category_label: CATEGORY_LABELS[cat] || cat,
      items,
    })),
  };
}
