# Test: specs/hospital-clinic-map-search/tasks.md — Task 9 (unit test)

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../crawler'))

from nhi_importer import parse_nhi_row, NHI_DEPT_MAPPING


class TestParseNhiRow:
    def test_parse_valid_hospital(self):
        row = {
            '醫事機構代碼': 'A12345',
            '醫事機構名稱': '台北市立醫院',
            '地址': '台北市中正區某路100號',
            '電話': '02-12345678',
            '診療科別': '骨科,復健科,內科',
        }
        result = parse_nhi_row(row)
        assert result is not None
        assert result['nhi_code'] == 'A12345'
        assert result['name'] == '台北市立醫院'
        assert result['type'] == 'hospital'
        assert ('骨科', 'western') in result['departments']
        assert ('復健科', 'western') in result['departments']
        assert ('內科', 'western') in result['departments']

    def test_parse_clinic(self):
        row = {
            '醫事機構代碼': 'B00001',
            '醫事機構名稱': '信義骨科診所',
            '地址': '台北市信義區某路50號',
            '電話': '02-87654321',
            '診療科別': '骨科',
        }
        result = parse_nhi_row(row)
        assert result is not None
        assert result['type'] == 'clinic'

    def test_parse_tcm(self):
        row = {
            '醫事機構代碼': 'C00001',
            '醫事機構名稱': '仁心中醫診所',
            '地址': '台北市中山區某路20號',
            '電話': '',
            '診療科別': '中醫一般科,中醫針灸科',
        }
        result = parse_nhi_row(row)
        assert result is not None
        assert result['type'] == 'tcm'
        assert result['phone'] is None
        assert ('中醫一般科', 'tcm') in result['departments']
        assert ('中醫針灸科', 'tcm') in result['departments']

    def test_parse_empty_code_returns_none(self):
        row = {
            '醫事機構代碼': '',
            '醫事機構名稱': 'Test',
            '地址': 'Test',
            '電話': '',
            '診療科別': '',
        }
        result = parse_nhi_row(row)
        assert result is None

    def test_parse_empty_name_returns_none(self):
        row = {
            '醫事機構代碼': 'X99999',
            '醫事機構名稱': '',
            '地址': 'Test',
            '電話': '',
            '診療科別': '',
        }
        result = parse_nhi_row(row)
        assert result is None

    def test_parse_no_matching_departments(self):
        row = {
            '醫事機構代碼': 'D00001',
            '醫事機構名稱': '牙科診所',
            '地址': '台北市某路',
            '電話': '',
            '診療科別': '牙科',
        }
        result = parse_nhi_row(row)
        assert result is not None
        assert result['departments'] == []


class TestNhiDeptMapping:
    def test_all_departments_have_categories(self):
        for dept, (name, category) in NHI_DEPT_MAPPING.items():
            assert category in ('western', 'tcm'), f"{dept} has invalid category: {category}"
            assert len(name) > 0

    def test_tcm_departments_have_tcm_category(self):
        for dept, (name, category) in NHI_DEPT_MAPPING.items():
            if '中醫' in dept:
                assert category == 'tcm', f"{dept} should be tcm"
