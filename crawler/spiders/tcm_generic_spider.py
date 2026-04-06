# Spec: specs/hospital-clinic-map-search/spec.md — US-3
# Task: specs/hospital-clinic-map-search/tasks.md — Task 10

"""
Generic TCM spider that can crawl any TCM clinic with standard HTML table schedules.
Used as a fallback for clinics without dedicated spiders.
"""

from spiders.base_tcm import BaseTCMSpider


class GenericTCMSpider(BaseTCMSpider):
    name = 'tcm_generic'
    hospital_nhi_code = None  # Set via -a nhi_code=xxx
    source_type = 'tcm'

    def __init__(self, nhi_code=None, url=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if nhi_code:
            self.hospital_nhi_code = nhi_code
        if url:
            self.start_urls = [url]

    def parse(self, response):
        """
        Generic TCM schedule parser.
        Tries multiple common HTML patterns used by TCM clinics.
        """
        # Pattern 1: Table with doctor/time headers
        for table in response.css('table'):
            rows = table.css('tr')
            if len(rows) < 2:
                continue

            # Check if this looks like a schedule table
            header_text = ' '.join(rows[0].css('::text').getall())
            if not any(keyword in header_text for keyword in ['一', '二', '三', '上午', '時間', '門診']):
                continue

            yield from self._parse_table_by_day(rows)

        # Pattern 2: List-based schedule (div or ul)
        schedule_divs = response.css('.schedule, .timetable, .clinic-time, #schedule')
        for div in schedule_divs:
            items = div.css('li, .item, p')
            for item in items:
                text = item.css('::text').get('').strip()
                yield from self._parse_text_schedule(text)

    def _parse_table_by_day(self, rows):
        """Parse table where columns represent days of week."""
        for row in rows[1:]:
            cells = row.css('td')
            if len(cells) < 2:
                continue

            session_text = cells[0].css('::text').get('').strip()
            session = self.parse_session(session_text) if session_text else 'morning'

            for day_idx, cell in enumerate(cells[1:], 1):
                if day_idx > 7:
                    break
                names = cell.css('::text, a::text').getall()
                names = [n.strip() for n in names if n.strip() and n.strip() not in ('-', '休', '　')]

                for name in names:
                    yield self.make_schedule_item(
                        department_name='中醫一般科',
                        doctor_name=name if len(name) >= 2 else None,
                        day_of_week=day_idx,
                        session=session,
                    )

    def _parse_text_schedule(self, text):
        """Parse free-text schedule line like '週一上午 王醫師 中醫傷科'."""
        if not text:
            return

        day = None
        session = 'morning'
        doctor = None
        dept = '中醫一般科'

        for key, val in self.DAY_MAP.items() if hasattr(self, 'DAY_MAP') else []:
            if key in text:
                day = val
                break

        # Use base class methods
        for key in ('上午', '下午', '晚上'):
            if key in text:
                session = self.parse_session(key)
                break

        # Try to find doctor name (2-3 Chinese characters followed by 醫師)
        import re
        doctor_match = re.search(r'([\u4e00-\u9fff]{2,3})醫師', text)
        if doctor_match:
            doctor = doctor_match.group(0)

        if day:
            yield self.make_schedule_item(
                department_name=dept,
                doctor_name=doctor,
                day_of_week=day,
                session=session,
            )
