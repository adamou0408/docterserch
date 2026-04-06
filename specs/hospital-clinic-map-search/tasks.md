# 任務清單：醫院門診地圖搜尋

## 對應規格
- Spec: [spec.md](./spec.md)
- Plan: [plan.md](./plan.md)

## 並行標記說明
- `[P-group-X]`：同一 group 的任務可並行執行
- `[depends: N]`：必須等任務 N 完成後才能開始
- 無標記：按順序依序執行

---

## Phase 1：MVP（地圖搜尋 + 健保署資料 + 科別篩選）

### 任務 1：專案初始化與基礎架構 `[P-group-A]`
- **對應 User Story**：所有 US（基礎建設）
- **描述**：建立 Next.js 14 + TypeScript 專案，設定 Tailwind CSS、ESLint、Prettier、專案目錄結構（`src/app/`、`src/components/`、`src/lib/`、`src/services/`）
- **驗收條件**：
  - [ ] Next.js 14 App Router 專案可正常啟動
  - [ ] TypeScript 編譯無錯誤
  - [ ] Tailwind CSS 可正常使用
  - [ ] 基礎目錄結構建立完成
- **測試策略**：
  - Unit：專案建置腳本驗證
  - E2E：首頁可正常載入
- **狀態**：`todo`

### 任務 2：資料庫設定與 Schema 建立 `[P-group-A]`
- **對應 User Story**：所有 US（基礎建設）
- **描述**：設定 PostgreSQL + PostGIS（Docker），使用 Prisma 定義 schema 並建立 hospitals、departments、hospital_departments 表。包含 PostGIS extension 啟用與 GIST 空間索引。
- **驗收條件**：
  - [ ] PostgreSQL + PostGIS 容器可正常啟動
  - [ ] Prisma schema 定義完成並可成功 migrate
  - [ ] GIST 空間索引建立在 hospitals.location 欄位
  - [ ] docker-compose.yml 包含資料庫服務定義
- **測試策略**：
  - Unit：Prisma migrate 成功執行
  - Integration：可寫入與查詢空間資料
- **狀態**：`todo`

### 任務 3：健保署開放資料 ETL 匯入 `[depends: 2]`
- **對應 User Story**：US-1（搜尋周邊醫療院所）、US-2（科別篩選）
- **描述**：撰寫 ETL 腳本，下載健保署醫事機構基本資料 CSV/JSON，解析後匯入 hospitals、departments、hospital_departments 表。包含地址轉經緯度（geocoding）。目標：匯入指定縣市的所有醫療院所。
- **驗收條件**：
  - [ ] 可成功下載健保署開放資料
  - [ ] 解析醫事機構名稱、地址、科別、電話
  - [ ] 地址轉換為經緯度並存入 location 欄位
  - [ ] 科別正確對應到 departments 表
  - [ ] 匯入目標縣市的醫院資料筆數 > 0
  - [ ] ETL 腳本為冪等操作（重複執行不會產生重複資料）
- **測試策略**：
  - Unit：CSV/JSON 解析、geocoding 轉換
  - Integration：匯入後資料庫查詢結果正確
- **狀態**：`todo`

### 任務 4：醫院搜尋 API（地理半徑查詢） `[depends: 3]`
- **對應 User Story**：US-1（搜尋周邊醫療院所）、US-2（科別篩選）
- **描述**：實作 `GET /api/hospitals/search` API，接受經緯度、半徑、科別參數，使用 PostGIS `ST_DWithin` 查詢，回傳符合條件的醫院列表（含距離排序）。
- **驗收條件**：
  - [ ] 輸入經緯度 + 半徑，回傳範圍內醫院
  - [ ] 支援科別篩選（單選/多選）
  - [ ] 回傳結果包含：醫院名稱、地址、電話、距離、具備科別、data_source
  - [ ] 回應時間 < 500ms（指定縣市資料量）
  - [ ] 參數驗證：經緯度範圍、半徑上限 50km、科別 ID 白名單
- **測試策略**：
  - Unit：參數驗證邏輯
  - Integration：PostGIS 空間查詢結果正確性
  - E2E：API 端點回應格式與狀態碼
