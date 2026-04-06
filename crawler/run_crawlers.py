#!/usr/bin/env python3
# Spec: specs/hospital-clinic-map-search/spec.md — US-5
# Task: specs/hospital-clinic-map-search/tasks.md — Task 9

"""
Main crawler runner.
Runs all hospital spiders sequentially, handling failures per spider.
Can be triggered by cron or manually via admin API.
"""

import sys
import os
import logging
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

# Add crawler directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logger = logging.getLogger(__name__)

# All available spiders
WESTERN_SPIDERS = [
    'spiders.ntuh_spider.NTUHSpider',
    'spiders.mmh_spider.MMHSpider',
    'spiders.vghtpe_spider.VGHTPESpider',
    'spiders.cgmh_spider.CGMHSpider',
    'spiders.cgh_spider.CGHSpider',
]

TCM_SPIDERS = [
    'spiders.tcm_mingde_spider.MingDeTCMSpider',
    'spiders.tcm_renxin_spider.RenXinTCMSpider',
]


def import_spider_class(class_path: str):
    """Dynamically import a spider class from dotted path."""
    module_path, class_name = class_path.rsplit('.', 1)
    import importlib
    module = importlib.import_module(module_path)
    return getattr(module, class_name)


def run_all_spiders():
    """Run all hospital and TCM spiders."""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    settings = get_project_settings()
    process = CrawlerProcess(settings)

    for spider_path in WESTERN_SPIDERS + TCM_SPIDERS:
        try:
            spider_cls = import_spider_class(spider_path)
            process.crawl(spider_cls)
            logger.info(f"Queued spider: {spider_path}")
        except Exception as e:
            logger.error(f"Failed to queue spider {spider_path}: {e}")

    process.start()


def run_single_spider(spider_name: str):
    """Run a single spider by name."""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    spider_map = {}
    for path in WESTERN_SPIDERS + TCM_SPIDERS:
        cls = import_spider_class(path)
        spider_map[cls.name] = cls

    if spider_name not in spider_map:
        logger.error(f"Unknown spider: {spider_name}. Available: {list(spider_map.keys())}")
        return

    settings = get_project_settings()
    process = CrawlerProcess(settings)
    process.crawl(spider_map[spider_name])
    process.start()


def run_nhi_and_crawlers():
    """Full pipeline: NHI import → then crawl all hospital schedules."""
    from nhi_importer import run_nhi_import

    logger.info("=== Step 1: NHI Data Import ===")
    try:
        count = run_nhi_import(target_cities=['台北市', '新北市'])
        logger.info(f"NHI import: {count} records")
    except Exception as e:
        logger.error(f"NHI import failed: {e}")

    logger.info("=== Step 2: Hospital Schedule Crawling ===")
    run_all_spiders()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(name)s] %(levelname)s: %(message)s')

    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == 'nhi':
            from nhi_importer import run_nhi_import
            run_nhi_import(target_cities=['台北市', '新北市'])
        elif command == 'all':
            run_nhi_and_crawlers()
        elif command == 'crawl':
            run_all_spiders()
        elif command == 'spider':
            if len(sys.argv) > 2:
                run_single_spider(sys.argv[2])
            else:
                print("Usage: python run_crawlers.py spider <spider_name>")
        else:
            print(f"Unknown command: {command}")
            print("Usage: python run_crawlers.py [nhi|all|crawl|spider <name>]")
    else:
        print("Usage: python run_crawlers.py [nhi|all|crawl|spider <name>]")
        print("  nhi    - Run NHI data import only")
        print("  all    - Run NHI import + all crawlers")
        print("  crawl  - Run all crawlers (no NHI import)")
        print("  spider - Run a single spider by name")
