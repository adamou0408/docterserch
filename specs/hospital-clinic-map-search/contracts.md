# API 合約：醫院門診地圖搜尋

## 對應規格
- Spec: [spec.md](./spec.md)
- Plan: [plan.md](./plan.md)

---

## API 端點

### `GET /api/hospitals/search`
- **描述**：依地理位置與科別搜尋周邊醫療院所
- **認證**：不需要
- **權限**：公開
- **請求參數**：
  | 參數 | 型別 | 必填 | 說明 |
  |------|------|------|------|
  | lat | number | 是 | 緯度（範圍：21.5 ~ 25.5，台灣範圍） |
  | lng | number | 是 | 經度（範圍：119.0 ~ 122.5，台灣範圍） |
  | radius | number | 否 | 搜尋半徑（公尺），預設 3000，上限 50000 |
  | departments | string | 否 | 科別 ID，逗號分隔（多選），例如 `dept-1,dept-2` |
  | sort | string | 否 | 排序方式：`distance`（預設）、`next_available` |
  | limit | number | 否 | 回傳數量上限，預設 50，上限 200 |
  | offset | number | 否 | 分頁偏移量，預設 0 |
- **請求範例**：
  ```
  GET /api/hospitals/search?lat=25.033&lng=121.565&radius=5000&departments=dept-ortho,dept-rehab&sort=distance
  ```
- **回應範例**：
  ```json
  {
    "total": 15,
    "results": [
      {
        "id": "hosp-uuid-001",
        "name": "台大醫院",
        "address": "台北市中正區中山南路7號",
        "phone": "02-23123456",
        "distance_meters": 1200,
        "location": { "lat": 25.0408, "lng": 121.5225 },
        "type": "hospital",
        "website_url": "https://www.ntuh.gov.tw",
        "registration_url": "https://reg.ntuh.gov.tw",
        "data_source": "crawled",
        "departments": [
          { "id": "dept-ortho", "name": "骨科", "category": "western" },
          { "id": "dept-rehab", "name": "復健科", "category": "western" }
        ],
        "next_available_session": {
          "date": "2026-04-07",
          "session": "morning",
          "department": "骨科",
          "doctor_name": "王醫師"
        },
        "last_updated_at": "2026-04-06T08:00:00Z"
      }
    ]
  }
  ```
- **錯誤碼**：
  | 狀態碼 | 說明 |
  |--------|------|
  | 400 | 參數驗證失敗（經緯度超出範圍、半徑超過上限、無效科別 ID） |
  | 500 | 伺服器內部錯誤 |

---

### `GET /api/hospitals/:id/schedules`
- **描述**：取得指定醫院的門診時刻表
- **認證**：不需要
- **權限**：公開
- **請求參數**：
  | 參數 | 型別 | 必填 | 說明 |
  |------|------|------|------|
  | id | string (path) | 是 | 醫院 UUID |
  | department_id | string | 否 | 篩選特定科別 |
  | date_from | string | 否 | 開始日期（YYYY-MM-DD），預設今天 |
  | date_to | string | 否 | 結束日期（YYYY-MM-DD），預設本週日 |
- **請求範例**：
  ```
  GET /api/hospitals/hosp-uuid-001/schedules?department_id=dept-ortho&date_from=2026-04-06&date_to=2026-04-12
  ```
- **回應範例**：
  ```json
  {
    "hospital_id": "hosp-uuid-001",
    "hospital_name": "台大醫院",
    "data_source": "crawled",
    "last_updated_at": "2026-04-06T08:00:00Z",
    "confidence": {
      "level": "medium",
      "label": "資料更新於 8 小時前",
      "description": "此門診資料來自網站爬取，可能與實際情況有出入"
    },
    "schedules": [
      {
        "date": "2026-04-07",
        "day_of_week": 1,
        "sessions": [
          {
            "session": "morning",
            "session_label": "上午",
            "department": { "id": "dept-ortho", "name": "骨科" },
            "doctor": { "id": "doc-uuid-001", "name": "王醫師" },
            "is_available": null,
            "registration_url": "https://reg.ntuh.gov.tw/ortho/morning"
          },
          {
            "session": "afternoon",
            "session_label": "下午",
            "department": { "id": "dept-ortho", "name": "骨科" },
            "doctor": { "id": "doc-uuid-002", "name": "林醫師" },
            "is_available": null,
            "registration_url": "https://reg.ntuh.gov.tw/ortho/afternoon"
          }
        ]
      }
    ]
  }
  ```
