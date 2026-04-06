# Spec: specs/hospital-clinic-map-search/spec.md — US-3
# Task: specs/hospital-clinic-map-search/tasks.md — Task 10

"""
Base spider for TCM (中醫) clinic crawlers.
Separated from western hospital spiders (as per decision).
"""

from spiders.base_hospital import BaseHospitalSpider


class BaseTCMSpider(BaseHospitalSpider):
    """Base class for TCM clinic schedule spiders."""
    source_type = 'tcm'
    department_category = 'tcm'
