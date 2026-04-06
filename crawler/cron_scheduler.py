#!/usr/bin/env python3
# Spec: specs/hospital-clinic-map-search/spec.md — US-5
# Task: specs/hospital-clinic-map-search/tasks.md — Task 9

"""
Cron-like scheduler for running crawlers on a schedule.
Alternative to system cron — runs as a long-lived process in Docker.

Schedule:
- NHI import: Every Sunday at 02:00
- Hospital crawlers: Every day at 03:00
"""

import logging
import schedule
import time
import subprocess
import sys
import os

logger = logging.getLogger(__name__)

CRAWLER_DIR = os.path.dirname(os.path.abspath(__file__))


def run_nhi_import():
    """Run NHI data import."""
    logger.info("Starting scheduled NHI import...")
    try:
        result = subprocess.run(
            [sys.executable, os.path.join(CRAWLER_DIR, 'run_crawlers.py'), 'nhi'],
            capture_output=True, text=True, timeout=600, cwd=CRAWLER_DIR
        )
        if result.returncode == 0:
            logger.info(f"NHI import completed: {result.stdout[-200:]}")
        else:
            logger.error(f"NHI import failed: {result.stderr[-500:]}")
    except subprocess.TimeoutExpired:
        logger.error("NHI import timed out (10 min)")
    except Exception as e:
        logger.error(f"NHI import error: {e}")


def run_crawlers():
    """Run all hospital schedule crawlers."""
    logger.info("Starting scheduled crawlers...")
    try:
        result = subprocess.run(
            [sys.executable, os.path.join(CRAWLER_DIR, 'run_crawlers.py'), 'crawl'],
            capture_output=True, text=True, timeout=3600, cwd=CRAWLER_DIR
        )
        if result.returncode == 0:
            logger.info(f"Crawlers completed: {result.stdout[-200:]}")
        else:
            logger.error(f"Crawlers failed: {result.stderr[-500:]}")
    except subprocess.TimeoutExpired:
        logger.error("Crawlers timed out (60 min)")
    except Exception as e:
        logger.error(f"Crawlers error: {e}")


def main():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(name)s] %(levelname)s: %(message)s'
    )

    # Schedule NHI import weekly on Sunday at 02:00
    schedule.every().sunday.at("02:00").do(run_nhi_import)

    # Schedule crawlers daily at 03:00
    schedule.every().day.at("03:00").do(run_crawlers)

    logger.info("Crawler scheduler started")
    logger.info(f"  NHI import: Every Sunday at 02:00")
    logger.info(f"  Crawlers:   Every day at 03:00")

    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


if __name__ == '__main__':
    main()