- **狀態**：`todo`

### 任務 5：科別列表 API `[depends: 3]`
- **對應 User Story**：US-2（科別篩選）
- **描��**：實作 `GET /api/departments` API，回傳所有可用科別（含西醫/中醫分類）。
- **驗收條件**：
  - [ ] 回傳所有科別（id、name、category）
  - [ ] 科別按分類分組（western / tcm）
- **測試策略**：
  - Integration：回傳資料與 seed data 一致
- **狀態**：`todo`

### 任務 6：地圖前端元件（Leaflet） `[depends: 1]`
- **對應 User Story**：US-1（搜尋周邊醫療院所）
- **描述**：建立 MapView 元件，整合 Leaflet + OpenStreetMap。支援：使用者定位（Geolocation API）、點選地圖選擇位置、搜尋半徑選擇器、醫院標記顯示（含名稱與距離 popup）。
- **驗收條件**：
  - [ ] 地圖正常渲染（OpenStreetMap 圖層）
  - [ ] 支援使用者 GPS 定位（需使用者授權）
  - [ ] 可點選地圖任意位置作為搜尋中心
  - [ ] 半徑選擇器（1km / 3km / 5km / 10km）
  - [ ] 搜尋範圍以圓圈視覺化顯示
  - [ ] 醫院以標記顯示，點擊顯示名稱與距離
- **測試策略**：
  - Unit：元件渲染、狀態管理
  - E2E：地圖載入、點擊互動
- **狀態**：`todo`

### 任務 7：科別篩選 UI + 搜尋結果列表 `[depends: 6]`
- **對應 User Story**：US-2（科別篩選）、US-4（比較門診）
- **描述**：建立 FilterBar 元件（科別多選 checkbox）與 ClinicListPanel 元件（搜尋結果列表，含排序功能）。串接 `/api/departments` 與 `/api/hospitals/search`。
- **驗收條件**：
  - [ ] 科別篩選 UI（多選 checkbox 或 tag）
  - [ ] 選擇科別後即時更新地圖標記與列表
  - [ ] 列表顯示：醫院名稱、距離、具備科別、data_source 標記
  - [ ] 列表可依距離排序
  - [ ] 地圖與列表連動（點列表 highlight 地圖標記）
- **測試策略**：
  - Unit：FilterBar 狀態管理、列表排序邏輯
  - Integration：前後端 API 串接
  - E2E：完整搜尋流程（選位置 → 選科別 → 查看結果）
- **狀態**：`todo`

### 任務 8：Docker 部署設定 + 管理後台基礎 `[depends: 4, 5, 7]`
- **對應 User Story**：US-5（管理資料來源）
- **描述**：更新 docker-compose.yml 加入 Next.js app + PostgreSQL 服務。實作 `/api/admin/crawl-status` API（基礎版：顯示 crawl_logs 最後更新時間、資料統計）。加入管理員 token 認證。
- **驗收條件**：
  - [ ] `docker-compose up` 可一鍵啟動整個系統
  - [ ] `/api/admin/crawl-status` 需 Bearer Token 認證
  - [ ] 回傳資料統計：總醫院數、各科別醫院數、最後更新時間
  - [ ] 無效 token 回傳 401
- **測試策略**：
  - Unit：認證 middleware
  - Integration：Docker 服務間通訊
  - E2E：完整 docker-compose 啟動驗證
- **狀態**：`todo`

---

## Phase 2：門診資料（爬蟲 + 門診時刻表 + 資料品質分級）

### 任務 9：爬蟲框架與健保署資料定時更新 `[depends: 3]`
- **對應 User Story**：US-3（門診時間）、US-5（管理資料來源）
- **描述**：建立 Python Scrapy 爬蟲專案結構。實作健保署資料定時重新匯入（每週一次）。建立 crawl_logs 記錄機制。設定 cron 排程。
- **驗收條件**：
  - [ ] Scrapy 專案結構建立
  - [ ] 健保署資料可定時重新匯入
  - [ ] crawl_logs 正確記錄每次執行結果（成功/失敗/筆數）
  - [ ] 失敗時寫入 error_message
  - [ ] cron 排程可正常觸發
