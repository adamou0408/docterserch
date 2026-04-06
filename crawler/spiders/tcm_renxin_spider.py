# Spec: specs/hospital-clinic-map-search/spec.md — US-3
# Task: specs/hospital-clinic-map-search/tasks.md — Task 10

"""
Spider for 仁心中醫診所 (Ren Xin TCM Clinic).
"""

from spiders.base_tcm import BaseTCMSpider


class RenXinTCMSpider(BaseTCMSpider):
    name = 'tcm_renxin'
    hospital_nhi_code = 'A0202'
    allowed_domains = []
    start_urls = []

    def start_requests(self):
        if not self.start_urls:
            yield from self._yield_default_schedule()
            return
        for url in self.start_urls:
            yield self.make_request(url)

    def _yield_default_schedule(self):
        """Ren Xin TCM: Mon-Fri morning+afternoon, Sat morning only."""
        departments = ['中醫一般科', '中醫傷科']

        for dept in departments:
            for day in range(1, 6):  # Mon-Fri
                for session in ['morning', 'afternoon']:
                    yield self.make_schedule_item(
                        department_name=dept,
                        doctor_name=None,
                        day_of_week=day,
                        session=session,
                    )
            # Saturday morning only
            yield self.make_schedule_item(
                department_name=dept,
                doctor_name=None,
                day_of_week=6,
                session='morning',
            )

    def parse(self, response):
        """Parse Ren Xin TCM schedule if web page available."""
        pass
