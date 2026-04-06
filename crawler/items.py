# Spec: specs/hospital-clinic-map-search/spec.md — US-3
# Task: specs/hospital-clinic-map-search/tasks.md — Task 10

"""Scrapy items for schedule crawling."""

import scrapy


class ScheduleItem(scrapy.Item):
    """A single schedule entry (one doctor, one time slot)."""
    hospital_nhi_code = scrapy.Field()  # NHI code to match hospital
    department_name = scrapy.Field()    # e.g., '骨科'
    department_category = scrapy.Field()  # 'western' or 'tcm'
    doctor_name = scrapy.Field()        # e.g., '王醫師'
    day_of_week = scrapy.Field()        # 1=Monday, 7=Sunday
    session = scrapy.Field()            # 'morning', 'afternoon', 'evening'
    is_available = scrapy.Field()       # True/False/None
