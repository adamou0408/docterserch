# 部署報告：dev 環境

## 基本資訊
- **部署日期**：2026-04-06
- **目標環境**：dev
- **部署策略**：Direct
- **觸發方式**：手動 `/deploy`
- **部署 commit**：`02b33912` (main branch merge)

## Pre-deployment Checks

| 檢查項目 | 結果 | 說明 |
|----------|------|------|
| Spec 狀態 | ✅ PASS | `done` |
| 衝突狀態 | ✅ PASS | CONFLICT-001 = `resolved` |
| 測試通過 | ✅ PASS | 35/35 (14 JS + 21 Python) |
| 安全審計 | ✅ PASS | SQL injection 已修正，全項通過 |
| Docker config | ✅ PASS | docker-compose.yml 驗證通過 |
| App 編譯 | ✅ PASS | Next.js build 編譯 + 型別檢查通過 |

## 部署內容

### 服務
| 服務 | Image | Port | 說明 |
|------|-------|------|------|
| db | postgis/postgis:16-3.4 | 5432 | PostgreSQL + PostGIS |
| app | Dockerfile.app (Next.js) | 3000 | 前端 + API |
| prometheus | prom/prometheus:latest | 9090 | 監控 |
| alertmanager | prom/alertmanager:latest | 9093 | 告警 |

### API 端點
| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/health` | GET | 健康檢查（新增） |
| `/api/hospitals/search` | GET | 醫院搜尋 |
| `/api/hospitals/:id/schedules` | GET | 門診時刻表 |
| `/api/departments` | GET | 科別列表 |
| `/api/admin/crawl-status` | GET | 爬蟲狀態 |
| `/api/admin/crawl-trigger` | POST | 手動觸發爬蟲 |

### 資料庫
- 6 個表：hospitals, departments, hospital_departments, doctors, schedules, crawl_logs
- PostGIS extension 啟用
- Seed 資料：8 家台北醫院 + 11 個科別

## 部署指令

```bash
# 1. 啟動所有服務
cd infra/docker && docker compose up -d

# 2. 執行資料庫遷移
docker compose exec app npx prisma migrate deploy

# 3. 匯入種子資料
docker compose exec app npx ts-node prisma/seed.ts

# 4. 驗證健康檢查
curl http://localhost:3000/api/health

# 5. (可選) 執行爬蟲匯入
docker compose exec app python3 /app/../crawler/run_crawlers.py nhi
```

## 部署狀態
- **結果**：✅ 準備就緒（Ready to deploy）
- **備註**：Docker daemon 在當前環境不可用，部署配置已驗證完成。在有 Docker 的環境中執行上述指令即可完成部署。

## Health Check 端點
- URL: `GET /api/health`
- 成功回應: `{"status":"healthy","checks":{"app":"ok","db":"ok"},"timestamp":"..."}`
- 失敗回應: `{"status":"degraded","checks":{"app":"ok","db":"error"},"timestamp":"..."}` (HTTP 503)

## Rollback 計畫
```bash
# 若部署失敗，回滾至上一版本
docker compose down
git checkout HEAD~1
docker compose up -d --build
```
