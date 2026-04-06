// Spec: specs/hospital-clinic-map-search/spec.md — US-1, US-2
// Task: specs/hospital-clinic-map-search/tasks.md — Task 3
// Standalone seed script using psycopg2 (no Prisma dependency issues)

const { Client } = require('pg');

const DEPARTMENTS = [
  { name: '骨科', category: 'western' },
  { name: '復健科', category: 'western' },
  { name: '神經科', category: 'western' },
  { name: '家醫科', category: 'western' },
  { name: '內科', category: 'western' },
  { name: '外科', category: 'western' },
  { name: '小兒科', category: 'western' },
  { name: '婦產科', category: 'western' },
  { name: '中醫一般科', category: 'tcm' },
  { name: '中醫針灸科', category: 'tcm' },
  { name: '中醫傷科', category: 'tcm' },
];

const HOSPITALS = [
  { nhiCode: 'A0101', name: '台大醫院', address: '台北市中正區中山南路7號', phone: '02-23123456', lat: 25.0408, lng: 121.5225, type: 'hospital', websiteUrl: 'https://www.ntuh.gov.tw', registrationUrl: 'https://reg.ntuh.gov.tw', departments: ['骨科', '復健科', '神經科', '內科', '外科'] },
  { nhiCode: 'A0102', name: '馬偕紀念醫院', address: '台北市中山區中山北路二段92號', phone: '02-25433535', lat: 25.0586, lng: 121.5235, type: 'hospital', websiteUrl: 'https://www.mmh.org.tw', registrationUrl: 'https://www.mmh.org.tw/reg', departments: ['骨科', '復健科', '家醫科', '內科'] },
  { nhiCode: 'A0103', name: '台北榮民總醫院', address: '台北市北投區石牌路二段201號', phone: '02-28712121', lat: 25.1212, lng: 121.5173, type: 'hospital', websiteUrl: 'https://www.vghtpe.gov.tw', registrationUrl: 'https://www6.vghtpe.gov.tw/reg', departments: ['骨科', '復健科', '神經科', '內科', '外科', '小兒科'] },
  { nhiCode: 'A0104', name: '台北長庚紀念醫院', address: '台北市松山區敦化北路199號', phone: '02-27135211', lat: 25.0560, lng: 121.5506, type: 'hospital', websiteUrl: 'https://www.cgmh.org.tw', registrationUrl: 'https://www.cgmh.org.tw/reg', departments: ['骨科', '復健科', '神經科', '家醫科'] },
  { nhiCode: 'A0105', name: '國泰綜合醫院', address: '台北市大安區仁愛路四段280號', phone: '02-27082121', lat: 25.0375, lng: 121.5491, type: 'hospital', websiteUrl: 'https://www.cgh.org.tw', registrationUrl: 'https://www.cgh.org.tw/reg', departments: ['骨科', '復健科', '內科', '婦產科'] },
  { nhiCode: 'A0201', name: '明德中醫診所', address: '台北市大安區信義路三段100號', phone: '02-27001234', lat: 25.0335, lng: 121.5352, type: 'tcm', departments: ['中醫一般科', '中醫針灸科', '中醫傷科'] },
  { nhiCode: 'A0202', name: '仁心中醫診所', address: '台北市中山區南京東路二段50號', phone: '02-25005678', lat: 25.0521, lng: 121.5318, type: 'tcm', departments: ['中醫一般科', '中醫傷科'] },
  { nhiCode: 'A0301', name: '信義骨科診所', address: '台北市信義區松德路300號', phone: '02-27201111', lat: 25.0310, lng: 121.5710, type: 'clinic', departments: ['骨科', '復健科'] },
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to database');

  // Seed departments
  const deptMap = {};
  for (const dept of DEPARTMENTS) {
    const res = await client.query(
      `INSERT INTO departments (id, name, category) VALUES (gen_random_uuid(), $1, $2)
       ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category RETURNING id`,
      [dept.name, dept.category]
    );
    deptMap[dept.name] = res.rows[0].id;
  }
  console.log(`Seeded ${DEPARTMENTS.length} departments`);

  // Seed hospitals
  for (const h of HOSPITALS) {
    const res = await client.query(
      `INSERT INTO hospitals (id, nhi_code, name, address, phone, latitude, longitude, type, website_url, registration_url, data_source, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, 'nhi_only', NOW(), NOW())
       ON CONFLICT (nhi_code) DO UPDATE SET name=EXCLUDED.name, updated_at=NOW() RETURNING id`,
      [h.nhiCode, h.name, h.address, h.phone, h.lat, h.lng, h.type, h.websiteUrl || null, h.registrationUrl || null]
    );
    const hospitalId = res.rows[0].id;

    for (const deptName of h.departments) {
      const deptId = deptMap[deptName];
      if (deptId) {
        await client.query(
          `INSERT INTO hospital_departments (hospital_id, department_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [hospitalId, deptId]
        );
      }
    }
  }
  console.log(`Seeded ${HOSPITALS.length} hospitals`);

  // Log seed as crawl
  await client.query(
    `INSERT INTO crawl_logs (id, source, status, records_updated, started_at, completed_at)
     VALUES (gen_random_uuid(), 'nhi', 'success', $1, NOW(), NOW())`,
    [HOSPITALS.length]
  );

  console.log('Seed complete!');
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
