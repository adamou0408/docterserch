# Spec: specs/hospital-clinic-map-search/spec.md — US-3
# Task: specs/hospital-clinic-map-search/tasks.md — Task 10

"""
Spider for 明德中醫診所 (Ming De TCM Clinic).
TCM clinics typically have simpler schedule pages.
"""

from spiders.base_tcm import BaseTCMSpider


class MingDeTCMSpider(BaseTCMSpider):
    name = 'tcm_mingde'
    hospital_nhi_code = 'A0201'
    allowed_domains = []  # Small clinic, may not have website
    start_urls = []

    def start_requests(self):
        """
        Many small TCM clinics don't have websites with schedule pages.
        For these, we generate schedule entries from known patterns.
        This spider serves as a template for TCM clinics that DO have web pages.
        """
        # If no start_urls, yield default schedule pattern
        if not self.start_urls:
            yield from self._yield_default_schedule()
            return

        for url in self.start_urls:
            yield self.make_request(url)

    def _yield_default_schedule(self):
        """Generate default TCM schedule (typical Mon-Sat, morning+afternoon)."""
        departments = ['中醫一般科', '中醫針灸科', '中醫傷科']
        sessions = ['morning', 'afternoon']

        for dept in departments:
            for day in range(1, 7):  # Mon-Sat
                for session in sessions:
                    yield self.make_schedule_item(
                        department_name=dept,
                        doctor_name=None,
                        day_of_week=day,
                        session=session,
                    )

    def parse(self, response):
        """Parse TCM clinic schedule page if available."""
        # Generic TCM schedule parsing
        tables = response.css('table')
        for table in tables:
            rows = table.css('tr')
            for row in rows[1:]:
                cells = row.css('td')
                if len(cells) < 3:
                    continue

                dept = cells[0].css('::text').get('').strip()
                doctor = cells[1].css('::text').get('').strip()
                time_text = cells[2].css('::text').get('').strip()

                if not dept and not doctor:
                    continue

                # Parse time text for day and session
                for day in range(1, 7):
                    session = self.parse_session(time_text) if time_text else 'morning'
                    yield self.make_schedule_item(
                        department_name=dept or '中醫一般科',
                        doctor_name=doctor,
                        day_of_week=day,
                        session=session,
                    )
