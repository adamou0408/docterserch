# 技術方案：醫院門診地圖搜尋

## 對應規格
- Spec: [spec.md](./spec.md)
- Research: [research.md](./research.md)
- 狀態：`approved`

## 工作量估算
- 總體複雜度：**L**（Large）
- 預估任務數：**12 個任務**
- 預估開發週期：**6-8 週**（Phase 1 MVP：4 週，Phase 2 門診爬蟲：2-4 週）

## 技術選型
| 技術 | 選擇理由 |
|------|----------|
| **Next.js 14 (App Router)** | 前端框架，支援 SSR/SSG 有利 SEO、內建 API Routes 可作輕量後端、RWD 支援完善 |
| **TypeScript** | 型別安全，提升程式碼品質與開發體驗 |
| **Leaflet + OpenStreetMap** | 免費地圖方案，無 API 費用，社群成熟，MVP 首選（research.md 建議） |
| **PostgreSQL + PostGIS** | 空間資料查詢（ST_DWithin）效能優異，適合地理位置半徑搜尋 |
| **Prisma** | TypeScript 原生 ORM，支援 PostgreSQL，schema 管理與遷移方便 |
| **Python + Scrapy** | 爬蟲框架，適合爬取多家醫院官網門診時刻表，生態成熟 |
| **node-cron / pg_cron** | 定時排程，驅動每日爬蟲更新 |
| **Docker + docker-compose** | 本地開發與部署一致性，沿用既有 `infra/docker/` 架構 |
| **Tailwind CSS** | 快速建立 RWD 介面，與 Next.js 整合良好 |

## 架構設計

### 元件拆解

```
┌──────────────────────────────────────────────────┐
│                   Frontend (Next.js)              │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │ MapView │  │ FilterBar│  │ ClinicListPanel │  │
│  │(Leaflet)│  │(科別篩選)│  │  (門診比較列表) │  │
│  └────┬────┘  └────┬─────┘  └───────┬─────────┘  │
│       └────────────┴────────────────┘             │
│                    │ API Calls                     │
└────────────────────┼──────────────────────────────┘
                     │
┌────────────────────┼──────────────────────────────┐
│              Backend (Next.js API Routes)          │
│  ┌─────────────────┴──────────────────────┐       │
│  │         REST API Layer                  │       │
│  │  /api/hospitals/search                  │       │
│  │  /api/hospitals/:id/schedules           │       │
│  │  /api/departments                       │       │
│  │  /api/admin/crawl-status                │       │
│  └─────────────────┬──────────────────────┘       │
│                    │                               │
│  ┌─────────────────┴──────────────────────┐       │
│  │        Service Layer (Prisma)           │       │
│  │  HospitalService / ScheduleService     │       │
│  │  CrawlService / DepartmentService      │       │
│  └─────────────────┬──────────────────────┘       │
└────────────────────┼──────────────────────────────┘
                     │
┌────────────────────┼──────────────────────────────┐
│           PostgreSQL + PostGIS                     │
│  hospitals | departments | doctors | schedules     │
│  crawl_logs | hospital_departments                 │
└───────────────────────────────────────────────────┘
                     │
┌────────────────────┼──────────────────────────────┐
│           Crawler (Python + Scrapy)                │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │NHI Data  │  │Hospital Site │  │TCM Crawlers │ │
│  │Importer  │  │Crawlers      │  │(中醫專用)   │ │
│  └──────────┘  └──────────────┘  └─────────────┘ │
│           Scheduled via cron (daily)               │
└───────────────────────────────────────────────────┘
```

### 元件互動

1. **使用者操作流程**：使用者在 MapView 點選位置 → FilterBar 選擇科別與半徑 → 前端呼叫 `/api/hospitals/search` → 後端以 PostGIS `ST_DWithin` 查詢 → 回傳醫院列表與標記座標 → 點選醫院後呼叫 `/api/hospitals/:id/schedules` → 顯示門診時刻表與掛號連結
2. **資料更新流程**：cron 排程 → 觸發 Python 爬蟲 → 爬取健保署資料與各醫院官網 → 寫入 PostgreSQL → 記錄 crawl_logs → 失敗時透過監控告警

## 與現有系統的整合點
| 整合項目 | 說明 |
|----------|------|
| `infra/docker/docker-compose.yml` | 新增 PostgreSQL + PostGIS、Next.js app、Python crawler 服務定義 |
| `infra/docker/Dockerfile` | 新增 Next.js 應用與 Python 爬蟲的 Dockerfile |
| `infra/monitoring/` | 在現有監控框架中新增爬蟲狀態告警與 API 健康檢查 |
| `infra/terraform/` | 新增資料庫與應用服務的雲端資源定義（用於 staging/prod） |

## 風險評估
| 風險 | 可能性 | 影響 | 緩解方案 |
|------|--------|------|----------|
| 醫院官網改版導致爬蟲失效 | 高 | 中 | 每家醫院爬蟲模組化，失效時僅影響單一醫院；crawl_logs 記錄失敗並告警 |
| 健保署資料格式變動 | 低 | 高 | NHI 資料匯入獨立模組，加入格式驗證與版本偵測 |
| PostGIS 空間查詢效能 | 低 | 中 | 建立 GIST 空間索引；台灣醫院總量約 2 萬筆，效能風險低 |
| 中醫資料來源不足 | 中 | 中 | 中醫與西醫分開處理（已決策），Phase 1 可先僅支援西醫，中醫作為 Phase 2 強化 |
| 爬蟲被醫院網站封鎖 | 中 | 中 | 設定合理爬取頻率（每院每日一次）、尊重 robots.txt、使用正常 User-Agent |