- **錯誤碼**：
  | 狀態碼 | 說明 |
  |--------|------|
  | 400 | 參數驗證失敗（無效日期格式、日期範圍超過 30 天） |
  | 404 | 醫院不存在 |
  | 500 | 伺服器內部錯誤 |

---

### `GET /api/departments`
- **描述**：取得所有可用科別列表
- **認證**：不需要
- **權限**：公開
- **請求參數**：
  | 參數 | 型別 | 必填 | 說明 |
  |------|------|------|------|
  | category | string | 否 | 篩選分類：`western` / `tcm` |
- **請求範例**：
  ```
  GET /api/departments?category=western
  ```
- **回應範例**：
  ```json
  {
    "departments": [
      {
        "category": "western",
        "category_label": "西醫",
        "items": [
          { "id": "dept-ortho", "name": "骨科" },
          { "id": "dept-rehab", "name": "復健科" },
          { "id": "dept-neuro", "name": "神經科" }
        ]
      },
      {
        "category": "tcm",
        "category_label": "中醫",
        "items": [
          { "id": "dept-tcm-general", "name": "中醫一般科" },
          { "id": "dept-tcm-acupuncture", "name": "中醫針灸科" }
        ]
      }
    ]
  }
  ```
- **錯誤碼**：
  | 狀態碼 | 說明 |
  |--------|------|
  | 500 | 伺服器內部錯誤 |

---

### `GET /api/admin/crawl-status`
- **描述**：取得爬蟲執行狀態與資料統計（管理員專用）
- **認證**：需要（Bearer Token）
- **權限**：管理員
- **請求參數**：無
- **請求範例**：
  ```
  GET /api/admin/crawl-status
  Headers: Authorization: Bearer <admin-token>
  ```
- **回應範例**：
  ```json
  {
    "summary": {
      "total_hospitals": 1523,
      "hospitals_with_schedules": 312,
      "coverage_rate": 0.205,
      "last_nhi_import": "2026-04-05T02:00:00Z",
      "last_crawl_run": "2026-04-06T03:00:00Z"
    },
    "recent_crawl_logs": [
      {
        "id": "log-uuid-001",
        "hospital_name": "台大醫院",
        "source": "hospital_website",
        "status": "success",
        "records_updated": 45,
        "completed_at": "2026-04-06T03:15:00Z"
      },
      {
        "id": "log-uuid-002",
        "hospital_name": "馬偕醫院",
        "source": "hospital_website",
        "status": "failed",
        "error_message": "HTML structure changed, parser failed",
        "completed_at": "2026-04-06T03:20:00Z"
      }
    ]
  }
  ```
- **錯誤碼**：
  | 狀態碼 | 說明 |
  |--------|------|
  | 401 | 未提供 token 或 token 無效 |
  | 500 | 伺服器內部錯誤 |

---

### `POST /api/admin/crawl-trigger`
- **描述**：手動觸發指定醫院的資料爬取（管理員專用）
- **認證**：需要（Bearer Token）
- **權限**：管理員
- **請求參數**：
  | 參數 | 型別 | 必填 | 說明 |
  |------|------|------|------|
  | hospital_id | string (body) | 否 | 指定醫院 UUID，不填則觸發全量爬取 |
  | source | string (body) | 否 | 爬取來源：`nhi` / `hospital_website` / `tcm`，預設 `hospital_website` |
