# Spec: specs/hospital-clinic-map-search/spec.md — US-3
# Task: specs/hospital-clinic-map-search/tasks.md — Task 10

"""
Spider for 國泰綜合醫院 (Cathay General Hospital).
"""

from spiders.base_hospital import BaseHospitalSpider


class CGHSpider(BaseHospitalSpider):
    name = 'cgh'
    hospital_nhi_code = 'A0105'
    allowed_domains = ['www.cgh.org.tw']
    start_urls = ['https://www.cgh.org.tw/ec99/rwd1320/allphp/regtime.php']

    def parse(self, response):
        """Parse CGH schedule page — standard table format."""
        tables = response.css('table')

        for table in tables:
            rows = table.css('tr')
            if len(rows) < 2:
                continue

            for row in rows[1:]:
                cells = row.css('td')
                if len(cells) < 4:
                    continue

                # Typical CGH layout: Dept | Doctor | Day | Session
                dept = cells[0].css('::text').get('').strip()
                doctor = cells[1].css('::text, a::text').get('').strip()

                if not doctor or doctor in ('-', '休'):
                    continue

                day_text = cells[2].css('::text').get('').strip() if len(cells) > 2 else ''
                session_text = cells[3].css('::text').get('').strip() if len(cells) > 3 else ''

                day = self.parse_day(day_text) if day_text else 1
                session = self.parse_session(session_text) if session_text else 'morning'

                yield self.make_schedule_item(
                    department_name=dept or '骨科',
                    doctor_name=doctor,
                    day_of_week=day,
                    session=session,
                )