## 資料模型變更

### 新增表格

**hospitals（醫療院所）**
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| nhi_code | VARCHAR(10) | 健保署醫事機構代碼（唯一） |
| name | VARCHAR(200) | 醫院名稱 |
| address | TEXT | 地址 |
| phone | VARCHAR(20) | 電話 |
| location | GEOGRAPHY(Point, 4326) | 經緯度（PostGIS） |
| type | ENUM | 類型：醫院/診所/中醫 |
| website_url | TEXT | 官方網站 |
| registration_url | TEXT | 掛號頁面連結 |
| data_source | ENUM | 資料來源品質：api / crawled / nhi_only |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

**departments（科別）**
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| name | VARCHAR(50) | 科別名稱（骨科、復健科、中醫等） |
| category | ENUM | 分類：western / tcm（西醫/中醫） |

**hospital_departments（醫院-科別 多對多）**
| 欄位 | 型別 | 說明 |
|------|------|------|
| hospital_id | UUID | FK → hospitals |
| department_id | UUID | FK → departments |

**doctors（醫生）**
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| name | VARCHAR(100) | 醫生姓名 |
| hospital_id | UUID | FK → hospitals |
| department_id | UUID | FK → departments |

**schedules（門診時刻表）**
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| hospital_id | UUID | FK → hospitals |
| doctor_id | UUID | FK → doctors（可為 null） |
| department_id | UUID | FK → departments |
| day_of_week | SMALLINT | 星期幾（1-7） |
| session | ENUM | 時段：morning / afternoon / evening |
| specific_date | DATE | 特定日期（若為非固定門診） |
| is_available | BOOLEAN | 是否可掛號（僅 data_source=api 時可靠） |
| last_verified_at | TIMESTAMP | 最後驗證時間 |

**crawl_logs（爬蟲紀錄）**
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| hospital_id | UUID | FK → hospitals（可為 null，NHI 全量匯入時） |
| source | VARCHAR(50) | 來源類型：nhi / hospital_website / tcm |
| status | ENUM | 結果：success / failed / partial |
| records_updated | INT | 更新筆數 |
| error_message | TEXT | 錯誤訊息 |
| started_at | TIMESTAMP | 開始時間 |
| completed_at | TIMESTAMP | 完成時間 |

### 遷移策略
- **策略**：多階段遷移（Forward-compatible）
- Phase 1：建立 hospitals、departments、hospital_departments 表，匯入健保署資料
- Phase 2：新增 doctors、schedules 表，啟動爬蟲填充資料
- 所有遷移使用 Prisma Migrate，每次遷移均可 rollback
- **回滾策略**：此為全新建置（無既有 schema），遷移完全可逆。drop tables 即可回滾。

## 安全性考量
- **輸入驗證**：所有 API 參數需驗證（經緯度範圍、半徑上限、科別 ID 白名單）
- **SQL 注入防護**：使用 Prisma ORM 參數化查詢，PostGIS 函數亦透過 Prisma raw query 參數化
- **管理後台認證**：`/api/admin/*` 端點需 Bearer Token 認證（初期使用環境變數設定的管理員 token）
- **爬蟲安全**：不爬取需登入的頁面、尊重 robots.txt、不儲存使用者個人資料
- **HTTPS**：全站強制 HTTPS
- **Secrets 管理**：資料庫密碼、管理員 token 透過環境變數注入，不進版本控制
- **無需安全審查**：初期功能為公開資料查詢，不涉及個資或敏感操作

## API 合約
- 此功能涉及 API 變更：**是**
- 詳見 [contracts.md](./contracts.md)

## 實作策略

### Phase 1：MVP（第 1-4 週）
**目標**：地圖搜尋 + 健保署資料 + 科別篩選

1. **第 1 週**：專案初始化 + 資料庫建置 + 健保署資料匯入
   - 建立 Next.js 專案結構
   - PostgreSQL + PostGIS 設定
   - 健保署開放資料 ETL 腳本
   - 種子資料匯入（目標縣市）

2. **第 2 週**：後端 API + 地理搜尋
   - hospitals/search API（PostGIS 半徑查詢）
   - departments API
   - 基本錯誤處理與輸入驗證

3. **第 3 週**：前端地圖介面
   - Leaflet 地圖整合（定位 + 點選）
   - 科別篩選 UI
   - 搜尋結果標記與列表

4. **第 4 週**：整合測試 + 管理後台基礎
   - 前後端整合
   - 管理員 API（crawl_status）
   - E2E 測試
   - Docker 部署設定

### Phase 2：門診資料（第 5-8 週）
**目標**：門診時刻表 + 醫生資訊 + 資料品質分級

5. **第 5-6 週**：爬蟲系統
   - Python Scrapy 爬蟲框架
   - 目標縣市主要醫院爬蟲模組
   - 中醫診所爬蟲（分開處理）
   - 定時排程設定

6. **第 7 週**：門診詳情與比較
   - 門診時刻表 API + 前端顯示
   - 掛號連結導向
   - 資料品質信心指標（CONFLICT-001 方案 3）
   - 比較排序功能

7. **第 8 週**：監控 + 穩定化
   - 爬蟲狀態監控告警
   - 管理後台完善
   - 效能優化與壓測
   - 文件與部署準備
