# Spec: specs/hospital-clinic-map-search/spec.md — US-3, US-5
# Task: specs/hospital-clinic-map-search/tasks.md — Task 9

"""
Scrapy pipeline that writes schedule items to the database.
Also handles crawl_log tracking per spider run.
"""

import logging
from utils.db import (
    get_db_connection, start_crawl_log, complete_crawl_log,
    upsert_department, upsert_doctor, upsert_schedule, link_hospital_department
)

logger = logging.getLogger(__name__)


class SchedulePipeline:
    def __init__(self):
        self.conn = None
        self.log_id = None
        self.records_count = 0
        self.hospital_cache = {}  # nhi_code -> hospital_id

    def open_spider(self, spider):
        self.conn = get_db_connection()
        hospital_id = getattr(spider, 'hospital_id', None)
        source = getattr(spider, 'source_type', 'hospital_website')
        self.log_id = start_crawl_log(self.conn, source=source, hospital_id=hospital_id)
        self.records_count = 0
        logger.info(f"Pipeline opened for spider '{spider.name}', crawl_log: {self.log_id}")

    def close_spider(self, spider):
        if self.conn and self.log_id:
            status = 'success' if self.records_count > 0 else 'partial'
            complete_crawl_log(self.conn, self.log_id, status, self.records_count)
            logger.info(
                f"Pipeline closed for spider '{spider.name}': "
                f"{self.records_count} records, status={status}"
            )
            self.conn.close()

    def _get_hospital_id(self, nhi_code: str) -> str:
        """Lookup hospital ID by NHI code, with cache."""
        if nhi_code in self.hospital_cache:
            return self.hospital_cache[nhi_code]

        with self.conn.cursor() as cur:
            cur.execute("SELECT id FROM hospitals WHERE nhi_code = %s", (nhi_code,))
            row = cur.fetchone()
            if row:
                self.hospital_cache[nhi_code] = row['id']
                return row['id']
        raise ValueError(f"Hospital not found for NHI code: {nhi_code}")

    def process_item(self, item, spider):
        try:
            nhi_code = item['hospital_nhi_code']
            hospital_id = self._get_hospital_id(nhi_code)

            # Upsert department
            dept_id = upsert_department(
                self.conn,
                item['department_name'],
                item['department_category']
            )
            link_hospital_department(self.conn, hospital_id, dept_id)

            # Upsert doctor (if provided)
            doctor_id = None
            if item.get('doctor_name'):
                doctor_id = upsert_doctor(
                    self.conn, item['doctor_name'], hospital_id, dept_id
                )

            # Upsert schedule
            upsert_schedule(
                self.conn,
                hospital_id=hospital_id,
                department_id=dept_id,
                day_of_week=item['day_of_week'],
                session=item['session'],
                doctor_id=doctor_id,
                is_available=item.get('is_available'),
            )

            # Update hospital data_source to 'crawled'
            with self.conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE hospitals SET data_source = 'crawled', updated_at = NOW()
                    WHERE id = %s AND data_source != 'api'
                    """,
                    (hospital_id,)
                )
                self.conn.commit()

            self.records_count += 1

        except Exception as e:
            logger.error(f"Failed to process item: {e}")
            spider.logger.error(f"Pipeline error: {e}")

        return item
