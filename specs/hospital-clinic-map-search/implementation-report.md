# 實作報告：醫院門診地圖搜尋

## 實作日期：2026-04-06

## 任務完成狀態

| 任務 | 狀態 | 備註 |
|------|------|------|
| Task 1：專案初始化 | done | Next.js 14 + TypeScript + Tailwind CSS |
| Task 2：資料庫 Schema | done | Prisma + PostgreSQL + PostGIS |
| Task 3：NHI ETL 匯入 | done | Seed 腳本含 8 家台北醫院範例資料 |
| Task 4：醫院搜尋 API | done | PostGIS ST_DWithin 空間查詢 |
| Task 5：科別列表 API | done | 含西醫/中醫分類 |
| Task 6：地圖前端 (Leaflet) | done | 定位、點選、標記、半徑圓圈 |
| Task 7：篩選 UI + 列表 | done | FilterBar + ClinicListPanel + 連動 |
| Task 8：Docker + 管理 API | done | docker-compose + 認證 middleware |
| Task 9：爬蟲框架 | needs-human-intervention | Python Scrapy 專案尚未建立 |
| Task 10：醫院爬蟲 | needs-human-intervention | 需研究各醫院官網 HTML 結構 |
| Task 11：門診時刻表 API + UI | done | API + SchedulePanel + 信心指標 |
| Task 12：管理後台完善 | done | crawl-status + crawl-trigger API |

**完成率：10/12（83%）**

## 測試覆蓋摘要

| 層級 | 測試數 | 狀態 |
|------|--------|------|
| Unit | 14 | 全部通過 |
| Integration | 0 | 需要 DB 環境（docker-compose 啟動後可測） |
| E2E | 0 | 需要完整環境（docker-compose 啟動後可測） |

### 已完成的測試
- `tests/unit/validation.test.ts`：10 個測試（參數驗證邏輯）
- `tests/unit/auth.test.ts`：4 個測試（管理員認證）

## 安全性檢查

| 項目 | 狀態 |
|------|------|
| 無硬編碼 secrets | ✅ 使用環境變數 |
| 輸入驗證 | ✅ 經緯度範圍、半徑上限、科別白名單 |
| SQL 注入防護 | ✅ Prisma ORM 參數化查詢 |
| 管理 API 認證 | ✅ Bearer Token |
| HTTPS | ✅ 由部署環境保證 |
| .env 不進版控 | ✅ 已加入 .gitignore |

## 與計畫的偏差

| 偏差 | 說明 |
|------|------|
| Prisma 7 API 差異 | Prisma 7 改為使用 prisma.config.ts 管理連線，constructor 不再接受 datasourceUrl |
| Phase 2 爬蟲未實作 | Python Scrapy 專案結構需獨立環境開發，API 與 DB schema 已就緒 |
| PostGIS 索引 | 使用 Prisma raw query 的 ST_DWithin 而非 GIST 索引（索引需在 migration 中手動加入） |

## 程式碼結構

```
src/
├── prisma/
│   ├── schema.prisma          # DB schema (6 tables)
│   └── seed.ts                # NHI seed data (8 hospitals)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── hospitals/
│   │   │   │   ├── search/route.ts      # GET /api/hospitals/search
│   │   │   │   └── [id]/schedules/route.ts  # GET /api/hospitals/:id/schedules
│   │   │   ├── departments/route.ts     # GET /api/departments
│   │   │   └── admin/
│   │   │       ├── crawl-status/route.ts    # GET /api/admin/crawl-status
│   │   │       └── crawl-trigger/route.ts   # POST /api/admin/crawl-trigger
│   │   ├── layout.tsx
│   │   └── page.tsx           # Main search page
│   ├── components/
│   │   ├── MapView.tsx        # Leaflet map
│   │   ├── FilterBar.tsx      # Department + radius filter
│   │   ├── ClinicListPanel.tsx # Search results list
│   │   └── SchedulePanel.tsx  # Hospital schedule detail
│   ├── services/
│   │   ├── hospital.ts        # PostGIS search logic
│   │   ├── department.ts      # Department queries
│   │   └── schedule.ts        # Schedule + confidence
│   ├── lib/
│   │   ├── prisma.ts          # DB client singleton
│   │   ├── validation.ts      # Search param validation
│   │   └── auth.ts            # Admin authentication
│   └── types/
│       └── api.ts             # API type definitions
tests/
├── unit/
│   ├── validation.test.ts     # 10 tests
│   └── auth.test.ts           # 4 tests
infra/
└── docker/
    ├── docker-compose.yml     # PostgreSQL + PostGIS + Next.js app
    └── Dockerfile.app         # Next.js container
```

## Code Review 準備度評估
- ✅ 所有程式碼含 Spec/Task 追溯註解
- ✅ TypeScript 編譯無錯誤
- ✅ ESLint 檢查通過
- ✅ 單元測試 14/14 通過
- ⚠️ Integration/E2E 測試需 DB 環境
- ⚠️ Phase 2 爬蟲 (Task 9, 10) 需人工介入
