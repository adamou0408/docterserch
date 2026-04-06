# Spec: specs/hospital-clinic-map-search/spec.md — US-3
# Task: specs/hospital-clinic-map-search/tasks.md — Task 10

"""
Spider for 馬偕紀念醫院 (Mackay Memorial Hospital).
"""

from spiders.base_hospital import BaseHospitalSpider


class MMHSpider(BaseHospitalSpider):
    name = 'mmh'
    hospital_nhi_code = 'A0102'
    allowed_domains = ['www.mmh.org.tw']
    start_urls = ['https://www.mmh.org.tw/timetable.php']

    def parse(self, response):
        """Parse MMH schedule page — table-based layout."""
        # MMH typically uses department-grouped tables
        dept_sections = response.css('div.dept-section, div.schedule-dept, section')

        if not dept_sections:
            # Fallback: parse all tables
            yield from self._parse_generic_table(response)
            return

        for section in dept_sections:
            dept_name = section.css('h3::text, h4::text, .dept-title::text').get('').strip()
            if not dept_name:
                continue

            table = section.css('table')
            if not table:
                continue

            yield from self._parse_schedule_table(table, dept_name)

    def _parse_generic_table(self, response):
        """Fallback: parse any table that looks like a schedule."""
        for table in response.css('table'):
            rows = table.css('tr')
            if len(rows) < 2:
                continue
            yield from self._parse_schedule_table(table, '骨科')

    def _parse_schedule_table(self, table, dept_name):
        """Parse a single schedule table."""
        rows = table.css('tr')
        for row in rows[1:]:
            cells = row.css('td')
            if len(cells) < 2:
                continue

            session_text = cells[0].css('::text').get('').strip()
            session = self.parse_session(session_text) if session_text else 'morning'

            for day in range(1, min(len(cells), 8)):
                cell = cells[day] if day < len(cells) else None
                if not cell:
                    continue

                doctor_name = cell.css('::text, a::text').get('').strip()
                if not doctor_name or doctor_name in ('-', '休', '　'):
                    continue

                yield self.make_schedule_item(
                    department_name=dept_name,
                    doctor_name=doctor_name,
                    day_of_week=day,
                    session=session,
                )
