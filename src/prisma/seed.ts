// Spec: specs/hospital-clinic-map-search/spec.md — US-1, US-2
// Task: specs/hospital-clinic-map-search/tasks.md — Task 3

import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

// Seed departments
const DEPARTMENTS = [
  { name: '骨科', category: 'western' as const },
  { name: '復健科', category: 'western' as const },
  { name: '神經科', category: 'western' as const },
  { name: '家醫科', category: 'western' as const },
  { name: '內科', category: 'western' as const },
  { name: '外科', category: 'western' as const },
  { name: '小兒科', category: 'western' as const },
  { name: '婦產科', category: 'western' as const },
  { name: '中醫一般科', category: 'tcm' as const },
  { name: '中醫針灸科', category: 'tcm' as const },
  { name: '中醫傷科', category: 'tcm' as const },
];

// Sample hospitals in Taipei (for MVP seed data)
const SAMPLE_HOSPITALS = [
  {
    nhiCode: 'A0101',
    name: '台大醫院',
    address: '台北市中正區中山南路7號',
    phone: '02-23123456',
    latitude: 25.0408,
    longitude: 121.5225,
    type: 'hospital' as const,
    websiteUrl: 'https://www.ntuh.gov.tw',
    registrationUrl: 'https://reg.ntuh.gov.tw',
    departments: ['骨科', '復健科', '神經科', '內科', '外科'],
  },
  {
    nhiCode: 'A0102',
    name: '馬偕紀念醫院',
    address: '台北市中山區中山北路二段92號',
    phone: '02-25433535',
    latitude: 25.0586,
    longitude: 121.5235,
    type: 'hospital' as const,
    websiteUrl: 'https://www.mmh.org.tw',
    registrationUrl: 'https://www.mmh.org.tw/reg',
    departments: ['骨科', '復健科', '家醫科', '內科'],
  },
  {
    nhiCode: 'A0103',
    name: '台北榮民總醫院',
    address: '台北市北投區石牌路二段201號',
    phone: '02-28712121',
    latitude: 25.1212,
    longitude: 121.5173,
    type: 'hospital' as const,
    websiteUrl: 'https://www.vghtpe.gov.tw',
    registrationUrl: 'https://www6.vghtpe.gov.tw/reg',
    departments: ['骨科', '復健科', '神經科', '內科', '外科', '小兒科'],
  },
  {
    nhiCode: 'A0104',
    name: '台北長庚紀念醫院',
    address: '台北市松山區敦化北路199號',
    phone: '02-27135211',
    latitude: 25.0560,
    longitude: 121.5506,
    type: 'hospital' as const,
    websiteUrl: 'https://www.cgmh.org.tw',
    registrationUrl: 'https://www.cgmh.org.tw/reg',
    departments: ['骨科', '復健科', '神經科', '家醫科'],
  },
  {
    nhiCode: 'A0105',
    name: '國泰綜合醫院',
    address: '台北市大安區仁愛路四段280號',
    phone: '02-27082121',
    latitude: 25.0375,
    longitude: 121.5491,
    type: 'hospital' as const,
    websiteUrl: 'https://www.cgh.org.tw',
    registrationUrl: 'https://www.cgh.org.tw/reg',
    departments: ['骨科', '復健科', '內科', '婦產科'],
  },
  {
    nhiCode: 'A0201',
    name: '明德中醫診所',
    address: '台北市大安區信義路三段100號',
    phone: '02-27001234',
    latitude: 25.0335,
    longitude: 121.5352,
    type: 'tcm' as const,
    departments: ['中醫一般科', '中醫針灸科', '中醫傷科'],
  },
  {
    nhiCode: 'A0202',
    name: '仁心中醫診所',
    address: '台北市中山區南京東路二段50號',
    phone: '02-25005678',
    latitude: 25.0521,
    longitude: 121.5318,
    type: 'tcm' as const,
    departments: ['中醫一般科', '中醫傷科'],
  },
  {
    nhiCode: 'A0301',
    name: '信義骨科診所',
    address: '台北市信義區松德路300號',
    phone: '02-27201111',
    latitude: 25.0310,
    longitude: 121.5710,
    type: 'clinic' as const,
    departments: ['骨科', '復健科'],
  },
];

async function main() {
  console.log('Seeding database...');

  // Upsert departments
  const deptMap = new Map<string, string>();
  for (const dept of DEPARTMENTS) {
    const created = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: { name: dept.name, category: dept.category },
    });
    deptMap.set(dept.name, created.id);
  }
  console.log(`Seeded ${DEPARTMENTS.length} departments`);

  // Upsert hospitals
  for (const h of SAMPLE_HOSPITALS) {
    const hospital = await prisma.hospital.upsert({
      where: { nhiCode: h.nhiCode },
      update: {
        name: h.name,
        address: h.address,
        phone: h.phone,
        latitude: h.latitude,
        longitude: h.longitude,
        type: h.type,
        websiteUrl: h.websiteUrl || null,
        registrationUrl: h.registrationUrl || null,
        dataSource: 'nhi_only',
      },
      create: {
        nhiCode: h.nhiCode,
        name: h.name,
        address: h.address,
        phone: h.phone,
        latitude: h.latitude,
        longitude: h.longitude,
        type: h.type,
        websiteUrl: h.websiteUrl || null,
        registrationUrl: h.registrationUrl || null,
        dataSource: 'nhi_only',
      },
    });

    // Link departments
    for (const deptName of h.departments) {
      const deptId = deptMap.get(deptName);
      if (deptId) {
        await prisma.hospitalDepartment.upsert({
          where: {
            hospitalId_departmentId: {
              hospitalId: hospital.id,
              departmentId: deptId,
            },
          },
          update: {},
          create: {
            hospitalId: hospital.id,
            departmentId: deptId,
          },
        });
      }
    }
  }
  console.log(`Seeded ${SAMPLE_HOSPITALS.length} hospitals`);

  // Log the seed as a crawl
  await prisma.crawlLog.create({
    data: {
      source: 'nhi',
      status: 'success',
      recordsUpdated: SAMPLE_HOSPITALS.length,
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