- **請求範例**：
  ```json
  POST /api/admin/crawl-trigger
  Headers: Authorization: Bearer <admin-token>
  Body:
  {
    "hospital_id": "hosp-uuid-001",
    "source": "hospital_website"
  }
  ```
- **回應範例**：
  ```json
  {
    "message": "Crawl triggered successfully",
    "crawl_log_id": "log-uuid-003",
    "status": "queued"
  }
  ```
- **錯誤碼**：
  | 狀態碼 | 說明 |
  |--------|------|
  | 401 | 未提供 token 或 token 無效 |
  | 404 | 醫院不存在 |
  | 409 | 該醫院已有爬取任務進行中 |
  | 500 | 伺服器內部錯誤 |

---

## 資料模型

### Hospital
| 欄位 | 型別 | 必填 | 說明 | 約束 |
|------|------|------|------|------|
| id | UUID | 是 | 主鍵 | PK |
| nhi_code | string | 是 | 健保署代碼 | UNIQUE |
| name | string | 是 | 醫院名稱 | |
| address | string | 是 | 地址 | |
| phone | string | 否 | 電話 | |
| location | Point | 是 | 經緯度 | GIST INDEX |
| type | enum | 是 | hospital / clinic / tcm | |
| website_url | string | 否 | 官方網站 | |
| registration_url | string | 否 | 掛號頁面 | |
| data_source | enum | 是 | api / crawled / nhi_only | |
| created_at | timestamp | 是 | 建立時間 | |
| updated_at | timestamp | 是 | 更新時間 | |

### Department
| 欄位 | 型別 | 必填 | 說明 | 約束 |
|------|------|------|------|------|
| id | UUID | 是 | 主鍵 | PK |
| name | string | 是 | 科別名稱 | UNIQUE |
| category | enum | 是 | western / tcm | |

### Doctor
| 欄位 | 型別 | 必填 | 說明 | 約束 |
|------|------|------|------|------|
| id | UUID | 是 | 主鍵 | PK |
| name | string | 是 | 醫生姓名 | |
| hospital_id | UUID | 是 | 所屬醫院 | FK → Hospital |
| department_id | UUID | 是 | 所屬科別 | FK → Department |

### Schedule
| 欄位 | 型別 | 必填 | 說明 | 約束 |
|------|------|------|------|------|
| id | UUID | 是 | 主鍵 | PK |
| hospital_id | UUID | 是 | 醫院 | FK → Hospital |
| doctor_id | UUID | 否 | 醫生 | FK → Doctor |
| department_id | UUID | 是 | 科別 | FK → Department |
| day_of_week | smallint | 是 | 星期幾 (1-7) | CHECK 1-7 |
| session | enum | 是 | morning / afternoon / evening | |
| specific_date | date | 否 | 特定日期 | |
| is_available | boolean | 否 | 可掛號（僅 api 來源可靠） | |
| last_verified_at | timestamp | 是 | 最後驗證時間 | |

### CrawlLog
| 欄位 | 型別 | 必填 | 說明 | 約束 |
|------|------|------|------|------|
| id | UUID | 是 | 主鍵 | PK |
| hospital_id | UUID | 否 | 醫院 | FK → Hospital |
| source | string | 是 | 來源類型 | |
| status | enum | 是 | success / failed / partial | |
| records_updated | int | 否 | 更新筆數 | |
| error_message | text | 否 | 錯誤訊息 | |
| started_at | timestamp | 是 | 開始時間 | |
| completed_at | timestamp | 否 | 完成時間 | |

### 模型間關係
- Hospital ↔ Department：多對多（透過 hospital_departments 中間表）
- Hospital → Doctor：一對多
- Hospital → Schedule：一對多
- Doctor → Schedule：一對多
- Department → Schedule：一對多
- Hospital → CrawlLog：一對多

## 向後相容性
- 此 API 為全新建置，無現有客戶端，無向後相容性問題。
- 未來 API 版本變更時，建議使用 `/api/v2/` 前綴進行版本管理。
