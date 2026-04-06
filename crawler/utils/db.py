# Spec: specs/hospital-clinic-map-search/spec.md — US-5
# Task: specs/hospital-clinic-map-search/tasks.md — Task 9

"""
Database connection utility for the crawler.
Reads DATABASE_URL from environment and provides connection helpers.
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from typing import Optional


def get_db_connection():
    """Get a PostgreSQL connection using DATABASE_URL env var."""
    database_url = os.environ.get(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/docterserch'
    )
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)


def start_crawl_log(conn, source: str, hospital_id: Optional[str] = None) -> str:
    """Create a crawl_log entry and return its ID."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO crawl_logs (id, hospital_id, source, status, started_at)
            VALUES (gen_random_uuid(), %s, %s, 'partial', %s)
            RETURNING id
            """,
            (hospital_id, source, datetime.utcnow())
        )
        log_id = cur.fetchone()['id']
        conn.commit()
        return log_id


def complete_crawl_log(conn, log_id: str, status: str, records_updated: int,
                       error_message: Optional[str] = None):
    """Update crawl_log with final status."""
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE crawl_logs
            SET status = %s, records_updated = %s, error_message = %s, completed_at = %s
            WHERE id = %s
            """,
            (status, records_updated, error_message, datetime.utcnow(), log_id)
        )
        conn.commit()


def upsert_hospital(conn, nhi_code: str, name: str, address: str,
                    phone: Optional[str], latitude: float, longitude: float,
                    hospital_type: str, website_url: Optional[str] = None,
                    registration_url: Optional[str] = None,
                    data_source: str = 'nhi_only') -> str:
    """Upsert a hospital record and return its ID."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO hospitals (id, nhi_code, name, address, phone, latitude, longitude,
                                   type, website_url, registration_url, data_source,
                                   created_at, updated_at)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (nhi_code)
            DO UPDATE SET
                name = EXCLUDED.name,
                address = EXCLUDED.address,
                phone = EXCLUDED.phone,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                type = EXCLUDED.type,
                website_url = COALESCE(EXCLUDED.website_url, hospitals.website_url),
                registration_url = COALESCE(EXCLUDED.registration_url, hospitals.registration_url),
                data_source = CASE
                    WHEN EXCLUDED.data_source = 'api' THEN 'api'
                    WHEN EXCLUDED.data_source = 'crawled' AND hospitals.data_source != 'api' THEN 'crawled'
                    ELSE hospitals.data_source
                END,
                updated_at = NOW()
            RETURNING id
            """,
            (nhi_code, name, address, phone, latitude, longitude,
             hospital_type, website_url, registration_url, data_source)
        )
        hospital_id = cur.fetchone()['id']
        conn.commit()
        return hospital_id


def upsert_department(conn, name: str, category: str) -> str:
    """Upsert a department and return its ID."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO departments (id, name, category)
            VALUES (gen_random_uuid(), %s, %s)
            ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category
            RETURNING id
            """,
            (name, category)
        )
        dept_id = cur.fetchone()['id']
        conn.commit()
        return dept_id


def link_hospital_department(conn, hospital_id: str, department_id: str):
    """Link hospital to department (many-to-many)."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO hospital_departments (hospital_id, department_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            """,
            (hospital_id, department_id)
        )
        conn.commit()


def upsert_doctor(conn, name: str, hospital_id: str, department_id: str) -> str:
    """Upsert a doctor record."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO doctors (id, name, hospital_id, department_id)
            VALUES (gen_random_uuid(), %s, %s, %s)
            ON CONFLICT DO NOTHING
            RETURNING id
            """,
            (name, hospital_id, department_id)
        )
        result = cur.fetchone()
        if result:
            conn.commit()
            return result['id']
        # Already exists, fetch
        cur.execute(
            "SELECT id FROM doctors WHERE name = %s AND hospital_id = %s AND department_id = %s",
            (name, hospital_id, department_id)
        )
        doctor_id = cur.fetchone()['id']
        conn.commit()
        return doctor_id


def upsert_schedule(conn, hospital_id: str, department_id: str,
                    day_of_week: int, session: str,
                    doctor_id: Optional[str] = None,
                    is_available: Optional[bool] = None):
    """Upsert a schedule entry."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO schedules (id, hospital_id, doctor_id, department_id,
                                   day_of_week, session, is_available, last_verified_at)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT DO NOTHING
            """,
            (hospital_id, doctor_id, department_id, day_of_week, session, is_available)
        )
        conn.commit()
