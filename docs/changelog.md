# 需求變更紀錄

所有需求的狀態變更和內容更新都會記錄在這裡。

---

## 格式說明

每筆紀錄包含：
- **日期**：變更發生的日期
- **類型**：新增 / 更新 / 狀態變更 / 衝突 / 解決
- **目標**：受影響的檔案或功能
- **說明**：變更的簡要描述

---

## 紀錄

### 2026-04-06

| 日期 | 類型 | 目標 | 說明 |
|------|------|------|------|
| 2026-04-06 | 新增 | `intake/raw/2026-04-06-hospital-clinic-map-search.md` | 提交醫院門診地圖搜尋需求 |
| 2026-04-06 | 新增 | `specs/hospital-clinic-map-search/research.md` | 完成調研報告：無重複、可行性評估 |
| 2026-04-06 | 新增 | `specs/hospital-clinic-map-search/spec.md` | 需求轉譯為結構化 spec（5 個 US、2 個角色） |
| 2026-04-06 | 新增 | `personas/patient.md` | ��增角色：患者（就醫者） |
| 2026-04-06 | 新增 | `personas/data-admin.md` | 新增角色：系統管理員（資料維護���） |
| 2026-04-06 | 衝突 | `conflicts/CONFLICT-001.md` | 偵測衝突：資料即時性 vs 爬取頻率限制 |
| 2026-04-06 | 解決 | `conflicts/CONFLICT-001.md` | 解決衝突：採用方案 3（依資料品質分級） |
| 2026-04-06 | 狀態變更 | `specs/hospital-clinic-map-search/spec.md` | draft → in-review → **approved** |
