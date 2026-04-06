# Spec: specs/hospital-clinic-map-search/spec.md — US-3
# Task: specs/hospital-clinic-map-search/tasks.md — Task 10

"""
Spider for 台大醫院 (National Taiwan University Hospital).
Crawls the outpatient schedule page.
"""

from spiders.base_hospital import BaseHospitalSpider


class NTUHSpider(BaseHospitalSpider):
    name = 'ntuh'
    hospital_nhi_code = 'A0101'
    allowed_domains = ['reg.ntuh.gov.tw', 'www.ntuh.gov.tw']
    start_urls = ['https://reg.ntuh.gov.tw/webadminNew/ClinicQueryByDept.aspx']

    def parse(self, response):
        """
        Parse NTUH outpatient schedule page.
        NTUH uses a table-based layout:
        - Rows = doctors
        - Columns = day/session combinations
        """
        # Look for schedule tables
        tables = response.css('table.schedule, table#ContentPlaceHolder1_gvClinic, table.timetable')

        if not tables:
            # Fallback: try generic table parsing
            tables = response.css('table')

        for table in tables:
            rows = table.css('tr')
            if len(rows) < 2:
                continue

            # Try to extract headers (day of week)
            headers = rows[0].css('th::text, td::text').getall()
            headers = [h.strip() for h in headers if h.strip()]

            for row in rows[1:]:
                cells = row.css('td')
                if not cells:
                    continue

                # First cell usually contains doctor name
                doctor_name = cells[0].css('::text').get('').strip()
                if not doctor_name or len(doctor_name) < 2:
                    continue

                # Parse each cell as a schedule slot
                for i, cell in enumerate(cells[1:], 1):
                    text = cell.css('::text').get('').strip()
                    if not text or text in ('-', '　', '休'):
                        continue

                    # Determine day and session from column position
                    # Typical layout: Mon-AM, Mon-PM, Tue-AM, Tue-PM, ...
                    day_index = (i - 1) // 3 + 1  # 1-based day
                    session_index = (i - 1) % 3    # 0=morning, 1=afternoon, 2=evening
                    sessions = ['morning', 'afternoon', 'evening']

                    if day_index > 7:
                        continue

                    dept_name = text if text not in ('V', 'O', '○', '●') else '骨科'

                    yield self.make_schedule_item(
                        department_name='骨科',
                        doctor_name=doctor_name,
                        day_of_week=day_index,
                        session=sessions[session_index] if session_index < 3 else 'morning',
                    )
