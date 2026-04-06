# Spec: specs/hospital-clinic-map-search/spec.md — US-3
# Task: specs/hospital-clinic-map-search/tasks.md — Task 10

"""
Base spider class for hospital schedule crawlers.
Each hospital spider extends this and implements parse_schedule().
"""

import scrapy
from items import ScheduleItem

# Session time slot mapping
SESSION_MAP = {
    '上午': 'morning', '早上': 'morning', '上': 'morning',
    '下午': 'afternoon', '午': 'afternoon',
    '晚上': 'evening', '夜間': 'evening', '晚': 'evening',
}

# Day of week mapping
DAY_MAP = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7,
    '週一': 1, '週二': 2, '週三': 3, '週四': 4, '週五': 5, '週六': 6, '週日': 7,
    '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4, '星期五': 5, '星期六': 6, '星期日': 7,
    'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7,
}


class BaseHospitalSpider(scrapy.Spider):
    """Base class for hospital schedule spiders."""

    # Subclass must set these
    hospital_nhi_code = None
    hospital_id = None  # Set by pipeline if needed
    source_type = 'hospital_website'
    department_category = 'western'

    custom_settings = {
        'ITEM_PIPELINES': {
            'pipelines.schedule_pipeline.SchedulePipeline': 300,
        },
    }

    def make_schedule_item(self, department_name: str, doctor_name: str,
                           day_of_week: int, session: str,
                           is_available=None) -> ScheduleItem:
        """Helper to create a ScheduleItem."""
        item = ScheduleItem()
        item['hospital_nhi_code'] = self.hospital_nhi_code
        item['department_name'] = department_name
        item['department_category'] = self.department_category
        item['doctor_name'] = doctor_name
        item['day_of_week'] = day_of_week
        item['session'] = session
        item['is_available'] = is_available
        return item

    @staticmethod
    def parse_session(text: str) -> str:
        """Parse session text to standard session value."""
        text = text.strip()
        # Check longer keys first to avoid partial matches
        for key in sorted(SESSION_MAP.keys(), key=len, reverse=True):
            if key in text:
                return SESSION_MAP[key]
        return 'morning'  # default

    @staticmethod
    def parse_day(text: str) -> int:
        """Parse day text to day_of_week int (1=Mon, 7=Sun)."""
        text = text.strip()
        for key, val in DAY_MAP.items():
            if key in text:
                return val
        return 1  # default
