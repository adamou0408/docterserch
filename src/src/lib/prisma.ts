// Spec: specs/hospital-clinic-map-search/spec.md
// Task: specs/hospital-clinic-map-search/tasks.md — Task 2

import { PrismaClient } from '../generated/prisma/client';

/* eslint-disable @typescript-eslint/no-explicit-any */
const globalForPrisma = globalThis as unknown as { prisma: any };

// Prisma 7 uses prisma.config.ts for datasource configuration
export const prisma = globalForPrisma.prisma || new (PrismaClient as any)();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
