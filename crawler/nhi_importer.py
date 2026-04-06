# Spec: specs/hospital-clinic-map-search/spec.md — US-1, US-2
# Task: specs/hospital-clinic-map-search/tasks.md — Task 9

"""
NHI (健保署) Open Data Importer.
Downloads medical institution data from NHI open data and imports into the database.
Idempotent: safe to run multiple times.
"""

import csv
import io
import logging
import requests
from typing import Optional
from utils.db import (
    get_db_connection, start_crawl_log, complete_crawl_log,
    upsert_hospital, upsert_department, link_hospital_department
)

logger = logging.getLogger(__name__)

# 健保署醫事機構基本資料 Open Data URL
# This is a simplified version; actual NHI data URL may vary
NHI_DATA_URL = "https://data.nhi.gov.tw/resource/Opendata/醫事機構基本資料.csv"

# Department name mapping from NHI codes
NHI_DEPT_MAPPING = {
    '骨科': ('骨科', 'western'),
    '復健科': ('復健科', 'western'),
    '神經科': ('神經科', 'western'),
    '家庭醫學科': ('家醫科', 'western'),
    '內科': ('內科', 'western'),
    '外科': ('外科', 'western'),
    '小兒科': ('小兒科', 'western'),
    '婦產科': ('婦產科', 'western'),
    '中醫一般科': ('中醫一般科', 'tcm'),
    '中醫針灸科': ('中醫針灸科', 'tcm'),
    '中醫傷科': ('中醫傷科', 'tcm'),
}

# Geocoding fallback: major hospital known coordinates
KNOWN_COORDINATES = {
    'A0101': (25.0408, 121.5225),  # 台大醫院
    'A0102': (25.0586, 121.5235),  # 馬偕紀念醫院
    'A0103': (25.1212, 121.5173),  # 台北榮民總醫院
}


def geocode_address(address: str) -> Optional[tuple]:
    """
    Geocode an address to (lat, lng).
    Uses Nominatim (OpenStreetMap) for geocoding.
    Returns None if geocoding fails.
    """
    try:
        resp = requests.get(
            'https://nominatim.openstreetmap.org/search',
            params={'q': address, 'format': 'json', 'limit': 1, 'countrycodes': 'tw'},
            headers={'User-Agent': 'DoctorSearch/1.0'},
            timeout=10
        )
        if resp.status_code == 200 and resp.json():
            result = resp.json()[0]
            return (float(result['lat']), float(result['lon']))
    except Exception as e:
        logger.warning(f"Geocoding failed for {address}: {e}")
    return None


def parse_nhi_row(row: dict) -> Optional[dict]:
    """Parse a single NHI CSV row into hospital data."""
    try:
        nhi_code = row.get('醫事機構代碼', '').strip()
        name = row.get('醫事機構名稱', '').strip()
        address = row.get('地址', '').strip()
        phone = row.get('電話', '').strip()
        dept_str = row.get('診療科別', '').strip()

        if not nhi_code or not name:
            return None

        # Determine type
        if '中醫' in name or '中醫' in dept_str:
            hospital_type = 'tcm'
        elif '診所' in name:
            hospital_type = 'clinic'
        else:
            hospital_type = 'hospital'

        # Parse departments
        departments = []
        for dept_name, (mapped_name, category) in NHI_DEPT_MAPPING.items():
            if dept_name in dept_str:
                departments.append((mapped_name, category))

        return {
            'nhi_code': nhi_code,
            'name': name,
            'address': address,
            'phone': phone or None,
            'type': hospital_type,
            'departments': departments,
        }
    except Exception as e:
        logger.warning(f"Failed to parse NHI row: {e}")
        return None


def import_from_csv_data(csv_text: str, conn, target_cities: Optional[list] = None) -> int:
    """Import hospitals from CSV text data. Returns number of records imported."""
    reader = csv.DictReader(io.StringIO(csv_text))
    count = 0

    for row in reader:
        parsed = parse_nhi_row(row)
        if not parsed:
            continue

        # Filter by target cities if specified
        if target_cities:
            if not any(city in parsed['address'] for city in target_cities):
                continue

        # Get coordinates
        coords = KNOWN_COORDINATES.get(parsed['nhi_code'])
        if not coords:
            coords = geocode_address(parsed['address'])
        if not coords:
            logger.warning(f"Skipping {parsed['name']}: no coordinates")
            continue

        lat, lng = coords

        # Upsert hospital
        hospital_id = upsert_hospital(
            conn,
            nhi_code=parsed['nhi_code'],
            name=parsed['name'],
            address=parsed['address'],
            phone=parsed['phone'],
            latitude=lat,
            longitude=lng,
            hospital_type=parsed['type'],
        )

        # Link departments
        for dept_name, category in parsed['departments']:
            dept_id = upsert_department(conn, dept_name, category)
            link_hospital_department(conn, hospital_id, dept_id)

        count += 1

    return count


def run_nhi_import(target_cities: Optional[list] = None):
    """
    Main entry point: download NHI data and import.
    target_cities: list of city names to filter (e.g., ['台北市', '新北市'])
    """
    conn = get_db_connection()
    log_id = start_crawl_log(conn, source='nhi')

    try:
        logger.info("Downloading NHI open data...")
        resp = requests.get(NHI_DATA_URL, timeout=60)
        resp.raise_for_status()
        resp.encoding = 'utf-8'

        logger.info("Importing NHI data...")
        count = import_from_csv_data(resp.text, conn, target_cities)

        complete_crawl_log(conn, log_id, 'success', count)
        logger.info(f"NHI import complete: {count} records")
        return count

    except Exception as e:
        error_msg = str(e)
        logger.error(f"NHI import failed: {error_msg}")
        complete_crawl_log(conn, log_id, 'failed', 0, error_msg)
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run_nhi_import(target_cities=['台北市', '新北市'])
