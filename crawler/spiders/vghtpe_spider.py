# Spec: specs/hospital-clinic-map-search/spec.md — US-3
# Task: specs/hospital-clinic-map-search/tasks.md — Task 10

"""
Spider for 台北榮民總醫院 (Taipei Veterans General Hospital).
"""

from spiders.base_hospital import BaseHospitalSpider


class VGHTPESpider(BaseHospitalSpider):
    name = 'vghtpe'
    hospital_nhi_code = 'A0103'
    allowed_domains = ['www6.vghtpe.gov.tw', 'www.vghtpe.gov.tw']
    start_urls = ['https://www6.vghtpe.gov.tw/reg/QueryClinic.do']

    def parse(self, response):
        """Parse VGHTPE outpatient schedule."""
        tables = response.css('table.schedule, table.timetable, table#schedule')
        if not tables:
            tables = response.css('table')

        for table in tables:
            rows = table.css('tr')
            if len(rows) < 2:
                continue

            for row in rows[1:]:
                cells = row.css('td')
                if len(cells) < 3:
                    continue

                dept_text = cells[0].css('::text').get('').strip()
                doctor_text = cells[1].css('::text, a::text').get('').strip()

                if not doctor_text or doctor_text in ('-', '休'):
                    continue

                # Parse day and session from remaining cells
                for i, cell in enumerate(cells[2:], 1):
                    text = cell.css('::text').get('').strip()
                    if not text or text in ('-', '休', '　'):
                        continue

                    day = (i - 1) // 3 + 1
                    session_idx = (i - 1) % 3
                    sessions = ['morning', 'afternoon', 'evening']

                    if day > 7:
                        continue

                    yield self.make_schedule_item(
                        department_name=dept_text or '骨科',
                        doctor_name=doctor_text,
                        day_of_week=day,
                        session=sessions[session_idx],
                    )
