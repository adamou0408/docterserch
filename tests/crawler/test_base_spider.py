# Test: specs/hospital-clinic-map-search/tasks.md — Task 10 (unit test)

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../crawler'))

from spiders.base_hospital import BaseHospitalSpider, SESSION_MAP, DAY_MAP


class TestParseSession:
    def test_morning_variants(self):
        assert BaseHospitalSpider.parse_session('上午') == 'morning'
        assert BaseHospitalSpider.parse_session('早上') == 'morning'
        assert BaseHospitalSpider.parse_session('上') == 'morning'

    def test_afternoon_variants(self):
        assert BaseHospitalSpider.parse_session('下午') == 'afternoon'

    def test_evening_variants(self):
        assert BaseHospitalSpider.parse_session('晚上') == 'evening'
        assert BaseHospitalSpider.parse_session('夜間') == 'evening'

    def test_default(self):
        assert BaseHospitalSpider.parse_session('unknown') == 'morning'

    def test_whitespace(self):
        assert BaseHospitalSpider.parse_session('  上午  ') == 'morning'


class TestParseDay:
    def test_chinese_short(self):
        assert BaseHospitalSpider.parse_day('一') == 1
        assert BaseHospitalSpider.parse_day('二') == 2
        assert BaseHospitalSpider.parse_day('三') == 3
        assert BaseHospitalSpider.parse_day('四') == 4
        assert BaseHospitalSpider.parse_day('五') == 5
        assert BaseHospitalSpider.parse_day('六') == 6
        assert BaseHospitalSpider.parse_day('日') == 7

    def test_chinese_full(self):
        assert BaseHospitalSpider.parse_day('週一') == 1
        assert BaseHospitalSpider.parse_day('星期五') == 5

    def test_english(self):
        assert BaseHospitalSpider.parse_day('Mon') == 1
        assert BaseHospitalSpider.parse_day('Fri') == 5
        assert BaseHospitalSpider.parse_day('Sun') == 7

    def test_default(self):
        assert BaseHospitalSpider.parse_day('unknown') == 1

    def test_whitespace(self):
        assert BaseHospitalSpider.parse_day('  週三  ') == 3


class TestSessionMap:
    def test_all_values_are_valid(self):
        valid = {'morning', 'afternoon', 'evening'}
        for key, val in SESSION_MAP.items():
            assert val in valid, f"SESSION_MAP['{key}'] = '{val}' is not valid"


class TestDayMap:
    def test_all_values_in_range(self):
        for key, val in DAY_MAP.items():
            assert 1 <= val <= 7, f"DAY_MAP['{key}'] = {val} is out of range"

    def test_covers_all_days(self):
        values = set(DAY_MAP.values())
        assert values == {1, 2, 3, 4, 5, 6, 7}
