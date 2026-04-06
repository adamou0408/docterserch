# Spec: specs/hospital-clinic-map-search/spec.md — US-5
# Task: specs/hospital-clinic-map-search/tasks.md — Task 9

"""Scrapy settings for the hospital schedule crawler."""

BOT_NAME = "docterserch_crawler"
SPIDER_MODULES = ["spiders"]
NEWSPIDER_MODULE = "spiders"

# Respectful crawling
ROBOTSTXT_OBEY = True
CONCURRENT_REQUESTS = 2
DOWNLOAD_DELAY = 3  # 3 seconds between requests per domain
RANDOMIZE_DOWNLOAD_DELAY = True

USER_AGENT = "DoctorSearch/1.0 (+https://github.com/adamou0408/docterserch)"

# Pipeline
ITEM_PIPELINES = {
    "pipelines.schedule_pipeline.SchedulePipeline": 300,
}

# Logging
LOG_LEVEL = "INFO"

# Retry
RETRY_TIMES = 2
RETRY_HTTP_CODES = [500, 502, 503, 504, 408]

# Timeout
DOWNLOAD_TIMEOUT = 30