- **測試策略**：
  - Unit：資料解析、crawl_log 寫入
  - Integration：完整爬取流程（使用 mock 資料）
- **狀態**：`todo`

### 任務 10：醫院官網門診時刻表爬蟲 `[depends: 9]`
- **對應 User Story**：US-3���門診時間）
- **描述**：針對目標縣市主要醫院，開發個別爬蟲模組（每家醫院一個 Spider），爬取門診時刻表（醫生、科別、時段）並寫入 doctors + schedules 表。中醫診所使用獨立爬蟲模組（分開處理，已決策）。
- **驗收條件**：
  - [ ] 至少完成目標縣市 5 家主要醫院的爬蟲
  - [ ] 中醫診所爬蟲獨立模組至少 3 家
  - [ ] 爬取資料寫入 doctors 與 schedules 表
  - [ ] 單一醫院爬蟲失效不影響其他醫院
  - [ ] 尊重 robots.txt、合理爬取頻率
- **測試策略**：
  - Unit：各 Spider 的 HTML 解析邏輯（使用快照 HTML）
  - Integration：完整爬取 → 資料庫寫入流程
- **狀態**：`todo`

### 任務 11：門診時刻表 API + 前端顯示 + 資料品質分級 `[depends: 10, 7]`
- **對應 User Story**：US-3（門診時間）、US-4（比較門診）
- **描述**：實作 `GET /api/hospitals/:id/schedules` API。前端新增門診詳情面板（點擊醫院後展開）。實作資料品質信心指標（CONFLICT-001 方案 3）：api 來源顯示即時狀態、crawled 顯示時刻表 + 更新時間、nhi_only 顯示基本資訊 + 提示。搜尋列表加入「最近可看診時段」排序。
- **驗收條件**：
  - [ ] API 回傳指定醫院的門診時刻表（按日期、時段排列）
  - [ ] 門診時刻表顯示：日期、時段、科別、醫生姓名
  - [ ] 可篩選日期範圍（今天、明天、本週）
  - [ ] 資料品質信心指標正確顯示（api / crawled / nhi_only）
  - [ ] crawled 來源顯示「資料更新於 X 小時前」
  - [ ] nhi_only 來源顯示「僅有基本資訊，建議電話確認」
  - [ ] 掛號連結按鈕導向醫院掛號頁面
  - [ ] 列表可依「最近可看診時段」排序
- **測試策略**：
  - Unit：信心指標邏輯、日期篩選
  - Integration：API 回傳���式與資料正確性
  - E2E：完整流程：搜尋 → 選醫院 → 查看門診 → 點擊掛號連結
- **狀態**：`todo`

### 任務 12：管理後台完善 + 監控告警 `[depends: 10, 8]`
- **對應 User Story**：US-5（管理資料來源）
- **描述**：完善管理後台 API：手動觸發爬蟲、查看各醫院爬取狀態、資料覆蓋率統計。整合 `infra/monitoring/` 現有框架，新增爬蟲失敗告警規則。
- **驗收條件**：
  - [ ] `/api/admin/crawl-trigger` 可手動觸發指定醫院爬取
  - [ ] `/api/admin/crawl-status` 顯示各醫院最後爬取時間與狀態
  - [ ] 顯示資料覆蓋率（有門診資料的醫院 / 總醫院數）
  - [ ] 爬取失敗時觸發監控告警（整合 Prometheus/Alertmanager）
  - [ ] 管理員操作記錄於審計日誌
- **測試策略**：
  - Unit：覆蓋率計算邏輯
  - Integration：手動觸發 → 爬蟲執行 → 狀態更新
  - E2E：管理後台完整操作流程
- **狀態**：`todo`

---

## 進度摘要
- 總任務數：**12**
- 已完成：**0**
- 進行中：**0**
- 需人工介入：**0**
- 可並行的 group 數：**1**（Group A：任務 1 + 任務 2 可並行）
