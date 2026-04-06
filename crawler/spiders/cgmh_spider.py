# Spec: specs/hospital-clinic-map-search/spec.md — US-3
# Task: specs/hospital-clinic-map-search/tasks.md — Task 10

"""
Spider for 台北長庚紀念醫院 (Chang Gung Memorial Hospital - Taipei).
"""

from spiders.base_hospital import BaseHospitalSpider


class CGMHSpider(BaseHospitalSpider):
    name = 'cgmh'
    hospital_nhi_code = 'A0104'
    allowed_domains = ['www.cgmh.org.tw', 'register.cgmh.org.tw']
    start_urls = ['https://register.cgmh.org.tw/Department/Schedule']

    def parse(self, response):
        """Parse CGMH schedule page."""
        # CGMH often uses JSON API or JavaScript-rendered content
        # Try table parsing first
        tables = response.css('table.schedule, table')

        for table in tables:
            rows = table.css('tr')
            if len(rows) < 2:
                continue

            headers = rows[0].css('th::text, td::text').getall()
            headers = [h.strip() for h in headers if h.strip()]

            for row in rows[1:]:
                cells = row.css('td')
                if len(cells) < 2:
                    continue

                # First cell: session (上午/下午/晚上)
                session_text = cells[0].css('::text').get('').strip()
                session = self.parse_session(session_text)

                # Remaining cells: each represents a day, containing doctor names
                for day_idx, cell in enumerate(cells[1:], 1):
                    doctors = cell.css('a::text, span::text, ::text').getall()
                    doctors = [d.strip() for d in doctors if d.strip() and d.strip() not in ('-', '休', '　')]

                    for doctor_name in doctors:
                        if len(doctor_name) < 2:
                            continue

                        yield self.make_schedule_item(
                            department_name='骨科',
                            doctor_name=doctor_name,
                            day_of_week=day_idx if day_idx <= 7 else 1,
                            session=session,
                        )
